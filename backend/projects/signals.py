from django.db.models.signals import post_save
from django.dispatch import receiver
from projects.models import Project, ProjectPriority
from notifications.models import Notification
from core.models import User, UserRole

@receiver(post_save, sender=Project)
def handle_project_urgent_notification(sender, instance, created, **kwargs):
    if instance.priority == ProjectPriority.URGENT:
        # Notify assigned employees
        assigned = instance.assigned_employees.all()
        managers = User.objects.filter(role__in=[UserRole.FOUNDER, UserRole.CEO, UserRole.MANAGER, UserRole.TEAM_HEAD])
        
        target_users = set(list(assigned) + list(managers))
        for user in target_users:
            Notification.objects.create(
                user=user,
                title=f"🚨 URGENT Project Alert: {instance.name}",
                message=f"Project '{instance.name}' for client {instance.client.name} requires IMMEDIATE attention. Deadline: {instance.expected_completion or 'ASAP'}",
                notification_type="urgent_project",
                related_entity_type="Project",
                related_entity_id=str(instance.id)
            )
