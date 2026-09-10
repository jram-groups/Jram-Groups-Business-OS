from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, F, Q
from inventory.models import EquipmentAsset, StockItem, AssetStatus
from inventory.serializers import EquipmentAssetSerializer, StockItemSerializer
from core.models import User

class EquipmentAssetViewSet(viewsets.ModelViewSet):
    queryset = EquipmentAsset.objects.all().order_by('-created_at')
    serializer_class = EquipmentAssetSerializer
    search_fields = ['asset_tag', 'name', 'brand_model', 'serial_number', 'location', 'notes']
    filterset_fields = ['category', 'status', 'assigned_to']

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        asset = self.get_object()
        user_id = request.data.get('user_id')
        notes = request.data.get('notes')

        if user_id:
            try:
                user = User.objects.get(id=user_id)
                asset.assigned_to = user
                asset.status = AssetStatus.IN_USE
                if notes:
                    asset.notes = f"{asset.notes or ''}\nAssigned to {user.get_full_name()} on {request.data.get('date', 'today')}: {notes}".strip()
                asset.save()
                return Response({
                    'success': True,
                    'message': f"Asset {asset.asset_tag} assigned to {user.get_full_name() or user.username}",
                    'asset': EquipmentAssetSerializer(asset).data
                })
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Unassign
            prev_user = asset.assigned_to.get_full_name() if asset.assigned_to else "previous user"
            asset.assigned_to = None
            asset.status = AssetStatus.AVAILABLE
            if notes:
                asset.notes = f"{asset.notes or ''}\nReturned by {prev_user}: {notes}".strip()
            asset.save()
            return Response({
                'success': True,
                'message': f"Asset {asset.asset_tag} returned and marked Available",
                'asset': EquipmentAssetSerializer(asset).data
            })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        total_count = EquipmentAsset.objects.count()
        total_valuation = EquipmentAsset.objects.aggregate(val=Sum('purchase_cost'))['val'] or 0.0
        in_use_count = EquipmentAsset.objects.filter(status=AssetStatus.IN_USE).count()
        available_count = EquipmentAsset.objects.filter(status=AssetStatus.AVAILABLE).count()
        maintenance_count = EquipmentAsset.objects.filter(status=AssetStatus.UNDER_MAINTENANCE).count()
        retired_count = EquipmentAsset.objects.filter(status=AssetStatus.RETIRED).count()

        by_category = EquipmentAsset.objects.values('category').annotate(
            count=Count('id'), total_val=Sum('purchase_cost')
        ).order_by('-total_val')

        return Response({
            'success': True,
            'total_assets': total_count,
            'total_valuation': float(total_valuation),
            'in_use': in_use_count,
            'available': available_count,
            'maintenance': maintenance_count,
            'retired': retired_count,
            'by_category': list(by_category)
        })


class StockItemViewSet(viewsets.ModelViewSet):
    queryset = StockItem.objects.all().order_by('name')
    serializer_class = StockItemSerializer
    search_fields = ['sku', 'name', 'category', 'location', 'notes']
    filterset_fields = ['category', 'location']

    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        item = self.get_object()
        delta = request.data.get('delta')
        new_qty = request.data.get('quantity')

        if delta is not None:
            item.quantity = max(0, item.quantity + int(delta))
        elif new_qty is not None:
            item.quantity = max(0, int(new_qty))

        item.save()
        return Response({
            'success': True,
            'message': f"Stock for {item.name} updated to {item.quantity}",
            'item': StockItemSerializer(item).data
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        items = StockItem.objects.all()
        total_skus = items.count()
        total_quantity = items.aggregate(q=Sum('quantity'))['q'] or 0
        total_val = sum(item.total_valuation for item in items)
        low_stock_count = items.filter(quantity__lte=F('min_stock_threshold')).count()

        return Response({
            'success': True,
            'total_skus': total_skus,
            'total_quantity': total_quantity,
            'total_valuation': float(total_val),
            'low_stock_count': low_stock_count,
        })
