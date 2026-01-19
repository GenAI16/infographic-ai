'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CreditsDisplay } from '@/app/components/CreditsDisplay';

export default function PaymentReturnPage() {
  const [tick, setTick] = useState(0);

  // Nudge CreditsDisplay to refresh after landing here
  useEffect(() => {
    const timer = setTimeout(() => setTick((t) => t + 1), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Payment Received</h1>
        <p className="text-slate-600 mt-3">
          If your payment succeeded, your credits will refresh shortly once the webhook finishes processing.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <CreditsDisplay refreshTrigger={tick} />
        </div>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
          >
            Back to Home
          </Link>
          <Link
            href="/pricing"
            className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 shadow"
          >
            Buy More Credits
          </Link>
        </div>
      </section>
    </main>
  );
}