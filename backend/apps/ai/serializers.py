from rest_framework import serializers


class GenerateSerializer(serializers.Serializer):
    text = serializers.CharField(min_length=50, max_length=50000)
