from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from clients.models import Client
from clients.serializers import ClientSerializer
from audit.models import ActivityLog

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all().order_by('-created_at')
    serializer_class = ClientSerializer
    search_fields = ['name', 'company', 'email', 'phone', 'business_type']
    filterset_fields = ['client_status', 'business_type']

    def perform_create(self, serializer):
        instance = serializer.save()
        ActivityLog.objects.create(
            user_name="Arun Kumar",
            user_role="Founder",
            action="Created",
            module="Clients",
            record_title=instance.name,
            details=f"New client registered: {instance.name} ({instance.company}) - Status: {instance.client_status}"
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        ActivityLog.objects.create(
            user_name="Arun Kumar",
            user_role="Founder",
            action="Updated",
            module="Clients",
            record_title=instance.name,
            details=f"Client record updated: {instance.name} ({instance.company})"
        )

    def perform_destroy(self, instance):
        name = instance.name
        company = instance.company
        instance.delete()
        ActivityLog.objects.create(
            user_name="Arun Kumar",
            user_role="Founder",
            action="Deleted",
            module="Clients",
            record_title=name,
            details=f"Client removed from CRM: {name} ({company})"
        )

    @action(detail=True, methods=['get'])
    def overview(self, request, pk=None):
        """
        Get complete 360 overview for client including projects, invoices, and communication history
        """
        client = self.get_object()
        from projects.models import Project
        from finance.models import Invoice, Quotation
        from communications.models import WhatsAppLog, EmailLog

        projects = Project.objects.filter(client=client).values('id', 'name', 'status', 'priority', 'progress_pct')
        invoices = Invoice.objects.filter(client=client).values('id', 'reference', 'total_amount', 'payment_status', 'invoice_date')
        quotations = Quotation.objects.filter(client=client).values('id', 'reference', 'total_amount', 'status', 'valid_until')
        whatsapp_logs = WhatsAppLog.objects.filter(recipient_name=client.name).values('id', 'message_type', 'status', 'sent_at')
        email_logs = EmailLog.objects.filter(recipient_email=client.email).values('id', 'subject', 'status', 'sent_at')

        return Response({
            'success': True,
            'client': ClientSerializer(client).data,
            'projects': list(projects),
            'invoices': list(invoices),
            'quotations': list(quotations),
            'communications': {
                'whatsapp': list(whatsapp_logs),
                'email': list(email_logs)
            }
        })
