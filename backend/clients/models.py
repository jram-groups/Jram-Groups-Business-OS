import uuid
from django.db import models
from core.models import User

class ClientStatus(models.TextChoices):
    ACTIVE = 'Active', 'Active'
    PROSPECT = 'Prospect', 'Prospect'
    INACTIVE = 'Inactive', 'Inactive'

class Client(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Primary Contact / Profile
    name = models.CharField(max_length=255)
    designation = models.CharField(max_length=150, blank=True, null=True)
    email = models.EmailField()
    secondary_email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50)
    whatsapp = models.CharField(max_length=50, blank=True, null=True)
    preferred_communication = models.CharField(max_length=50, default='WhatsApp', blank=True)

    # Company Details
    company = models.CharField(max_length=255)
    brand_name = models.CharField(max_length=255, blank=True, null=True)
    business_type = models.CharField(max_length=100, default="Enterprise")
    industry = models.CharField(max_length=150, blank=True, null=True)
    company_size = models.CharField(max_length=50, blank=True, null=True)
    website = models.URLField(max_length=255, blank=True, null=True)

    # Address Details
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=30, blank=True, null=True)
    country = models.CharField(max_length=100, default="India", blank=True)
    shipping_address = models.TextField(blank=True, null=True)

    # Tax & Legal / Invoicing
    gst_vat_number = models.CharField(max_length=50, blank=True, null=True)
    pan_number = models.CharField(max_length=50, blank=True, null=True)
    currency = models.CharField(max_length=10, default="INR", blank=True)
    payment_terms = models.CharField(max_length=100, default="Net 30", blank=True)

    # Secondary SPOC
    secondary_contact_name = models.CharField(max_length=255, blank=True, null=True)
    secondary_contact_designation = models.CharField(max_length=150, blank=True, null=True)
    secondary_contact_email = models.EmailField(blank=True, null=True)
    secondary_contact_phone = models.CharField(max_length=50, blank=True, null=True)

    # CRM & Services
    client_status = models.CharField(max_length=20, choices=ClientStatus.choices, default=ClientStatus.ACTIVE)
    client_priority = models.CharField(max_length=50, default="Medium", blank=True)
    lead_source = models.CharField(max_length=100, blank=True, null=True)
    services_taken = models.JSONField(default=list, blank=True)
    social_media_accounts = models.JSONField(default=dict, blank=True)
    notes = models.TextField(blank=True, null=True)
    assigned_employees = models.ManyToManyField(User, related_name='assigned_clients', blank=True)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.company}"
