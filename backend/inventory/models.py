import uuid
from django.db import models
from core.models import User

class AssetCategory(models.TextChoices):
    LAPTOPS = 'Laptops & Workstations', 'Laptops & Workstations'
    DISPLAYS = 'Monitors & Displays', 'Monitors & Displays'
    MEDIA_CAMERAS = 'Studio & Media Cameras', 'Studio & Media Cameras'
    AUDIO_GEAR = 'Audio & Lighting Gear', 'Audio & Lighting Gear'
    NETWORKING = 'Networking & Servers', 'Networking & Servers'
    OFFICE_FURNITURE = 'Office Appliances & Furniture', 'Office Appliances & Furniture'
    OTHER = 'Other Equipment', 'Other Equipment'

class AssetStatus(models.TextChoices):
    IN_USE = 'In Use', 'In Use'
    AVAILABLE = 'Available', 'Available'
    UNDER_MAINTENANCE = 'Under Maintenance', 'Under Maintenance'
    RETIRED = 'Retired / Damaged', 'Retired / Damaged'

class StockCategory(models.TextChoices):
    PERIPHERALS = 'Keyboards & Mice', 'Keyboards & Mice'
    CABLES_ADAPTERS = 'Cables & Adapters', 'Cables & Adapters'
    STORAGE = 'Storage & Memory', 'Storage & Memory'
    STATIONERY = 'Office Supplies & Stationery', 'Office Supplies & Stationery'
    MERCH = 'Branded Swag & Merch', 'Branded Swag & Merch'
    OTHER = 'Consumables & Miscellaneous', 'Consumables & Miscellaneous'

class EquipmentAsset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    asset_tag = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=AssetCategory.choices, default=AssetCategory.LAPTOPS)
    brand_model = models.CharField(max_length=255, blank=True, null=True)
    serial_number = models.CharField(max_length=100, blank=True, null=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_equipment')
    status = models.CharField(max_length=30, choices=AssetStatus.choices, default=AssetStatus.AVAILABLE)
    purchase_date = models.DateField(null=True, blank=True)
    purchase_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    warranty_expiry = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=100, default="HQ Tech Lab")
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.asset_tag} - {self.name} ({self.status})"


class StockItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sku = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=StockCategory.choices, default=StockCategory.CABLES_ADAPTERS)
    quantity = models.IntegerField(default=0)
    min_stock_threshold = models.IntegerField(default=5)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    location = models.CharField(max_length=100, default="Main Supply Cabinet")
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_low_stock(self):
        return self.quantity <= self.min_stock_threshold

    @property
    def total_valuation(self):
        return float(self.quantity * self.unit_cost)

    def __str__(self):
        return f"{self.sku} - {self.name} (Qty: {self.quantity})"
