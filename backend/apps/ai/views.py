import logging

from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from youtube_transcript_api._errors import NoTranscriptFound, TranscriptsDisabled

from apps.ai.serializers import GenerateSerializer
from apps.ai.services import (
    PDF_MAX_FILE_SIZE_MB,
    extract_pdf_text,
    extract_youtube_transcript,
    generate_flashcards,
)

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


class ExtractYouTubeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        url = (request.data.get("url") or "").strip()
        if not url:
            return Response(
                {"detail": "No YouTube URL provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        start_seconds = int(request.data.get("start_seconds", 0))
        end_seconds = request.data.get("end_seconds")
        if end_seconds is not None:
            end_seconds = int(end_seconds)

        try:
            result = extract_youtube_transcript(url, start_seconds, end_seconds)
            return Response(result)
        except TranscriptsDisabled:
            return Response(
                {"detail": "This video has transcripts disabled."},
                status=422,
            )
        except NoTranscriptFound:
            return Response(
                {"detail": "No transcript found. The video may not have captions available."},
                status=422,
            )
        except ValidationError as e:
            return Response(
                {"detail": e.detail[0]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            logger.exception("YouTube transcript extraction failed")
            return Response(
                {"detail": "Failed to extract transcript. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
