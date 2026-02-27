from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import (
    CreateAPIView,
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.decks.models import Deck, Flashcard
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


class BulkCreateFlashcardsView(APIView):
    def post(self, request, deck_id):
        deck = get_object_or_404(Deck, pk=deck_id, user=request.user)

        flashcards_data = request.data.get("flashcards", [])
        if not flashcards_data:
            return Response(
                {"flashcards": ["This field is required and must not be empty."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_count = deck.flashcards.count()
        flashcards = Flashcard.objects.bulk_create([
            Flashcard(
                deck=deck,
                front=card["front"],
                back=card["back"],
                order=existing_count + i,
            )
            for i, card in enumerate(flashcards_data)
        ])

        return Response(
            FlashcardSerializer(flashcards, many=True).data,
            status=status.HTTP_201_CREATED,
        )
