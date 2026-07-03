"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { requestFcmToken } from "@/lib/firebase/client";
import type { Profile } from "@/types";

async function registerFcmToken() {
  const token = await requestFcmToken();
  if (!token) return;

  await fetch("/api/fcm/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    }),
  });
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (params: SignUpParams) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: "student" | "rider";
  studentId?: string;
  department?: string;
  hallOfResidence?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = useCallback(
    async (currentUser: User) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();
      
      if (data) {
        const profileData = data as Profile;
        // Sync metadata if the database trigger missed it (e.g. email signups).
        // role is allow-listed to "student"/"rider" only — never trust arbitrary
        // client metadata here, since that was a privilege-escalation path (client
        // sets user_metadata.role="admin", this synced it straight into profiles.role).
        // The profiles table also enforces this boundary server-side via a trigger,
        // so this is a convenience sync, not the security check.
        const meta = currentUser.user_metadata || {};
        const updates: Partial<Profile> = {};
        let needsUpdate = false;

        const selfSelectableRoles = ["student", "rider"];
        if (
          selfSelectableRoles.includes(meta.role) &&
          profileData.role !== meta.role
        ) {
          updates.role = meta.role;
          updates.status = meta.role === "student" ? "active" : "pending";
          needsUpdate = true;
        }

        const fields: (keyof Profile)[] = ["phone", "student_id", "department", "hall_of_residence"];
        for (const field of fields) {
          if (meta[field] && profileData[field] !== meta[field]) {
            updates[field] = meta[field];
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          const { data: updatedData } = await supabase
            .from("profiles")
            .update(updates as never)
            .eq("id", profileData.id)
            .select()
            .single();
            
          if (updatedData) {
            setProfile(updatedData as Profile);
            return;
          }
        }

        setProfile(profileData as Profile);
      }
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user);
  }, [user, fetchProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
        registerFcmToken();
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user);
        registerFcmToken();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) registerFcmToken();
    return { error: error?.message ?? null };
  };

  const signUp = async (params: SignUpParams) => {
    const { error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.fullName,
          phone: params.phone,
          role: params.role,
          student_id: params.studentId,
          department: params.department,
          hall_of_residence: params.hallOfResidence,
        },
      },
    });

    if (error) return { error: error.message };

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    window.location.href = "/login";
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
