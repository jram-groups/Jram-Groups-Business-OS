import uuid
from django.db import models
from clients.models import Client
from projects.models import Project

class QuotationStatus(models.TextChoices):
    DRAFT = 'Draft', 'Draft'
    SENT = 'Sent', 'Sent'
    VIEWED = 'Viewed', 'Viewed'
    ACCEPTED = 'Accepted', 'Accepted'
    REJECTED = 'Rejected', 'Rejected'
    EXPIRED = 'Expired', 'Expired'

class InvoicePaymentStatus(models.TextChoices):
    PENDING = 'Pending', 'Pending'
    PARTIALLY_PAID = 'Partially Paid', 'Partially Paid'
    PAID = 'Paid', 'Paid'
    OVERDUE = 'Overdue', 'Overdue'
    CANCELLED = 'Cancelled', 'Cancelled'

class Quotation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=50, unique=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='quotations')
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='quotations')
    items = models.JSONField(default=list, blank=True) # list of {name, desc, qty, price, total}
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    quotation_date = models.DateField(blank=True, null=True)
    valid_until = models.DateField()
    currency = models.CharField(max_length=10, default='₹', blank=True)
    subject = models.CharField(max_length=255, blank=True, null=True)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    discount_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    company_details = models.JSONField(default=dict, blank=True)
    client_details = models.JSONField(default=dict, blank=True)
    signature_details = models.JSONField(default=dict, blank=True)
    terms = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=QuotationStatus.choices, default=QuotationStatus.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.reference} - {self.client.name} (₹{self.total_amount})"

class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=50, unique=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='invoices')
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    invoice_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(blank=True, null=True)
    items = models.JSONField(default=list, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    payment_status = models.CharField(max_length=30, choices=InvoicePaymentStatus.choices, default=InvoicePaymentStatus.PENDING)
    currency = models.CharField(max_length=10, default='₹', blank=True)
    subject = models.CharField(max_length=255, blank=True, null=True)
    po_number = models.CharField(max_length=100, blank=True, null=True)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    discount_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    company_details = models.JSONField(default=dict, blank=True)
    client_details = models.JSONField(default=dict, blank=True)
    bank_details = models.JSONField(default=dict, blank=True)
    signature_details = models.JSONField(default=dict, blank=True)
    terms = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.reference} - {self.client.name} (₹{self.total_amount})"

class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=50, unique=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50, default="Bank Transfer")
    payment_date = models.DateField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.reference} - ₹{self.amount}"


class IncomeCategory(models.TextChoices):
    CLIENT_INVOICE = 'Client Invoice', 'Client Invoice'
    MARKETING_RETAINER = 'Marketing Retainer', 'Marketing Retainer'
    SOFTWARE_DEV = 'Software Development', 'Software Development'
    CONSULTATION = 'Consultation & Advisory', 'Consultation & Advisory'
    AMC_SUPPORT = 'AMC & Maintenance', 'AMC & Maintenance'
    OTHER = 'Other Revenue', 'Other Revenue'

class IncomeStatus(models.TextChoices):
    RECEIVED = 'Received', 'Received'
    PENDING = 'Pending', 'Pending'
    RECURRING = 'Recurring', 'Recurring'

class Income(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=IncomeCategory.choices, default=IncomeCategory.CLIENT_INVOICE)
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, related_name='incomes')
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='incomes')
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name='incomes')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50, default="Bank Transfer")
    payment_date = models.DateField()
    status = models.CharField(max_length=30, choices=IncomeStatus.choices, default=IncomeStatus.RECEIVED)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Income {self.reference} - {self.title} (₹{self.amount})"


class ExpenseCategory(models.TextChoices):
    SALARIES = 'Salaries & Payroll', 'Salaries & Payroll'
    CLOUD_HOSTING = 'Cloud & Hosting', 'Cloud & Hosting'
    SOFTWARE_SAAS = 'Software & Subscriptions', 'Software & Subscriptions'
    OFFICE_RENT = 'Office Rent', 'Office Rent'
    UTILITIES = 'Utilities & Internet', 'Utilities & Internet'
    MARKETING_ADS = 'Marketing & Ad Spend', 'Marketing & Ad Spend'
    HARDWARE_EQUIPMENT = 'Hardware & Equipment', 'Hardware & Equipment'
    VENDOR_PAYOUTS = 'Vendor & Freelancers', 'Vendor & Freelancers'
    TRAVEL_FOOD = 'Travel & Refreshments', 'Travel & Refreshments'
    MISCELLANEOUS = 'Miscellaneous', 'Miscellaneous'

class ExpenseStatus(models.TextChoices):
    PAID = 'Paid', 'Paid'
    PENDING = 'Pending', 'Pending'

class Expense(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=ExpenseCategory.choices, default=ExpenseCategory.MISCELLANEOUS)
    vendor_name = models.CharField(max_length=255, blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    payment_method = models.CharField(max_length=50, default="Bank Transfer")
    payment_date = models.DateField()
    status = models.CharField(max_length=30, choices=ExpenseStatus.choices, default=ExpenseStatus.PAID)
    receipt_reference = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Expense {self.reference} - {self.title} (₹{self.amount})"

