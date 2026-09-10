import uuid
from django.db import models
from core.models import User
from core.encryption import encrypt_val, decrypt_val

class EmployeeProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    employee_id = models.CharField(max_length=50, unique=True)
    dob = models.DateField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=100, blank=True, null=True)
    joining_date = models.DateField(blank=True, null=True)
    skills = models.JSONField(default=list, blank=True)
    _salary_encrypted = models.TextField(db_column='salary_encrypted', blank=True, null=True)
    performance_score = models.IntegerField(default=90)
    leaves_taken = models.IntegerField(default=0)
    phone_secondary = models.CharField(max_length=20, blank=True, null=True)
    blood_group = models.CharField(max_length=10, blank=True, null=True)
    pan_number = models.CharField(max_length=20, blank=True, null=True)
    aadhar_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    current_address = models.TextField(blank=True, null=True)
    official_email = models.EmailField(blank=True, null=True)
    work_commitment = models.CharField(max_length=100, blank=True, null=True)
    experience_years = models.CharField(max_length=50, blank=True, null=True)
    custom_permissions = models.JSONField(default=list, blank=True)
    bank_account_number = models.CharField(max_length=30, blank=True, null=True)
    bank_ifsc_code = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def salary(self):
        if not self._salary_encrypted:
            return "0"
        return decrypt_val(self._salary_encrypted)

    @salary.setter
    def salary(self, raw_val):
        self._salary_encrypted = encrypt_val(str(raw_val))

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.employee_id})"


class PayrollStatus(models.TextChoices):
    PAID = 'Paid', 'Paid'
    PENDING = 'Pending', 'Pending'
    PROCESSING = 'Processing', 'Processing'

class PayrollRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE, related_name='payrolls')
    month = models.CharField(max_length=30) # e.g. "September 2026"
    year = models.IntegerField(default=2026)
    month_number = models.IntegerField(default=9)
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    hra = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    payment_status = models.CharField(max_length=20, choices=PayrollStatus.choices, default=PayrollStatus.PENDING)
    payment_date = models.DateField(blank=True, null=True)
    payment_method = models.CharField(max_length=50, default="Bank Transfer")
    transaction_reference = models.CharField(max_length=100, blank=True, null=True)
    payslip_number = models.CharField(max_length=50, unique=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.payslip_number} - {self.employee.user.get_full_name()} ({self.month})"


class AttendanceStatus(models.TextChoices):
    PRESENT = 'Present', 'Present'
    WFH = 'Work From Home', 'Work From Home'
    HALF_DAY = 'Half Day', 'Half Day'
    ON_LEAVE = 'On Leave', 'On Leave'
    ABSENT = 'Absent', 'Absent'

class Attendance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    status = models.CharField(max_length=30, choices=AttendanceStatus.choices, default=AttendanceStatus.PRESENT)
    check_in = models.TimeField(blank=True, null=True)
    check_out = models.TimeField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('employee', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.date} ({self.status})"

