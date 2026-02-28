import logging

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai.serializers import GenerateSerializer
from apps.ai.services import PDF_MAX_FILE_SIZE_MB, extract_pdf_text, generate_flashcards

logger = logging.getLogger(__name__)


class GenerateFlashcardsView(APIView):
    def post(self, request):
        serializer = GenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cards_data = generate_flashcards(text=serializer.validated_data["text"])

        return Response(cards_data)


class ExtractPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get("pdf")
        if not file:
            return Response(
                {"detail": "No PDF file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not file.name.lower().endswith(".pdf"):
            return Response(
                {"detail": "Invalid file type. Please upload a PDF."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        max_bytes = PDF_MAX_FILE_SIZE_MB * 1024 * 1024
        if file.size > max_bytes:
            return Response(
                {"detail": f"PDF must be under {PDF_MAX_FILE_SIZE_MB}MB."},
                status=413,
            )

        try:
            result = extract_pdf_text(file)
            return Response(result)
        except Exception:
            logger.exception("PDF extraction failed")
            return Response(
                {"detail": "Failed to extract PDF. The file may be corrupted."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
