import uuid
from django.db import models
from core.models import User
from clients.models import Client

class ProjectPriority(models.TextChoices):
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High'
    URGENT = 'URGENT', 'Urgent'

class ProjectStatus(models.TextChoices):
    NEW = 'New', 'New'
    PLANNING = 'Planning', 'Planning'
    ASSIGNED = 'Assigned', 'Assigned'
    IN_PROGRESS = 'In Progress', 'In Progress'
    ON_HOLD = 'On Hold', 'On Hold'
    REVIEW = 'Review', 'Review'
    COMPLETED = 'Completed', 'Completed'
    CANCELLED = 'Cancelled', 'Cancelled'

class ProjectMethodology(models.TextChoices):
    SDLC = 'SDLC', 'SDLC'
    WATERFALL = 'Waterfall', 'Waterfall'
    AGILE = 'Agile', 'Agile'

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='projects')
    description = models.TextField(blank=True, null=True)
    service_type = models.CharField(max_length=100, default="Software & Branding")
    methodology = models.CharField(max_length=50, choices=ProjectMethodology.choices, default=ProjectMethodology.SDLC)
    assigned_employees = models.ManyToManyField(User, related_name='assigned_projects', blank=True)
    start_date = models.DateField(blank=True, null=True)
    expected_completion = models.DateField(blank=True, null=True)
    actual_completion = models.DateField(blank=True, null=True)
    duration_days = models.IntegerField(default=30)
    estimated_hours = models.DecimalField(max_digits=8, decimal_places=2, default=100.0)
    actual_working_hours = models.DecimalField(max_digits=8, decimal_places=2, default=0.0)
    status = models.CharField(max_length=30, choices=ProjectStatus.choices, default=ProjectStatus.NEW)
    priority = models.CharField(max_length=20, choices=ProjectPriority.choices, default=ProjectPriority.MEDIUM)
    workflow_stage = models.CharField(max_length=100, default="Initial Discovery")
    progress_pct = models.IntegerField(default=0)
    notes = models.TextField(blank=True, null=True)
    attachments = models.JSONField(default=list, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    spent = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.priority}) [{self.methodology}] - {self.client.name}"

class TaskStatus(models.TextChoices):
    PENDING = 'Pending', 'Pending'
    IN_PROGRESS = 'In Progress', 'In Progress'
    REVIEW = 'Review', 'Review'
    COMPLETED = 'Completed', 'Completed'

class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    methodology = models.CharField(max_length=50, choices=ProjectMethodology.choices, default=ProjectMethodology.SDLC)
    stage = models.CharField(max_length=100, blank=True, null=True)
    activity = models.CharField(max_length=150, blank=True, null=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='delegated_tasks')
    assignee_role = models.CharField(max_length=50, blank=True, null=True)
    priority = models.CharField(max_length=20, choices=ProjectPriority.choices, default=ProjectPriority.MEDIUM)
    status = models.CharField(max_length=30, choices=TaskStatus.choices, default=TaskStatus.PENDING)
    due_date = models.DateField(blank=True, null=True)
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, default=8.0)
    logged_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} [{self.stage} - {self.activity}] [{self.status}] - {self.project.name}"
