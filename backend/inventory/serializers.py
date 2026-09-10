from rest_framework import serializers
from inventory.models import EquipmentAsset, StockItem
from core.serializers import UserSerializer

class EquipmentAssetSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    assigned_to_role = serializers.SerializerMethodField()
    assigned_to_avatar = serializers.SerializerMethodField()

    class Meta:
        model = EquipmentAsset
        fields = [
            'id', 'asset_tag', 'name', 'category', 'brand_model', 'serial_number',
            'assigned_to', 'assigned_to_name', 'assigned_to_role', 'assigned_to_avatar',
            'status', 'purchase_date', 'purchase_cost', 'warranty_expiry',
            'location', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None

    def get_assigned_to_role(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.role
        return None

    def get_assigned_to_avatar(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.avatar_text or (obj.assigned_to.username[:2].upper() if obj.assigned_to.username else "AK")
        return None


class StockItemSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(read_only=True)
    total_valuation = serializers.FloatField(read_only=True)

    class Meta:
        model = StockItem
        fields = [
            'id', 'sku', 'name', 'category', 'quantity', 'min_stock_threshold',
            'unit_cost', 'location', 'notes', 'is_low_stock', 'total_valuation',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
