from rest_framework import viewsets
from audit.models import ActivityLog
from audit.serializers import ActivityLogSerializer

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all().order_by('-timestamp')
    serializer_class = ActivityLogSerializer
    search_fields = ['user_name', 'user_role', 'action', 'module', 'record_title', 'details']
    filterset_fields = ['module', 'action', 'user_role']
