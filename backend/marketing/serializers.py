from rest_framework import serializers
from marketing.models import SocialMediaClient
from clients.serializers import ClientSerializer
from core.serializers import UserSerializer

class SocialMediaClientSerializer(serializers.ModelSerializer):
    client_detail = ClientSerializer(source='client', read_only=True)
    assigned_team_detail = UserSerializer(source='assigned_team', many=True, read_only=True)
    assigned_employee_detail = UserSerializer(source='assigned_employee', read_only=True)
    assigned_employee_name = serializers.SerializerMethodField()
    client_name = serializers.CharField(source='client.name', read_only=True)
    completion_percentage = serializers.IntegerField(read_only=True)

    def get_assigned_employee_name(self, obj):
        if obj.assigned_employee:
            return obj.assigned_employee.get_full_name() or obj.assigned_employee.username
        return None

    class Meta:
        model = SocialMediaClient
        fields = [
            'id', 'client', 'client_name', 'client_detail',
            'company_base', 'page_status', 'current_followers',
            'instagram_handle', 'facebook_page', 'other_accounts',
            'pricing_model', 'price_per_video', 'price_per_post',
            'package_name', 'start_date', 'end_date',
            'monthly_payment', 'payment_status',
            'has_run_ads', 'meta_ads_manager_id',
            'assigned_employee', 'assigned_employee_detail', 'assigned_employee_name',
            'assigned_team', 'assigned_team_detail',
            'videos_planned', 'videos_completed', 'posters_planned', 'posters_completed',
            'reels_count', 'posts_count', 'stories_count', 'campaigns_count', 'content_status',
            'monthly_deliverables', 'deliverable_entries', 'completion_percentage', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

