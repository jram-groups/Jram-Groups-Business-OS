from rest_framework import serializers
from finance.models import Quotation, Invoice, Payment, Income, Expense
from clients.serializers import ClientSerializer

class QuotationSerializer(serializers.ModelSerializer):
    client_detail = ClientSerializer(source='client', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)

    class Meta:
        model = Quotation
        fields = [
            'id', 'reference', 'client', 'client_name', 'client_detail', 'project',
            'items', 'subtotal', 'discount', 'tax', 'total_amount', 'quotation_date', 'valid_until',
            'currency', 'subject', 'tax_rate', 'discount_rate', 'company_details',
            'client_details', 'signature_details', 'terms', 'notes', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class InvoiceSerializer(serializers.ModelSerializer):
    client_detail = ClientSerializer(source='client', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'reference', 'client', 'client_name', 'client_detail', 'project',
            'invoice_date', 'due_date', 'paid_date', 'items', 'subtotal', 'discount',
            'tax', 'total_amount', 'payment_status', 'currency', 'subject', 'po_number',
            'tax_rate', 'discount_rate', 'company_details', 'client_details', 'bank_details',
            'signature_details', 'terms', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class PaymentSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    invoice_reference = serializers.CharField(source='invoice.reference', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'reference', 'invoice', 'invoice_reference', 'client',
            'client_name', 'amount', 'payment_method', 'payment_date', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class IncomeSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    invoice_reference = serializers.CharField(source='invoice.reference', read_only=True)

    class Meta:
        model = Income
        fields = [
            'id', 'reference', 'title', 'category', 'client', 'client_name',
            'project', 'project_title', 'invoice', 'invoice_reference',
            'amount', 'payment_method', 'payment_date', 'status', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = [
            'id', 'reference', 'title', 'category', 'vendor_name',
            'amount', 'tax_amount', 'payment_method', 'payment_date',
            'status', 'receipt_reference', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

