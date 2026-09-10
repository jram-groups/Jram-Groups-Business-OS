from rest_framework import serializers
from core.models import User
from employees.models import EmployeeProfile, PayrollRecord, Attendance
from core.serializers import UserSerializer

class EmployeeProfileSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    salary_display = serializers.CharField(source='salary', required=False)
    assigned_assets_count = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeProfile
        fields = [
            'id', 'user', 'user_detail', 'employee_id', 'dob', 'emergency_contact',
            'phone_secondary', 'blood_group', 'pan_number', 'aadhar_number',
            'address', 'current_address', 'official_email', 'work_commitment',
            'experience_years', 'custom_permissions', 'bank_account_number',
            'bank_ifsc_code', 'joining_date', 'skills', 'salary_display',
            'performance_score', 'leaves_taken', 'assigned_assets_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_assigned_assets_count(self, obj):
        if hasattr(obj.user, 'assigned_equipment'):
            return obj.user.assigned_equipment.count()
        return 0

    def create(self, validated_data):
        user_data = self.initial_data.get('user', {})
        salary_val = self.initial_data.get('salary_display', '0')

        if isinstance(user_data, dict) and user_data.get('username'):
            user = User.objects.create(
                username=user_data.get('username'),
                first_name=user_data.get('first_name', ''),
                last_name=user_data.get('last_name', ''),
                email=user_data.get('email', ''),
                role=user_data.get('role', 'EMPLOYEE'),
                department=user_data.get('department', 'Engineering & Tech'),
                designation=user_data.get('designation', 'Software Engineer'),
                phone=user_data.get('phone', ''),
            )
            user.set_password(user_data.get('password', 'password123'))
            user.save()
            validated_data['user'] = user

        profile = EmployeeProfile.objects.create(**validated_data)
        if salary_val:
            profile.salary = salary_val
            profile.save()
        return profile

    def update(self, instance, validated_data):
        salary_val = self.initial_data.get('salary_display')
        if salary_val is not None:
            instance.salary = salary_val

        # Also update user fields if provided
        user_data = self.initial_data.get('user')
        if isinstance(user_data, dict) and instance.user:
            u = instance.user
            if 'first_name' in user_data: u.first_name = user_data['first_name']
            if 'last_name' in user_data: u.last_name = user_data['last_name']
            if 'email' in user_data: u.email = user_data['email']
            if 'department' in user_data: u.department = user_data['department']
            if 'designation' in user_data: u.designation = user_data['designation']
            if 'phone' in user_data: u.phone = user_data['phone']
            if 'role' in user_data: u.role = user_data['role']
            u.save()

        return super().update(instance, validated_data)


class PayrollRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    employee_id_code = serializers.CharField(source='employee.employee_id', read_only=True)
    designation = serializers.CharField(source='employee.user.designation', read_only=True)
    department = serializers.CharField(source='employee.user.department', read_only=True)
    role = serializers.CharField(source='employee.user.role', read_only=True)
    avatar_text = serializers.CharField(source='employee.user.avatar_text', read_only=True)

    class Meta:
        model = PayrollRecord
        fields = [
            'id', 'employee', 'employee_name', 'employee_id_code', 'designation',
            'department', 'role', 'avatar_text', 'month', 'year', 'month_number',
            'basic_salary', 'hra', 'allowances', 'deductions', 'net_salary',
            'payment_status', 'payment_date', 'payment_method',
            'transaction_reference', 'payslip_number', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    employee_id_code = serializers.CharField(source='employee.employee_id', read_only=True)
    designation = serializers.CharField(source='employee.user.designation', read_only=True)
    department = serializers.CharField(source='employee.user.department', read_only=True)
    avatar_text = serializers.CharField(source='employee.user.avatar_text', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'employee', 'employee_name', 'employee_id_code', 'designation',
            'department', 'avatar_text', 'date', 'status', 'check_in', 'check_out',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
