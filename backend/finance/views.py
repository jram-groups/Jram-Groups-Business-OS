import datetime
from django.db.models import Sum, Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from finance.models import Quotation, Invoice, Payment, QuotationStatus, InvoicePaymentStatus, Income, Expense
from finance.serializers import QuotationSerializer, InvoiceSerializer, PaymentSerializer, IncomeSerializer, ExpenseSerializer
from audit.models import ActivityLog

class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all().order_by('-created_at')
    serializer_class = QuotationSerializer
    search_fields = ['reference', 'client__name', 'notes']
    filterset_fields = ['status', 'client']

    def perform_create(self, serializer):
        today = datetime.date.today()
        ref = serializer.validated_data.get('reference')
        if not ref:
            count = Quotation.objects.count() + 1
            ref = f"QT-{today.year}-{count:03d}"
        instance = serializer.save(reference=ref)
        ActivityLog.objects.create(
            user_name="Arun Kumar",
            user_role="Founder",
            action="Created",
            module="Quotations",
            record_title=instance.reference,
            details=f"Quotation prepared for {instance.client.name} - ₹{instance.total_amount:,.2f}"
        )

    @action(detail=True, methods=['post'])
    def convert_to_invoice(self, request, pk=None):
        quotation = self.get_object()
        today = datetime.date.today()
        due = today + datetime.timedelta(days=15)
        count = Invoice.objects.count() + 1
        inv_ref = f"INV-{today.year}-{count:03d}"

        invoice = Invoice.objects.create(
            reference=inv_ref,
            client=quotation.client,
            project=quotation.project,
            invoice_date=today,
            due_date=due,
            items=quotation.items,
            subtotal=quotation.subtotal,
            discount=quotation.discount,
            tax=quotation.tax,
            total_amount=quotation.total_amount,
            payment_status=InvoicePaymentStatus.PENDING,
            currency=quotation.currency or '₹',
            subject=quotation.subject or '',
            tax_rate=quotation.tax_rate or 0,
            discount_rate=quotation.discount_rate or 0,
            company_details=quotation.company_details or {},
            client_details=quotation.client_details or {},
            signature_details=quotation.signature_details or {},
            terms=quotation.terms or '',
            notes=f"Converted from Quotation {quotation.reference}. {quotation.notes or ''}".strip()
        )
        quotation.status = QuotationStatus.ACCEPTED
        quotation.save()

        ActivityLog.objects.create(
            user_name="Arun Kumar",
            user_role="Founder",
            action="Converted",
            module="Quotations",
            record_title=f"{quotation.reference} -> {inv_ref}",
            details=f"Quotation {quotation.reference} converted to Invoice {inv_ref} for {quotation.client.name} (₹{invoice.total_amount:,.2f})"
        )

        return Response({
            'success': True,
            'message': f"Quotation {quotation.reference} converted to Invoice {inv_ref}",
            'invoice': InvoiceSerializer(invoice).data
        })

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    search_fields = ['reference', 'client__name', 'notes']
    filterset_fields = ['payment_status', 'client']

    def perform_create(self, serializer):
        today = datetime.date.today()
        ref = serializer.validated_data.get('reference')
        if not ref:
            count = Invoice.objects.count() + 1
            ref = f"INV-{today.year}-{count:03d}"
        instance = serializer.save(reference=ref)
        ActivityLog.objects.create(
            user_name="Arun Kumar",
            user_role="Founder",
            action="Created",
            module="Invoices",
            record_title=instance.reference,
            details=f"Billed invoice issued to {instance.client.name} - ₹{instance.total_amount:,.2f}"
        )

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        today = datetime.date.today()
        invoice.payment_status = InvoicePaymentStatus.PAID
        invoice.paid_date = today
        invoice.save()

        # Record payment
        count = Payment.objects.count() + 1
        payment = Payment.objects.create(
            reference=f"PAY-{today.year}-{count:03d}",
            invoice=invoice,
            client=invoice.client,
            amount=invoice.total_amount,
            payment_method=request.data.get('payment_method', 'Bank Transfer'),
            payment_date=today,
            notes=f"Full payment for invoice {invoice.reference}"
        )

        # Also register in Income Ledger
        inc_count = Income.objects.count() + 1
        Income.objects.create(
            reference=f"INC-{today.year}-{inc_count:03d}",
            title=f"Invoice Settlement {invoice.reference}",
            category="Client Invoice",
            client=invoice.client,
            project=invoice.project,
            invoice=invoice,
            amount=invoice.total_amount,
            payment_method=request.data.get('payment_method', 'Bank Transfer'),
            payment_date=today,
            status="Received",
            notes=f"Auto-logged from settled invoice {invoice.reference}"
        )

        ActivityLog.objects.create(
            user_name="Arun Kumar",
            user_role="Founder",
            action="Settled & Paid",
            module="Invoices",
            record_title=invoice.reference,
            details=f"Invoice {invoice.reference} paid in full (₹{invoice.total_amount:,.2f}). Auto-logged into Income Ledger."
        )

        return Response({
            'success': True,
            'message': f"Invoice {invoice.reference} marked as Paid",
            'payment': PaymentSerializer(payment).data
        })

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-created_at')
    serializer_class = PaymentSerializer
    search_fields = ['reference', 'client__name', 'invoice__reference']
    filterset_fields = ['client', 'payment_method']


