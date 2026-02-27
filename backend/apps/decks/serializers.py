from rest_framework import serializers

from apps.decks.models import Deck, Flashcard


class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = ["id", "deck", "front", "back", "order", "created_at"]
        read_only_fields = ["id", "created_at", "deck"]


class DeckSerializer(serializers.ModelSerializer):
    flashcard_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Deck
        fields = ["id", "title", "description", "created_at", "updated_at", "flashcard_count"]
        read_only_fields = ["id", "created_at", "updated_at"]


class DeckDetailSerializer(serializers.ModelSerializer):
    flashcards = FlashcardSerializer(many=True, read_only=True)

    class Meta:
        model = Deck
        fields = ["id", "title", "description", "created_at", "updated_at", "flashcards"]
        read_only_fields = ["id", "created_at", "updated_at"]
