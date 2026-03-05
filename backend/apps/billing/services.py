import logging

import stripe
from django.conf import settings

from apps.users.models import UserProfile

logger = logging.getLogger(__name__)

stripe.api_key = settings.STRIPE_SECRET_KEY

PRICE_MAP = {
    "monthly": settings.STRIPE_PRICE_MONTHLY,
    "yearly": settings.STRIPE_PRICE_YEARLY,
}


def get_or_create_stripe_customer(user):
    profile = user.profile
    if profile.stripe_customer_id:
        return profile.stripe_customer_id

    customer = stripe.Customer.create(
        email=user.email,
        metadata={"user_id": str(user.id)},
    )
    profile.stripe_customer_id = customer.id
    profile.save(update_fields=["stripe_customer_id"])
    return customer.id


def create_checkout_session(user, plan):
    price_id = PRICE_MAP[plan]
    customer_id = get_or_create_stripe_customer(user)

    session = stripe.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{settings.FRONTEND_URL}/settings?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.FRONTEND_URL}/settings",
        metadata={"user_id": str(user.id)},
    )
    return session.url


def create_portal_session(user):
    customer_id = get_or_create_stripe_customer(user)

    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{settings.FRONTEND_URL}/settings",
    )
    return session.url


def handle_checkout_completed(session):
    customer_id = session["customer"]
    subscription_id = session["subscription"]

    try:
        profile = UserProfile.objects.get(stripe_customer_id=customer_id)
    except UserProfile.DoesNotExist:
        logger.error(
            "checkout.session.completed: no profile for customer %s", customer_id
        )
        return

    profile.tier = UserProfile.TIER_PRO
    profile.subscription_id = subscription_id
    profile.save(update_fields=["tier", "subscription_id"])
    logger.info("User %s upgraded to pro", profile.user.email)


def handle_subscription_deleted(subscription):
    subscription_id = subscription["id"]

    try:
        profile = UserProfile.objects.get(subscription_id=subscription_id)
    except UserProfile.DoesNotExist:
        logger.error(
            "customer.subscription.deleted: no profile for subscription %s",
            subscription_id,
        )
        return

    profile.tier = UserProfile.TIER_FREE
    profile.subscription_id = None
    profile.save(update_fields=["tier", "subscription_id"])
    logger.info("User %s downgraded to free", profile.user.email)


def handle_payment_failed(invoice):
    customer_id = invoice["customer"]
    logger.warning(
        "invoice.payment_failed for customer %s, invoice %s",
        customer_id,
        invoice["id"],
    )
