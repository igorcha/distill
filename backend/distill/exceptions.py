from django_ratelimit.exceptions import Ratelimited
from rest_framework.response import Response
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    if isinstance(exc, Ratelimited):
        return Response(
            {"detail": "Too many requests. Please slow down and try again later."},
            status=429,
        )

    return exception_handler(exc, context)
