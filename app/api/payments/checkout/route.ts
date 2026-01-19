import { NextResponse } from 'next/server'
import DodoPayments from 'dodopayments'
import { createClient } from '@/lib/supabase/server'

type CheckoutBody = {
  packageId: string
}

export async function POST(req: Request) {
  try {
    const { packageId } = (await req.json()) as CheckoutBody
    if (!packageId) {
      return NextResponse.json({ error: 'packageId is required' }, { status: 400 })
    }

    // Auth (user must be logged in)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find active credit package and its mapped Dodo product id
    const { data: pkg, error: pkgErr } = await supabase
      .from('credit_packages')
      .select('id, name, description, credits, price, currency, is_active, dodo_product_id')
      .eq('id', packageId)
      .eq('is_active', true)
      .single()

    if (pkgErr || !pkg) {
      return NextResponse.json({ error: 'Package not found or inactive' }, { status: 404 })
    }
    if (!pkg.dodo_product_id) {
      return NextResponse.json({ error: 'Package is not configured for Dodo checkout' }, { status: 422 })
    }

    // Dodo client
    const apiKey = process.env.DODO_PAYMENTS_API_KEY
    const envVar = process.env.DODO_PAYMENTS_ENVIRONMENT
    const environment: 'live_mode' | 'test_mode' =
      envVar === 'live_mode' ? 'live_mode' : 'test_mode'
    const returnUrl = process.env.DODO_PAYMENTS_RETURN_URL
    if (!apiKey || !returnUrl) {
      return NextResponse.json(
        { error: 'Server misconfiguration: missing Dodo env vars' },
        { status: 500 }
      )
    }

    const dodo = new DodoPayments({
      bearerToken: apiKey,
      environment, // 'test_mode' | 'live_mode'
    })

    // Minimal address is allowed; provide country for tax when possible. Default US.
    const billingCountry =
      (user.user_metadata && (user.user_metadata.country as string)) || 'US'

    // Create Checkout Session (one-time)
    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: pkg.dodo_product_id as string,
          quantity: 1,
        },
      ],
      customer: {
        email: user.email,
        name:
          (user.user_metadata && (user.user_metadata.full_name as string)) ||
          undefined,
      },
      billing_address: {
        country: billingCountry,
      },
      minimal_address: true,
      return_url: returnUrl,
      // Always include card rails as fallback
      allowed_payment_method_types: ['credit', 'debit', 'apple_pay', 'google_pay'],
      metadata: {
        // Store essentials to award credits in webhook
        user_id: user.id,
        package_id: pkg.id,
        credits: String(pkg.credits),
        source: 'infographic-ai',
      },
      feature_flags: {
        allow_customer_editing_email: true,
        allow_customer_editing_country: true,
        allow_discount_code: false,
      },
    } as any)

    // Respond with Checkout URL
    // SDK shape usually returns checkout_url or url. Prefer checkout_url, fallback to url if present.
    const url = (session as any).checkout_url || (session as any).url
    const sessionId = (session as any).session_id || (session as any).id

    if (!url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 502 }
      )
    }

    return NextResponse.json({ url, session_id: sessionId })
  } catch (err: any) {
    console.error('Dodo checkout error:', err)
    return NextResponse.json(
      { error: 'Internal Server Error', details: err?.message ?? 'unknown' },
      { status: 500 }
    )
  }
}