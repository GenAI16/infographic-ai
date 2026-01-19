import { NextResponse } from 'next/server'
import { Webhooks } from '@dodopayments/nextjs'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Dodo Payments Webhook Endpoint
 *
 * Security:
 * - Uses @dodopayments/nextjs to verify webhook signature with DODO_PAYMENTS_WEBHOOK_SECRET
 * - Only processes payment.succeeded events
 * - Idempotent via unique purchases.transaction_id (set in migration 004)
 */
export const dynamic = 'force-dynamic'

const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET

if (!webhookSecret) {
  // Fail-fast on boot if missing secret (helps during deployment)
  console.warn('[Dodo Webhook] Missing DODO_PAYMENTS_WEBHOOK_SECRET')
}

type AnyPayload = Record<string, any>

/**
 * Extract helper: tries multiple paths to get a value safely.
 */
function pick<T = any>(obj: AnyPayload, paths: string[], fallback?: T): T | undefined {
  for (const p of paths) {
    const parts = p.split('.')
    let cur: any = obj
    let ok = true
    for (const part of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, part)) {
        cur = cur[part]
      } else {
        ok = false
        break
      }
    }
    if (ok && cur !== undefined && cur !== null) return cur as T
  }
  return fallback
}

/**
 * Webhook handler using Dodo Adapters (Next.js)
 * - onPayload gives raw verified payload for advanced handling
 * - You may also add onPaymentSucceeded handlers if available in your adapter version
 */
export const POST = Webhooks({
  webhookKey: webhookSecret!,
  onPayload: async (payload: AnyPayload) => {
    try {
      const admin = createAdminClient()

      // Event type guard
      const eventType =
        payload?.type ||
        payload?.event_type ||
        pick<string>(payload, ['data.type', 'data.event_type'])

      if (eventType !== 'payment.succeeded') {
        // Ignore other events
        return
      }

      // Extract identifiers and metadata
      const paymentId =
        pick<string>(payload, ['payment_id', 'data.payment_id', 'data.payment.payment_id']) || ''
      const currency =
        pick<string>(payload, ['currency', 'data.currency', 'data.payment.currency']) || 'USD'
      const amountCents =
        pick<number>(payload, ['total_amount', 'data.total_amount', 'data.payment.total_amount'], 0) ||
        0

      const metadata =
        (pick<Record<string, any>>(payload, ['metadata', 'data.metadata', 'data.payment.metadata']) as
          | Record<string, any>
          | undefined) || {}

      const userId = metadata.user_id as string | undefined
      const packageId = metadata.package_id as string | undefined
      const creditsRaw = metadata.credits as string | number | undefined
      const credits =
        typeof creditsRaw === 'string'
          ? parseInt(creditsRaw, 10)
          : typeof creditsRaw === 'number'
          ? Math.floor(creditsRaw)
          : undefined

      if (!paymentId) {
        console.error('[Dodo Webhook] Missing payment_id in payload')
        return
      }
      if (!userId) {
        console.error('[Dodo Webhook] Missing user_id in metadata')
        return
      }
      if (!credits || Number.isNaN(credits) || credits <= 0) {
        console.error('[Dodo Webhook] Missing or invalid credits in metadata')
        return
      }

      // Idempotency: if a completed purchase with this transaction_id already exists, exit
      const { data: existing, error: existingErr } = await admin
        .from('purchases')
        .select('id, payment_status')
        .eq('transaction_id', paymentId)
        .maybeSingle()

      if (existingErr) {
        console.error('[Dodo Webhook] Failed to check existing purchase:', existingErr)
        return
      }
      if (existing && existing.payment_status === 'completed') {
        // Already processed
        return
      }

      // Insert purchase row
      const amountDecimal = (amountCents || 0) / 100
      const { data: inserted, error: insertErr } = await admin
        .from('purchases')
        .insert({
          user_id: userId,
          credits_purchased: credits,
          amount_paid: amountDecimal,
          currency: currency || 'USD',
          payment_provider: 'dodo',
          payment_status: 'completed',
          transaction_id: paymentId,
          metadata: {
            package_id: packageId || null,
            dodo_payload_snapshot: {
              payment_id: paymentId,
              currency,
              total_amount: amountCents,
              metadata,
              type: eventType,
            },
          },
        })
        .select('id')
        .single()

      if (insertErr) {
        // If unique violation occurs due to race, treat as idempotent success
        const msg = String(insertErr.message || '')
        if (msg.includes('uq_purchases_transaction_id')) {
          return
        }
        console.error('[Dodo Webhook] Failed to insert purchase:', insertErr)
        return
      }

      const purchaseId = inserted?.id as string

      // Award credits via RPC helper (keeps audit trail consistent)
      const { error: rpcErr } = await admin.rpc('add_credits_from_purchase', {
        p_user_id: userId,
        p_amount: credits,
        p_purchase_id: purchaseId,
      })

      if (rpcErr) {
        console.error('[Dodo Webhook] add_credits_from_purchase failed:', rpcErr)
        // Optionally, you could downgrade the purchase status or raise an alert
        return
      }
    } catch (err) {
      console.error('[Dodo Webhook] Unhandled error:', err)
      // Let the adapter return 200 to avoid endless retries if adapter treats throws differently.
      // If your adapter supports explicit failure response, you may rethrow to signal retry.
    }
  },
})

export async function GET() {
  // Simple health endpoint for monitoring
  return NextResponse.json({ ok: true })
}