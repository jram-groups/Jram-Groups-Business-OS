from rest_framework import serializers
from marketing.models import SocialMediaClient
from clients.serializers import ClientSerializer
from core.serializers import UserSerializer

class SocialMediaClientSerializer(serializers.ModelSerializer):
    client_detail = ClientSerializer(source='client', read_only=True)
    assigned_team_detail = UserSerializer(source='assigned_team', many=True, read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)
    completion_percentage = serializers.IntegerField(read_only=True)

    class Meta:
        model = SocialMediaClient
        fields = [
            'id', 'client', 'client_name', 'client_detail', 'instagram_handle',
            'facebook_page', 'other_accounts', 'package_name', 'start_date', 'end_date',
            'monthly_payment', 'payment_status', 'assigned_team', 'assigned_team_detail',
            'videos_planned', 'videos_completed', 'posters_planned', 'posters_completed',
            'reels_count', 'posts_count', 'stories_count', 'campaigns_count', 'content_status',
            'completion_percentage', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
