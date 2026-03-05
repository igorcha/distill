from django.urls import path

from apps.billing.views import CreateCheckoutSessionView, PortalView, WebhookView

urlpatterns = [
    path("create-checkout-session/", CreateCheckoutSessionView.as_view()),
    path("webhook/", WebhookView.as_view()),
    path("portal/", PortalView.as_view()),
]
