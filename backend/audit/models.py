import uuid
from django.db import models

class ActivityLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_name = models.CharField(max_length=255, default="System Admin")
    user_role = models.CharField(max_length=50, default="Founder")
    action = models.CharField(max_length=100) # Created, Updated, Deleted, Sent Email, Sent WhatsApp, Converted
    module = models.CharField(max_length=100) # Clients, Projects, Tasks, Finance, Marketing
    record_title = models.CharField(max_length=255, blank=True, null=True)
    details = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user_name} [{self.user_role}] - {self.action} {self.module} ({self.timestamp.strftime('%Y-%m-%d %H:%M')})"
