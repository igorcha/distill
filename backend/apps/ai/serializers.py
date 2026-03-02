from rest_framework import serializers


class GenerateSerializer(serializers.Serializer):
    input_type = serializers.ChoiceField(
        choices=("text", "pdf", "youtube"),
        default="text",
    )
    text = serializers.CharField(min_length=50, max_length=50000)
