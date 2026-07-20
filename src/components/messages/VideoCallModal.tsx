"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff } from "lucide-react";
import { useState } from "react";
import type { RefObject } from "react";

interface VideoCallModalProps {
  status: "idle" | "calling" | "ringing" | "connected" | "ended";
  error: string | null;
  callerName?: string;
  localVideoRef: RefObject<HTMLVideoElement | null>;
  remoteVideoRef: RefObject<HTMLVideoElement | null>;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
}

export function VideoCallModal({
  status, error, callerName, localVideoRef, remoteVideoRef, onAccept, onReject, onEnd,
}: VideoCallModalProps) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  if (status === "idle") return null;

  const toggleMic = () => {
    const stream = localVideoRef.current?.srcObject as MediaStream | null;
    stream?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMicOn((v) => !v);
  };

  const toggleCam = () => {
    const stream = localVideoRef.current?.srcObject as MediaStream | null;
    stream?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setCamOn((v) => !v);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
      >
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/30 text-red-300 text-sm px-4 py-2 rounded-xl">
            {error}
          </div>
        )}

        {status === "ringing" ? (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-3xl font-bold animate-pulse">
              {callerName?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <div className="text-white font-display font-bold text-xl">{callerName || "Someone"}</div>
              <div className="text-white/60 text-sm">Incoming video call…</div>
            </div>
            <div className="flex items-center justify-center gap-6">
              <button onClick={onReject} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors">
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
              <button onClick={onAccept} className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition-colors">
                <Phone className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <video ref={remoteVideoRef as RefObject<HTMLVideoElement>} autoPlay playsInline className="max-w-full max-h-full rounded-2xl bg-white/5" />
            {status === "calling" && (
              <div className="absolute text-white/70 text-sm">Calling…</div>
            )}
            <video ref={localVideoRef as RefObject<HTMLVideoElement>} autoPlay playsInline muted
              className="absolute bottom-24 right-4 w-32 h-24 sm:w-40 sm:h-28 rounded-xl border border-white/20 object-cover bg-black" />

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <button onClick={toggleMic} className="w-12 h-12 rounded-full glass border border-white/20 flex items-center justify-center hover:bg-white/10">
                {micOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
              </button>
              <button onClick={onEnd} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center">
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
              <button onClick={toggleCam} className="w-12 h-12 rounded-full glass border border-white/20 flex items-center justify-center hover:bg-white/10">
                {camOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
