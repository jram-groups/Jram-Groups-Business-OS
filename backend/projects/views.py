from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from projects.models import Project, Task, ProjectPriority
from projects.serializers import ProjectSerializer, TaskSerializer
from audit.models import ActivityLog

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    search_fields = ['name', 'description', 'client__name', 'service_type']
    filterset_fields = ['status', 'priority', 'client', 'methodology']

    def perform_create(self, serializer):
        instance = serializer.save()
        ActivityLog.objects.create(
            user_name="Arun Kumar",
            user_role="Founder",
            action="Created",
            module="Projects",
            record_title=instance.name,
            details=f"Project initiated: {instance.name} [{instance.methodology}] for {instance.client.name} (Budget: ₹{instance.budget:,.2f})"
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        ActivityLog.objects.create(
            user_name="Arun Kumar",
            user_role="Founder",
            action="Updated",
            module="Projects",
            record_title=instance.name,
            details=f"Project updated: {instance.name} [{instance.methodology}] (Status: {instance.status}, Progress: {instance.progress_pct}%)"
        )

    def perform_destroy(self, instance):
        name = instance.name
        instance.delete()
        ActivityLog.objects.create(
            user_name="Arun Kumar",
            user_role="Founder",
            action="Deleted",
            module="Projects",
            record_title=name,
            details=f"Project deleted: {name}"
        )

    @action(detail=False, methods=['get'])
    def urgent(self, request):
        urgent_projects = Project.objects.filter(priority=ProjectPriority.URGENT).order_by('-created_at')
        page = self.paginate_queryset(urgent_projects)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(urgent_projects, many=True)
        return Response({'success': True, 'data': serializer.data})

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer
    search_fields = ['title', 'description', 'project__name', 'stage', 'activity']
    filterset_fields = ['status', 'priority', 'project', 'assigned_to', 'methodology', 'stage']

    def perform_create(self, serializer):
        instance = serializer.save()
        # Automatically update assignee_role if assigned_to is set
        if instance.assigned_to:
            if not instance.assignee_role:
                instance.assignee_role = instance.assigned_to.role
                instance.save(update_fields=['assignee_role'])
            # Automatically associate assigned employee with parent project
            instance.project.assigned_employees.add(instance.assigned_to)

        delegated_by_text = instance.assigned_by.get_full_name() if instance.assigned_by else "Leadership"
        assigned_to_text = instance.assigned_to.get_full_name() if instance.assigned_to else "Unassigned"

        ActivityLog.objects.create(
            user_name=delegated_by_text,
            user_role="Manager",
            action="Created",
            module="Tasks",
            record_title=instance.title,
            details=f"Workflow Task assigned: '{instance.title}' [{instance.methodology} -> {instance.stage or 'General'}] delegated to {assigned_to_text} (Est: {instance.estimated_hours}h)"
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.assigned_to:
            if not instance.assignee_role:
                instance.assignee_role = instance.assigned_to.role
                instance.save(update_fields=['assignee_role'])
            instance.project.assigned_employees.add(instance.assigned_to)

        ActivityLog.objects.create(
            user_name="Staff",
            user_role="Team",
            action="Updated",
            module="Tasks",
            record_title=instance.title,
            details=f"Task updated: {instance.title} (Status: {instance.status}, Logged: {instance.logged_hours}h)"
        )

    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        user = request.user
        tasks = Task.objects.all().order_by('-created_at')
        if user and user.is_authenticated:
            tasks = tasks.filter(assigned_to=user)
        serializer = self.get_serializer(tasks, many=True)
        return Response({'success': True, 'data': serializer.data})

