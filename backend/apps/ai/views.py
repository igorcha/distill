from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai.serializers import GenerateSerializer
from apps.ai.services import generate_flashcards


class GenerateFlashcardsView(APIView):
    def post(self, request):
        serializer = GenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cards_data = generate_flashcards(text=serializer.validated_data["text"])

        return Response(cards_data)
