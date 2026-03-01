from django.urls import path

from apps.ai.views import ExtractPDFView, ExtractYouTubeView, GenerateFlashcardsView

urlpatterns = [
    path("generate/", GenerateFlashcardsView.as_view(), name="generate_flashcards"),
    path("extract/pdf/", ExtractPDFView.as_view(), name="extract_pdf"),
    path("extract/youtube/", ExtractYouTubeView.as_view(), name="extract_youtube"),
]
