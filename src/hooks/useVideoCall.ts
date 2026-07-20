"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// 1:1 WebRTC video calling, signaled over a Supabase Realtime broadcast
// channel scoped to the chat room (`call:${roomId}`) — broadcast messages
// are ephemeral pub/sub, never touch the database, which is exactly what
// SDP offer/answer/ICE-candidate exchange needs.
//
// Known scope limits (documented, not silently swept under the rug):
// - STUN only, no TURN relay — public Google STUN servers resolve most
//   same-network/simple-NAT cases (plausible for students on the same campus
//   Wi-Fi), but a call across two sufficiently restrictive/symmetric NATs can
//   fail to establish a direct P2P connection. Adding TURN needs a relay
//   server (e.g. Twilio/Cloudflare/coturn), which needs real infrastructure
//   and credentials this session doesn't have — flagged as a follow-up.
// - Only rings while both users have this specific conversation open in
//   their browser — there's no global "incoming call" listener elsewhere in
//   the app, and no push notification for an incoming call.
// - No call history is persisted (purely ephemeral signaling).

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

type CallStatus = "idle" | "calling" | "ringing" | "connected" | "ended";

interface SignalPayload {
  from: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export function useVideoCall(roomId: string | null, profileId: string | undefined) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [callerProfileId, setCallerProfileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const supabase = createClient();

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pendingOfferRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  const endCall = useCallback(
    (notifyPeer = true) => {
      if (notifyPeer && channelRef.current) {
        channelRef.current.send({ type: "broadcast", event: "hangup", payload: { from: profileId } });
      }
      cleanup();
      setStatus("idle");
      setCallerProfileId(null);
    },
    [cleanup, profileId]
  );

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => {
      if (e.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { from: profileId, candidate: e.candidate.toJSON() },
        });
      }
    };
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setStatus("connected");
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setError("Call connection lost");
        endCall(false);
      }
    };
    pcRef.current = pc;
    return pc;
  }, [profileId, endCall]);

  const attachLocalStream = useCallback(async (pc: RTCPeerConnection) => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  }, []);

  const startCall = useCallback(async () => {
    if (!channelRef.current || !profileId) return;
    setError(null);
    try {
      const pc = createPeerConnection();
      await attachLocalStream(pc);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      channelRef.current.send({ type: "broadcast", event: "offer", payload: { from: profileId, sdp: offer } });
      setStatus("calling");
    } catch {
      setError("Couldn't access camera/microphone");
      cleanup();
    }
  }, [createPeerConnection, attachLocalStream, cleanup, profileId]);

  const acceptCall = useCallback(async () => {
    if (!channelRef.current || !pendingOfferRef.current || !profileId) return;
    setError(null);
    try {
      const pc = createPeerConnection();
      await attachLocalStream(pc);
      await pc.setRemoteDescription(pendingOfferRef.current);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      channelRef.current.send({ type: "broadcast", event: "answer", payload: { from: profileId, sdp: answer } });
      pendingOfferRef.current = null;
      setStatus("connected");
    } catch {
      setError("Couldn't access camera/microphone");
      cleanup();
    }
  }, [createPeerConnection, attachLocalStream, cleanup, profileId]);

  const rejectCall = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({ type: "broadcast", event: "hangup", payload: { from: profileId } });
    }
    pendingOfferRef.current = null;
    setStatus("idle");
    setCallerProfileId(null);
  }, [profileId]);

  useEffect(() => {
    if (!roomId || !profileId) return;

    const channel = supabase
      .channel(`call:${roomId}`)
      .on("broadcast", { event: "offer" }, ({ payload }: { payload: SignalPayload }) => {
        if (payload.from === profileId || !payload.sdp) return;
        pendingOfferRef.current = payload.sdp;
        setCallerProfileId(payload.from);
        setStatus("ringing");
      })
      .on("broadcast", { event: "answer" }, async ({ payload }: { payload: SignalPayload }) => {
        if (payload.from === profileId || !payload.sdp || !pcRef.current) return;
        await pcRef.current.setRemoteDescription(payload.sdp);
        setStatus("connected");
      })
      .on("broadcast", { event: "ice-candidate" }, async ({ payload }: { payload: SignalPayload }) => {
        if (payload.from === profileId || !payload.candidate || !pcRef.current) return;
        try {
          await pcRef.current.addIceCandidate(payload.candidate);
        } catch {
          // Candidates that arrive before the remote description is set are
          // harmless to drop — ICE gathering sends several candidates and
          // only needs one to succeed.
        }
      })
      .on("broadcast", { event: "hangup" }, ({ payload }: { payload: { from: string } }) => {
        if (payload.from === profileId) return;
        cleanup();
        setStatus("idle");
        setCallerProfileId(null);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      cleanup();
      setStatus("idle");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, profileId]);

  return {
    status,
    error,
    callerProfileId,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  };
}
