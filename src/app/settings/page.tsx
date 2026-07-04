"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { Bell, Shield, Moon, Globe, Trash2, LogOut, ChevronRight, User, CreditCard, Smartphone, Loader2, Check, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { useProfile } from "@/hooks";

const HALLS_OF_RESIDENCE = [
  "Atlantic Hall", "Casely Hayford Hall", "Adehye Hall",
  "Valco Hall", "Kwame Nkrumah Hall", "Off Campus / Other",
];

const settingSections = [
  {
    title: "Account",
    items: [
      { label: "Verification & ID", icon: Shield, href: "#" },
      { label: "Change Password", icon: Shield, href: "#" },
    ],
  },
  {
    title: "Notifications",
    items: [
      { label: "Push Notifications", icon: Bell, toggle: true, key: "push" },
      { label: "Email Notifications", icon: Bell, toggle: true, key: "email" },
      { label: "SMS Alerts", icon: Smartphone, toggle: true, key: "sms" },
    ],
  },
  {
    title: "Payments",
    items: [
      { label: "Saved Payment Methods", icon: CreditCard, href: "#" },
      { label: "Transaction History", icon: CreditCard, href: "/transactions" },
    ],
  },
  {
    title: "More",
    items: [
      { label: "Language", icon: Globe, value: "English (Ghana)", href: "#" },
      { label: "Privacy Policy", icon: Shield, href: "/privacy" },
      { label: "Terms of Service", icon: Shield, href: "/terms" },
    ],
  },
];

interface ProfileFormState {
  full_name: string;
  bio: string;
  phone: string;
  department: string;
  hall_of_residence: string;
  year_of_study: string;
}

const emptyProfileForm: ProfileFormState = {
  full_name: "", bio: "", phone: "", department: "", hall_of_residence: "", year_of_study: "",
};

export default function SettingsPage() {
  const { signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const [toggles, setToggles] = useState({ push: true, email: true, sms: false });

  useEffect(() => {
    if (profile?.notification_preferences) setToggles(profile.notification_preferences);
  }, [profile]);

  const toggle = async (key: string) => {
    const next = { ...toggles, [key]: !toggles[key as keyof typeof toggles] };
    setToggles(next);
    await updateProfile({ notification_preferences: next });
  };

  const [profileForm, setProfileForm] = useState<ProfileFormState>(emptyProfileForm);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      full_name: profile.full_name || "",
      bio: profile.bio || "",
      phone: profile.phone || "",
      department: profile.department || "",
      hall_of_residence: profile.hall_of_residence || "",
      year_of_study: profile.year_of_study ? String(profile.year_of_study) : "",
    });
  }, [profile]);

  const handleProfileFieldChange = (field: keyof ProfileFormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setProfileForm(prev => ({ ...prev, [field]: e.target.value }));
    };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setSaveStatus("idle");
    const ok = await updateProfile({
      full_name: profileForm.full_name,
      bio: profileForm.bio,
      phone: profileForm.phone,
      department: profileForm.department,
      hall_of_residence: profileForm.hall_of_residence,
      year_of_study: profileForm.year_of_study ? parseInt(profileForm.year_of_study, 10) : null,
    });
    setSavingProfile(false);
    setSaveStatus(ok ? "success" : "error");
    if (ok) setTimeout(() => setSaveStatus("idle"), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display font-black text-3xl mb-1">Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your KampusPulse preferences</p>
          </motion.div>

          {/* Theme */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Moon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-sm">App Theme</div>
                  <div className="text-xs text-muted-foreground">Toggle dark / light mode</div>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </motion.div>

          {/* Edit Profile */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Edit Profile</h2>
            </div>

            {profileLoading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Full Name</label>
                    <input id="settings-full-name" type="text" value={profileForm.full_name}
                      onChange={handleProfileFieldChange("full_name")}
                      placeholder="Your full name" className="input-premium" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Phone</label>
                    <input id="settings-phone" type="tel" value={profileForm.phone}
                      onChange={handleProfileFieldChange("phone")}
                      placeholder="024X XXX XXX" className="input-premium" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Department</label>
                    <input id="settings-department" type="text" value={profileForm.department}
                      onChange={handleProfileFieldChange("department")}
                      placeholder="e.g. Computer Science" className="input-premium" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Year of Study</label>
                    <select id="settings-year" value={profileForm.year_of_study}
                      onChange={handleProfileFieldChange("year_of_study")}
                      className="input-premium">
                      <option value="">Select year...</option>
                      {[1, 2, 3, 4, 5, 6].map(y => (
                        <option key={y} value={y}>Level {y * 100}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Hall of Residence</label>
                    <select id="settings-hall" value={profileForm.hall_of_residence}
                      onChange={handleProfileFieldChange("hall_of_residence")}
                      className="input-premium">
                      <option value="">Select your hall...</option>
                      {HALLS_OF_RESIDENCE.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Bio</label>
                    <textarea id="settings-bio" value={profileForm.bio}
                      onChange={handleProfileFieldChange("bio")}
                      placeholder="Tell others a bit about yourself" rows={3}
                      className="input-premium resize-none" />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button id="save-profile-btn" onClick={handleSaveProfile} disabled={savingProfile}
                    className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50">
                    {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                  {saveStatus === "success" && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-400">
                      <Check className="w-3.5 h-3.5" /> Saved
                    </span>
                  )}
                  {saveStatus === "error" && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
                      <AlertCircle className="w-3.5 h-3.5" /> Failed to save. Try again.
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Setting sections */}
          {settingSections.map((section, si) => (
            <motion.div key={section.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + si * 0.05 }} className="glass-card overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{section.title}</h2>
              </div>
              <div className="divide-y divide-white/5">
                {section.items.map((item) => {
                  const isToggle = "toggle" in item && item.toggle;
                  const isRealLink = "href" in item && item.href !== "#";
                  const content = (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                        {"value" in item && item.value && <span className="text-xs text-muted-foreground ml-2">{item.value}</span>}
                      </div>
                      {isToggle ? (
                        <button onClick={() => toggle(item.key!)}
                          className={`relative w-11 h-6 rounded-full transition-all ${toggles[item.key as keyof typeof toggles] ? "bg-blue-500" : "bg-white/20"}`}>
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${toggles[item.key as keyof typeof toggles] ? "left-5" : "left-0.5"}`} />
                        </button>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </>
                  );

                  if (isRealLink) {
                    return (
                      <Link key={item.label} href={item.href!} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors">
                        {content}
                      </Link>
                    );
                  }
                  return (
                    <div key={item.label} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors">
                      {content}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}

          {/* Danger zone */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden border border-red-500/10">
            <div className="px-5 py-3 border-b border-red-500/10">
              <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Danger Zone</h2>
            </div>
            <div className="divide-y divide-white/5">
              <button onClick={signOut} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-red-500/5 transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-sm font-medium text-red-400">Sign Out</span>
              </button>
              <button className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-red-500/5 transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-sm font-medium text-red-400">Delete Account</span>
              </button>
            </div>
          </motion.div>

          <p className="text-center text-xs text-muted-foreground pb-4">KampusPulse v1.0 · University of Cape Coast</p>
    </div>
  );
}
