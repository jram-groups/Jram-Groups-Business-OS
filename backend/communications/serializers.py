from rest_framework import serializers
from communications.models import WhatsAppLog, EmailLog

class WhatsAppLogSerializer(serializers.ModelSerializer):
    sent_by_name = serializers.CharField(source='sent_by.get_full_name', read_only=True)

    class Meta:
        model = WhatsAppLog
        fields = '__all__'

class EmailLogSerializer(serializers.ModelSerializer):
    sent_by_name = serializers.CharField(source='sent_by.get_full_name', read_only=True)

    class Meta:
        model = EmailLog
        fields = '__all__'
