import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl">Terms of Service</h1>
            <p className="text-xs text-muted-foreground">Last updated July 2026</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          These terms cover your use of KampusPulse — the marketplace (EDWOM), task platform
          (Y3 ADWUMA) and rides/delivery service (EZZYRIDE) built for University of Cape Coast
          students. By creating an account you agree to the points below.
        </p>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-base text-foreground">Your account</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You&apos;re responsible for the accuracy of the information on your profile and for
            activity that happens under your account. Accounts are personal and shouldn&apos;t be
            shared or transferred.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-base text-foreground">Marketplace &amp; tasks</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sellers are responsible for the items they list and their condition/availability. Task
            posters are responsible for paying agreed rewards for completed work, and workers are
            responsible for delivering what they agreed to. KampusPulse facilitates the connection
            and payment but is not a party to the underlying sale or work agreement.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-base text-foreground">Rides &amp; delivery</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            EZZYRIDE riders and passengers agree to conduct themselves safely and respectfully.
            Fares shown are estimates and may be confirmed as actual fares at trip completion.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-base text-foreground">Payments &amp; refunds</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Payments are processed through Paystack. Refunds, where applicable, are reviewed and
            issued by KampusPulse admins back to the original payment method.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-base text-foreground">Acceptable use</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Don&apos;t use KampusPulse to list prohibited items, harass other users, or attempt to
            defraud buyers, sellers, task posters, workers, riders or passengers. Accounts that
            violate these terms may be suspended or banned.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-base text-foreground">Changes</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update these terms as the platform evolves. Continued use of KampusPulse after a
            change means you accept the updated terms.
          </p>
        </section>
      </div>
    </div>
  );
}
