import logging

import stripe
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.billing.services import (
    create_checkout_session,
    create_portal_session,
    handle_checkout_completed,
    handle_payment_failed,
    handle_subscription_deleted,
)

logger = logging.getLogger(__name__)


class CreateCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan = request.data.get("plan")
        if plan not in ("monthly", "yearly"):
            return Response(
                {"detail": "Invalid plan. Must be 'monthly' or 'yearly'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.profile.tier == "pro":
            return Response(
                {"detail": "You already have an active Pro subscription."},
                status=status.HTTP_409_CONFLICT,
            )

        try:
            url = create_checkout_session(request.user, plan)
        except stripe.StripeError as e:
            logger.exception("Stripe checkout session creation failed")
            return Response(
                {"detail": "Unable to create checkout session. Please try again later."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"url": url})


class PortalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.profile.stripe_customer_id:
            return Response(
                {"detail": "No billing account found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            url = create_portal_session(request.user)
        except stripe.StripeError:
            logger.exception("Stripe portal session creation failed")
            return Response(
                {"detail": "Unable to open billing portal. Please try again later."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"url": url})


@method_decorator(csrf_exempt, name="dispatch")
class WebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            logger.warning("Stripe webhook: invalid payload")
            return Response(
                {"detail": "Invalid payload."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except stripe.SignatureVerificationError:
            logger.warning("Stripe webhook: invalid signature")
            return Response(
                {"detail": "Invalid signature."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event_type = event["type"]

        if event_type == "checkout.session.completed":
            handle_checkout_completed(event["data"]["object"])
        elif event_type == "customer.subscription.deleted":
            handle_subscription_deleted(event["data"]["object"])
        elif event_type == "invoice.payment_failed":
            handle_payment_failed(event["data"]["object"])

        return Response({"status": "ok"})
