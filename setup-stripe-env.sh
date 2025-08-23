#!/bin/bash

echo "🔧 Setting up Stripe environment variables for Cloudflare Workers..."
echo

echo "⚠️  IMPORTANT: You need to get your real Stripe API keys from:"
echo "   https://dashboard.stripe.com/test/apikeys"
echo

echo "📋 Please enter your Stripe API keys:"
echo

read -p "Enter your Stripe Secret Key (sk_test_...): " STRIPE_SECRET_KEY
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "❌ Stripe Secret Key is required!"
    exit 1
fi

read -p "Enter your Stripe Webhook Secret (whsec_...): " STRIPE_WEBHOOK_SECRET
if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo "❌ Stripe Webhook Secret is required!"
    exit 1
fi

echo
echo "🚀 Setting Cloudflare Workers secrets..."

echo "Setting STRIPE_SECRET_KEY..."
echo "$STRIPE_SECRET_KEY" | wrangler secret put STRIPE_SECRET_KEY --env production
if [ $? -ne 0 ]; then
    echo "❌ Failed to set STRIPE_SECRET_KEY"
    exit 1
fi

echo "Setting STRIPE_WEBHOOK_SECRET..."
echo "$STRIPE_WEBHOOK_SECRET" | wrangler secret put STRIPE_WEBHOOK_SECRET --env production
if [ $? -ne 0 ]; then
    echo "❌ Failed to set STRIPE_WEBHOOK_SECRET"
    exit 1
fi

echo
echo "✅ Stripe environment variables set successfully!"
echo
echo "📋 Next steps:"
echo "1. Update your .env file with the Stripe Publishable Key"
echo "2. Configure webhook endpoint in Stripe Dashboard:"
echo "   URL: https://destiny-backend.rocky-liang.workers.dev/api/stripe/webhook"
echo "   Events: payment_intent.succeeded, invoice.payment_succeeded, invoice.payment_failed, customer.subscription.deleted"
echo "3. Test the payment system"
echo
