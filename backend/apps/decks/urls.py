from django.urls import path

from apps.decks.views import (
    DeckDetailView,
    DeckListCreateView,
    FlashcardCreateView,
    FlashcardDetailView,
)

urlpatterns = [
    path("decks/", DeckListCreateView.as_view(), name="deck_list_create"),
    path("decks/<uuid:pk>/", DeckDetailView.as_view(), name="deck_detail"),
    path("decks/<uuid:deck_id>/cards/", FlashcardCreateView.as_view(), name="flashcard_create"),
    path("cards/<uuid:pk>/", FlashcardDetailView.as_view(), name="flashcard_detail"),
]
