from django.urls import path, include
from rest_framework.routers import DefaultRouter
from inventory.views import EquipmentAssetViewSet, StockItemViewSet

router = DefaultRouter()
router.register(r'assets', EquipmentAssetViewSet, basename='assets')
router.register(r'stock', StockItemViewSet, basename='stock')

urlpatterns = [
    path('', include(router.urls)),
]
