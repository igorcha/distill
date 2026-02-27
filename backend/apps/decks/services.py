from django.db.models import Count
from django.shortcuts import get_object_or_404

from apps.decks.models import Deck, Flashcard


def get_user_decks(user):
    return Deck.objects.filter(user=user).annotate(flashcard_count=Count("flashcards"))


def get_user_deck(user, deck_id):
    return get_object_or_404(Deck, pk=deck_id, user=user)


def create_deck(user, validated_data):
    return Deck.objects.create(user=user, **validated_data)


def get_user_flashcard(user, flashcard_id):
    return get_object_or_404(Flashcard, pk=flashcard_id, deck__user=user)


def create_flashcard(deck, validated_data):
    return Flashcard.objects.create(deck=deck, **validated_data)
