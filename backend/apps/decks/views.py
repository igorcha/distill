from rest_framework.generics import (
    CreateAPIView,
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)

from apps.decks.serializers import DeckDetailSerializer, DeckSerializer, FlashcardSerializer
from apps.decks.services import get_user_deck, get_user_decks, get_user_flashcard


class DeckListCreateView(ListCreateAPIView):
    serializer_class = DeckSerializer

    def get_queryset(self):
        return get_user_decks(self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DeckDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = DeckDetailSerializer

    def get_object(self):
        return get_user_deck(self.request.user, self.kwargs["pk"])


class FlashcardCreateView(CreateAPIView):
    serializer_class = FlashcardSerializer

    def perform_create(self, serializer):
        deck = get_user_deck(self.request.user, self.kwargs["deck_id"])
        serializer.save(deck=deck)


class FlashcardDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = FlashcardSerializer

    def get_object(self):
        return get_user_flashcard(self.request.user, self.kwargs["pk"])
