from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework_simplejwt.tokens import RefreshToken


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


def send_password_reset_email(user):
    token_generator = PasswordResetTokenGenerator()
    token = token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

    send_mail(
        subject="Reset your Distill password",
        message=(
            f"Hi,\n\n"
            f"You requested a password reset. Click the link below to set a new password:\n\n"
            f"{reset_url}\n\n"
            f"If you didn't request this, you can safely ignore this email.\n\n"
            f"— Distill"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )


def send_contact_email(name, email, subject, message):
    send_mail(
        subject=subject,
        message=(
            f"Name: {name}\n"
            f"Email: {email}\n\n"
            f"Message:\n{message}"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.CONTACT_EMAIL],
    )
