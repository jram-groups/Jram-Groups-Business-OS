import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError

class UserRole(models.TextChoices):
    FOUNDER = 'FOUNDER', 'Founder'
    CEO = 'CEO', 'CEO'
    MANAGER = 'MANAGER', 'Manager'
    TEAM_HEAD = 'TEAM_HEAD', 'Team Head'
    EMPLOYEE = 'EMPLOYEE', 'Employee'
    TRAINEE = 'TRAINEE', 'Trainee / Intern'

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.EMPLOYEE,
        help_text="Role determining permissions across JRAM Groups OS"
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar_text = models.CharField(max_length=10, blank=True, default="AK")
    department = models.CharField(max_length=100, blank=True, default="General")
    designation = models.CharField(max_length=100, blank=True, default="Staff")
    status = models.CharField(max_length=20, default="Active")
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        super().clean()
        if self.role == UserRole.FOUNDER:
            qs = User.objects.filter(role=UserRole.FOUNDER)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError("BUSINESS OS SECURITY ERROR: Only one Founder account is permitted in JRAM Groups.")

    def save(self, *args, **kwargs):
        self.full_clean()
        if not self.avatar_text and self.first_name:
            self.avatar_text = f"{self.first_name[0]}{(self.last_name[0] if self.last_name else '')}".upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"
