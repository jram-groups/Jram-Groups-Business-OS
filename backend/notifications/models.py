import uuid
from django.db import models
from core.models import User

class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, default="general")
    read_state = models.BooleanField(default=False)
    related_entity_type = models.CharField(max_length=50, blank=True, null=True)
    related_entity_id = models.CharField(max_length=100, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.title} [{'Read' if self.read_state else 'Unread'}]"
