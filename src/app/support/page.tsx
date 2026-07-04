import Link from "next/link";
import { ArrowLeft, LifeBuoy, MessageSquare } from "lucide-react";

export const metadata = {
  title: "Support",
};

export default function SupportPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <LifeBuoy className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl">Support</h1>
            <p className="text-xs text-muted-foreground">We&apos;re here to help</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Having trouble with an order, task, ride or your account? Here&apos;s the fastest way to
          reach us.
        </p>

        <Link href="/messages" className="glass border border-white/10 rounded-2xl p-5 hover:bg-white/5 transition-all flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="font-semibold text-sm">Message Us In-App</div>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              The quickest way to get help — open Messages and send us the details of your issue
              (include an order, task or ride ID if you have one) and we&apos;ll respond as soon as we can.
            </p>
          </div>
        </Link>

        <section className="space-y-2 pt-2 border-t border-white/5">
          <h2 className="font-display font-bold text-base text-foreground">Common questions</h2>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5 leading-relaxed">
            <li>Order or task payment issues — check <Link href="/settings" className="text-blue-400 hover:underline">Settings</Link> for your transaction history, or message us with the order/task ID.</li>
            <li>Ride safety concerns — message us immediately with the ride details.</li>
            <li>Account or profile changes — most fields can be edited from <Link href="/settings" className="text-blue-400 hover:underline">Settings</Link>.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
