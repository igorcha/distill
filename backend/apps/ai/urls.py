from django.urls import path

from apps.ai.views import GenerateFlashcardsView

urlpatterns = [
    path("generate/", GenerateFlashcardsView.as_view(), name="generate_flashcards"),
]
