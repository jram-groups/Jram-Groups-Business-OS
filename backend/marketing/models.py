import uuid
from django.db import models
from clients.models import Client
from core.models import User

class SocialMediaClient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='social_media_profiles')
    instagram_handle = models.CharField(max_length=100, blank=True, null=True)
    facebook_page = models.CharField(max_length=100, blank=True, null=True)
    other_accounts = models.JSONField(default=dict, blank=True)
    package_name = models.CharField(max_length=100, default="Enterprise Digital Suite")
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    monthly_payment = models.DecimalField(max_digits=10, decimal_places=2, default=50000.0)
    payment_status = models.CharField(max_length=20, default="Paid")
    assigned_team = models.ManyToManyField(User, related_name='social_clients', blank=True)
    
    # Deliverables progress metrics
    videos_planned = models.IntegerField(default=20)
    videos_completed = models.IntegerField(default=12)
    posters_planned = models.IntegerField(default=30)
    posters_completed = models.IntegerField(default=24)
    reels_count = models.IntegerField(default=15)
    posts_count = models.IntegerField(default=28)
    stories_count = models.IntegerField(default=45)
    campaigns_count = models.IntegerField(default=3)
    content_status = models.CharField(max_length=30, default="On Track")
    
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
