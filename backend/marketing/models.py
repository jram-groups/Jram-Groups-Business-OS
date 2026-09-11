import uuid
import datetime
from django.db import models
from clients.models import Client
from core.models import User

class SocialMediaClient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='social_media_profiles')
    
    # 1. Company Domain / Industry Base
    company_base = models.CharField(max_length=150, blank=True, null=True)
    
    # 2. Page Status: Already have page or need to start new page
    page_status = models.CharField(max_length=50, default="Existing Page")  # "Existing Page" | "Need New Page Start"
    
    # 3. Current Followers count if already have page
    current_followers = models.CharField(max_length=100, blank=True, null=True)
    
    # Handles & Accounts
    instagram_handle = models.CharField(max_length=100, blank=True, null=True)
    facebook_page = models.CharField(max_length=100, blank=True, null=True)
    other_accounts = models.JSONField(default=dict, blank=True)
    
    # 4. Payment Plan: Monthly Retainer vs Per Deliverable (Per Video/Post)
    pricing_model = models.CharField(max_length=50, default="Monthly Retainer")  # "Monthly Retainer" | "Per Deliverable"
    price_per_video = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    price_per_post = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    monthly_payment = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    payment_status = models.CharField(max_length=20, default="Pending")
    
    # 5. Meta Ads History & Manager ID
    has_run_ads = models.BooleanField(default=False)
    meta_ads_manager_id = models.CharField(max_length=100, blank=True, null=True)
    
    package_name = models.CharField(max_length=100, default="Standard Social Retainer")
    start_date = models.DateField(default=datetime.date.today, blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    
    # Assigned Employee / SPOC
    assigned_employee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_social_clients')
    assigned_team = models.ManyToManyField(User, related_name='social_clients', blank=True)
    
    # Deliverables progress metrics
    videos_planned = models.IntegerField(default=0)
    videos_completed = models.IntegerField(default=0)
    posters_planned = models.IntegerField(default=0)
    posters_completed = models.IntegerField(default=0)
    reels_count = models.IntegerField(default=0)
    posts_count = models.IntegerField(default=0)
    stories_count = models.IntegerField(default=0)
    campaigns_count = models.IntegerField(default=0)
    content_status = models.CharField(max_length=30, default="Planning")
    
    # Monthly deliverables tracking store (month-by-month progress log)
    monthly_deliverables = models.JSONField(default=dict, blank=True)
    
    # Date-wise deliverables entries (planned/unplanned, ads pushed, date, type, spend)
    deliverable_entries = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_planned(self):
        return self.videos_planned + self.posters_planned

    @property
    def total_completed(self):
        return self.videos_completed + self.posters_completed

    @property
    def completion_percentage(self):
        planned = self.total_planned
        if planned == 0:
            return 100
        return min(100, int((self.total_completed / planned) * 100))

    def __str__(self):
        return f"{self.client.name} - {self.package_name}"

