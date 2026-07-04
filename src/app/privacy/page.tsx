import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl">Privacy Policy</h1>
            <p className="text-xs text-muted-foreground">Last updated July 2026</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          KampusPulse is a campus platform for University of Cape Coast students covering a
          marketplace (EDWOM), student task work (Y3 ADWUMA) and campus rides/delivery (EZZYRIDE).
          This page explains, in plain terms, what data we collect and why.
        </p>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-base text-foreground">What we collect</h2>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5 leading-relaxed">
            <li>
              <span className="text-foreground font-medium">Profile information</span> — your name,
              student ID, phone number, department, hall of residence, year of study, bio and avatar
              that you choose to add to your profile.
            </li>
            <li>
              <span className="text-foreground font-medium">Transaction data</span> — orders, tasks,
              payments and refunds you make or receive through EDWOM and Y3 ADWUMA, including amounts,
              status and mobile money references needed to process payments via Paystack.
            </li>
            <li>
              <span className="text-foreground font-medium">Location data</span> — for EZZYRIDE, we
              collect pickup/drop-off coordinates and, while a ride is active, a rider&apos;s live location
              so passengers can track their trip.
            </li>
            <li>
              <span className="text-foreground font-medium">Messages</span> — content you send through
              in-app chat with other users (buyers, sellers, task posters, riders).
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-base text-foreground">How we use it</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Data is used to operate the marketplace, task and ride features you use directly — matching
            buyers and sellers, task posters and workers, riders and passengers — processing payments,
            showing order/ride status, and sending notifications about your own activity. We do not
            sell your personal data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-base text-foreground">Who can see it</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Other users only see what a transaction requires (e.g. a rider sees a passenger&apos;s
            pickup location and phone number for an active ride; a seller sees a buyer&apos;s delivery
            address for an order). Admins can access account and transaction data to moderate the
            platform, resolve disputes and process refunds.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-base text-foreground">Your choices</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You can edit or remove most profile fields at any time from{" "}
            <Link href="/settings" className="text-blue-400 hover:underline">Settings</Link>. To
            delete your account or ask about data we hold on you, reach out via{" "}
            <Link href="/support" className="text-blue-400 hover:underline">Support</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
