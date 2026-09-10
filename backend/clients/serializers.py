from rest_framework import serializers
from clients.models import Client
from core.serializers import UserSerializer

class ClientSerializer(serializers.ModelSerializer):
    assigned_employees_detail = UserSerializer(source='assigned_employees', many=True, read_only=True)

    class Meta:
        model = Client
        fields = [
            'id', 'name', 'designation', 'email', 'secondary_email', 'phone', 'whatsapp', 'preferred_communication',
            'company', 'brand_name', 'business_type', 'industry', 'company_size', 'website',
            'address', 'city', 'state', 'postal_code', 'country', 'shipping_address',
            'gst_vat_number', 'pan_number', 'currency', 'payment_terms',
            'secondary_contact_name', 'secondary_contact_designation', 'secondary_contact_email', 'secondary_contact_phone',
            'client_status', 'client_priority', 'lead_source', 'services_taken', 'social_media_accounts',
            'notes', 'assigned_employees', 'assigned_employees_detail', 'total_revenue',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