class IncomeViewSet(viewsets.ModelViewSet):
    queryset = Income.objects.all().order_by('-payment_date', '-created_at')
    serializer_class = IncomeSerializer
    search_fields = ['reference', 'title', 'client__name', 'notes']
    filterset_fields = ['category', 'payment_method', 'status', 'client']

    def perform_create(self, serializer):
        today = datetime.date.today()
        ref = serializer.validated_data.get('reference')
        if not ref:
            count = Income.objects.count() + 1
            ref = f"INC-{today.year}-{count:03d}"
        instance = serializer.save(reference=ref)
        ActivityLog.objects.create(
            user_name="Arun Kumar",
            user_role="Founder",
            action="Created",
            module="Income Ledger",
            record_title=instance.reference,
            details=f"Income transaction of ₹{instance.amount:,.2f} recorded: {instance.title} ({instance.category})"
        )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        total_income = Income.objects.aggregate(total=Sum('amount'))['total'] or 0.0
        by_category = Income.objects.values('category').annotate(
            total=Sum('amount'), count=Count('id')
        ).order_by('-total')
        by_method = Income.objects.values('payment_method').annotate(
            total=Sum('amount'), count=Count('id')
        ).order_by('-total')

        return Response({
            'success': True,
            'total_income': float(total_income),
            'by_category': list(by_category),
            'by_method': list(by_method),
        })


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-payment_date', '-created_at')
    serializer_class = ExpenseSerializer
    search_fields = ['reference', 'title', 'vendor_name', 'notes']
    filterset_fields = ['category', 'payment_method', 'status']

    def perform_create(self, serializer):
        today = datetime.date.today()
        ref = serializer.validated_data.get('reference')
        if not ref:
            count = Expense.objects.count() + 1
            ref = f"EXP-{today.year}-{count:03d}"
        instance = serializer.save(reference=ref)
        ActivityLog.objects.create(
            user_name="Arun Kumar",
            user_role="Founder",
            action="Created",
            module="Expense Ledger",
            record_title=instance.reference,
            details=f"Operating expense of ₹{instance.amount:,.2f} recorded: {instance.title} ({instance.category})"
        )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        total_expenses = Expense.objects.aggregate(total=Sum('amount'))['total'] or 0.0
        by_category = Expense.objects.values('category').annotate(
            total=Sum('amount'), count=Count('id')
        ).order_by('-total')
        by_method = Expense.objects.values('payment_method').annotate(
            total=Sum('amount'), count=Count('id')
        ).order_by('-total')

        return Response({
            'success': True,
            'total_expenses': float(total_expenses),
            'by_category': list(by_category),
            'by_method': list(by_method),
        })


