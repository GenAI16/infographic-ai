import { createClient } from '@/lib/supabase/server'
import { BuyButton } from '@/app/components/BuyButton'

function formatUSD(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default async function PricingPage() {
  const supabase = await createClient()

  const { data: packages, error } = await supabase
    .from('credit_packages')
    .select('id, name, description, credits, price, currency, is_popular, is_active, sort_order, dodo_product_id')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    return (
      <main className="min-h-screen bg-white">
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Pricing</h1>
          <p className="text-red-600">Failed to load packages. Please try again later.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900">Buy Credits</h1>
          <p className="text-slate-600 mt-2">Choose the package that fits your needs. Credits are one-time purchases.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {(packages || []).map((pkg) => {
            const canBuy = !!pkg.dodo_product_id
            return (
              <div key={pkg.id} className={`rounded-xl border ${pkg.is_popular ? 'border-purple-300 ring-2 ring-purple-100' : 'border-slate-200'} p-5 bg-white shadow-sm`}>
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">{pkg.name}</h2>
                  {pkg.is_popular && (
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Popular</span>
                  )}
                </div>
                {pkg.description && (
                  <p className="text-sm text-slate-600 mt-1">{pkg.description}</p>
                )}

                <div className="mt-4">
                  <div className="text-3xl font-bold text-slate-900">{formatUSD(pkg.price)}</div>
                  <div className="text-sm text-slate-500">{pkg.credits} credits</div>
                </div>

                <div className="mt-6">
                  {canBuy ? (
                    <BuyButton packageId={pkg.id} label={`Buy ${formatUSD(pkg.price)}`} />
                  ) : (
                    <button
                      disabled
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-slate-200 text-slate-600 font-medium cursor-not-allowed"
                      title="This package is not configured for checkout yet"
                    >
                      Not available
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-slate-500 mt-6">
          All payments are processed securely by Dodo Payments. Prices shown in USD. Taxes may apply based on your location.
        </p>
      </section>
    </main>
  )
}