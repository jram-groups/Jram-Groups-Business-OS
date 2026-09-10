from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from communications.models import WhatsAppLog, EmailLog
from communications.serializers import WhatsAppLogSerializer, EmailLogSerializer
from communications.services import dispatch_whatsapp_message, dispatch_email_message

class WhatsAppLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WhatsAppLog.objects.all().order_by('-sent_at')
    serializer_class = WhatsAppLogSerializer
    search_fields = ['recipient_name', 'whatsapp_number', 'message_type', 'message_text']
    filterset_fields = ['message_type', 'status']

class EmailLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EmailLog.objects.all().order_by('-sent_at')
    serializer_class = EmailLogSerializer
    search_fields = ['recipient_email', 'recipient_name', 'subject', 'body']
    filterset_fields = ['status']

@api_view(['POST'])
@permission_classes([AllowAny])
def send_whatsapp_api(request):
    data = request.data
    res = dispatch_whatsapp_message(
        recipient_name=data.get('recipient_name', 'Client'),
        whatsapp_number=data.get('whatsapp_number', ''),
        message_type=data.get('message_type', 'Business Message'),
        message_text=data.get('message_text', ''),
        user=request.user if request.user.is_authenticated else None
    )
    return Response(res)

@api_view(['POST'])
@permission_classes([AllowAny])
def send_email_api(request):
    data = request.data
    res = dispatch_email_message(
        recipient_email=data.get('recipient_email', ''),
        subject=data.get('subject', 'Update from JRAM Groups'),
        body=data.get('body', ''),
        recipient_name=data.get('recipient_name', ''),
        attachments=data.get('attachments', []),
        user=request.user if request.user.is_authenticated else None
    )
    return Response(res)
