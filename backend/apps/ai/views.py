from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai.serializers import GenerateSerializer
from apps.ai.services import generate_flashcards
from apps.decks.serializers import FlashcardSerializer


class GenerateFlashcardsView(APIView):
    def post(self, request):
        serializer = GenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        flashcards = generate_flashcards(
            text=serializer.validated_data["text"],
            deck_id=serializer.validated_data["deck_id"],
            user=request.user,
        )

        return Response(
            FlashcardSerializer(flashcards, many=True).data,
            status=status.HTTP_201_CREATED,
        )
