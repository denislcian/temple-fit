// Edge Function (Deno) — Webhook de Stripe para el premium (Payment Links).
//
// Escucha los eventos de la cuenta y mantiene profiles.premium_until:
//   · checkout.session.completed  → activa premium (client_reference_id = user_id
//     de Supabase, que la app añade a la URL del Payment Link).
//   · customer.subscription.updated → renueva/ajusta la caducidad.
//   · customer.subscription.deleted → corta el premium.
//
// Seguridad: NO usa JWT (desplegar con --no-verify-jwt); la autenticidad la
// garantiza la FIRMA de Stripe (constructEventAsync + STRIPE_WEBHOOK_SECRET).
//
// Secretos necesarios (supabase secrets set):
//   STRIPE_API_KEY        — clave secreta de Stripe (sk_live_… / sk_test_…).
//   STRIPE_WEBHOOK_SECRET — signing secret del endpoint (whsec_…).
import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') ?? '', {
  apiVersion: '2024-06-20',
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

/** Margen de gracia sobre el fin de periodo (reintentos de cobro, husos…). */
const GRACE_DAYS = 3;

function admin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

function untilFromPeriodEnd(periodEndSeconds: number): string {
  return new Date(periodEndSeconds * 1000 + GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method', { status: 405 });

  const signature = req.headers.get('stripe-signature');
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!signature || !secret) return new Response('config', { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret, undefined, cryptoProvider);
  } catch {
    return new Response('bad signature', { status: 400 });
  }

  const db = admin();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
    if (session.mode === 'subscription' && userId && subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      await db
        .from('profiles')
        .update({
          premium_until: untilFromPeriodEnd(sub.current_period_end),
          stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
          stripe_subscription_id: subscriptionId,
        })
        .eq('user_id', userId);
    }
  } else if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription;
    if (sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due') {
      await db
        .from('profiles')
        .update({ premium_until: untilFromPeriodEnd(sub.current_period_end) })
        .eq('stripe_subscription_id', sub.id);
    }
    // canceled con cancel_at_period_end: se deja expirar solo (until ya puesto).
  } else if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    await db
      .from('profiles')
      .update({ premium_until: new Date().toISOString() })
      .eq('stripe_subscription_id', sub.id);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
