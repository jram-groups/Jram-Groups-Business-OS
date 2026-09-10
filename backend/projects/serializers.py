from rest_framework import serializers
from projects.models import Project, Task
from clients.serializers import ClientSerializer
from core.serializers import UserSerializer

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_detail = UserSerializer(source='assigned_to', read_only=True)
    assigned_by_detail = UserSerializer(source='assigned_by', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'project_name', 'title', 'description', 'methodology',
            'stage', 'activity', 'assigned_to', 'assigned_to_detail', 'assigned_by',
            'assigned_by_detail', 'assignee_role', 'priority', 'status', 'due_date',
            'estimated_hours', 'logged_hours', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ProjectSerializer(serializers.ModelSerializer):
    client_detail = ClientSerializer(source='client', read_only=True)
    assigned_employees_detail = UserSerializer(source='assigned_employees', many=True, read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)
    tasks_count = serializers.SerializerMethodField()
    completed_tasks_count = serializers.SerializerMethodField()
    total_logged_hours = serializers.SerializerMethodField()
    stage_breakdown = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'client', 'client_name', 'client_detail', 'description',
            'service_type', 'methodology', 'assigned_employees', 'assigned_employees_detail',
            'start_date', 'expected_completion', 'actual_completion', 'duration_days',
            'estimated_hours', 'actual_working_hours', 'status', 'priority',
            'workflow_stage', 'progress_pct', 'notes', 'attachments', 'budget',
            'spent', 'tasks', 'tasks_count', 'completed_tasks_count', 'total_logged_hours',
            'stage_breakdown', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_tasks_count(self, obj):
        return obj.tasks.count()

    def get_completed_tasks_count(self, obj):
        return obj.tasks.filter(status='Completed').count()

    def get_total_logged_hours(self, obj):
        from django.db.models import Sum
        total = obj.tasks.aggregate(total=Sum('logged_hours'))['total']
        return float(total or 0.0)

    def get_stage_breakdown(self, obj):
        breakdown = {}
        for t in obj.tasks.all():
            stg = t.stage or 'General'
            if stg not in breakdown:
                breakdown[stg] = {'total': 0, 'completed': 0, 'logged_hours': 0.0}
            breakdown[stg]['total'] += 1
            if t.status == 'Completed':
                breakdown[stg]['completed'] += 1
            breakdown[stg]['logged_hours'] += float(t.logged_hours or 0.0)
        return breakdown
