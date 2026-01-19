'use client';

import { useState } from 'react';

interface BuyButtonProps {
  packageId: string;
  label?: string;
  className?: string;
}

export function BuyButton({ packageId, label = 'Buy', className = '' }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Checkout failed (${res.status})`);
      }

      const data = await res.json();
      const url = data?.url || data?.checkout_url;
      if (!url) throw new Error('Missing checkout_url in response');

      // Redirect to hosted checkout
      window.location.href = url as string;
    } catch (e: any) {
      setErr(e?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch">
      <button
        onClick={handleClick}
        disabled={loading}
        className={
          className ||
          'w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-60'
        }
      >
        {loading ? 'Redirecting…' : label}
      </button>
      {err && <p className="mt-2 text-xs text-red-600 text-center">{err}</p>}
    </div>
  );
}