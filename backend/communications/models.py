import uuid
from django.db import models
from core.models import User

class WhatsAppLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient_name = models.CharField(max_length=255)
    whatsapp_number = models.CharField(max_length=50)
    message_type = models.CharField(max_length=50, default="Project Update") # Quotation, Invoice, Payment Reminder, etc.
    message_text = models.TextField()
    status = models.CharField(max_length=20, default="Sent")
    sent_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"WhatsApp to {self.recipient_name} ({self.message_type}) - {self.status}"

class EmailLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient_email = models.EmailField()
    recipient_name = models.CharField(max_length=255, blank=True, null=True)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    attachments = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, default="Sent")
    sent_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Email to {self.recipient_email}: {self.subject}"
