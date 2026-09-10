from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from notifications.models import Notification
from notifications.serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by('-timestamp')
    serializer_class = NotificationSerializer

    def get_queryset(self):
        qs = Notification.objects.all().order_by('-timestamp')
        user = self.request.user
        if user and user.is_authenticated:
            qs = qs.filter(user=user)
        return qs

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        qs = self.get_queryset()
        qs.update(read_state=True)
        return Response({'success': True, 'message': 'All notifications marked as read'})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.read_state = True
        notif.save()
        return Response({'success': True, 'data': NotificationSerializer(notif).data})
