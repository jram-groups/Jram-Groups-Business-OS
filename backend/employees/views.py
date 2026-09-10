import datetime
from django.db.models import Sum, Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from employees.models import EmployeeProfile, PayrollRecord, Attendance, PayrollStatus, AttendanceStatus
from employees.serializers import EmployeeProfileSerializer, PayrollRecordSerializer, AttendanceSerializer
from inventory.models import EquipmentAsset
from inventory.serializers import EquipmentAssetSerializer
from projects.models import Project
from projects.serializers import ProjectSerializer
from finance.models import Expense

class EmployeeProfileViewSet(viewsets.ModelViewSet):
    queryset = EmployeeProfile.objects.all().order_by('-created_at')
    serializer_class = EmployeeProfileSerializer
    search_fields = ['employee_id', 'user__first_name', 'user__last_name', 'user__email', 'user__department', 'user__designation']
    filterset_fields = ['user__department', 'user__role']

    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        profile = self.get_object()
        user = profile.user

        # 1. Assigned Equipment Assets
        assets = EquipmentAsset.objects.filter(assigned_to=user)
        assets_data = EquipmentAssetSerializer(assets, many=True).data

        # 2. Assigned Projects & Tasks
        projects = Project.objects.filter(assigned_employees=user).distinct()
        projects_data = ProjectSerializer(projects, many=True).data


        # 3. Calculated Salary Breakdown
        ctc = float(profile.salary or 0)
        basic = round(ctc * 0.50, 2)
        hra = round(ctc * 0.30, 2)
        allowances = round(ctc * 0.20, 2)
        pf = round(min(basic * 0.12, 1800.0), 2)
        pt = 200.00 if ctc > 15000 else 0.00
        deductions = round(pf + pt, 2)
        net_salary = round((basic + hra + allowances) - deductions, 2)

        salary_breakdown = {
            'ctc': ctc,
            'basic_salary': basic,
            'hra': hra,
            'special_allowances': allowances,
            'pf_deduction': pf,
            'pt_deduction': pt,
            'total_deductions': deductions,
            'net_take_home': net_salary,
        }

        # 4. Recent Attendance
        recent_attendance = Attendance.objects.filter(employee=profile).order_by('-date')[:15]
        attendance_data = AttendanceSerializer(recent_attendance, many=True).data

        # 5. Recent Payroll Slips
        recent_payrolls = PayrollRecord.objects.filter(employee=profile).order_by('-year', '-month_number')[:6]
        payrolls_data = PayrollRecordSerializer(recent_payrolls, many=True).data

        return Response({
            'success': True,
            'profile': EmployeeProfileSerializer(profile).data,
            'salary_breakdown': salary_breakdown,
            'assigned_assets': assets_data,
            'assigned_projects': projects_data,
            'recent_attendance': attendance_data,
            'payroll_history': payrolls_data,
        })


class PayrollRecordViewSet(viewsets.ModelViewSet):
    queryset = PayrollRecord.objects.all().order_by('-year', '-month_number', '-created_at')
    serializer_class = PayrollRecordSerializer
    search_fields = ['payslip_number', 'employee__employee_id', 'employee__user__first_name', 'employee__user__last_name', 'month']
    filterset_fields = ['month', 'year', 'payment_status', 'employee']

    @action(detail=False, methods=['post'])
    def generate_batch(self, request):
        month = request.data.get('month', 'September 2026')
        year = int(request.data.get('year', 2026))
        month_number = int(request.data.get('month_number', 9))

        employees = EmployeeProfile.objects.all()
        created_records = []

        for emp in employees:
            # Check if payroll already exists for this employee in this month
            existing = PayrollRecord.objects.filter(employee=emp, month=month, year=year).first()
            if existing:
                continue

            ctc = float(emp.salary or 0)
            basic = round(ctc * 0.50, 2)
            hra = round(ctc * 0.30, 2)
            allowances = round(ctc * 0.20, 2)
            pf = round(min(basic * 0.12, 1800.0), 2)
            pt = 200.00 if ctc > 15000 else 0.00
            deductions = round(pf + pt, 2)
            net_salary = round((basic + hra + allowances) - deductions, 2)

            count = PayrollRecord.objects.count() + 1
            payslip_no = f"PAY-{year}{month_number:02d}-{count:03d}"

            record = PayrollRecord.objects.create(
                employee=emp,
                month=month,
                year=year,
                month_number=month_number,
                basic_salary=basic,
                hra=hra,
                allowances=allowances,
                deductions=deductions,
                net_salary=net_salary,
                payment_status=PayrollStatus.PENDING,
                payslip_number=payslip_no,
                notes=f"Generated for {month}"
            )
            created_records.append(record)

        return Response({
            'success': True,
            'message': f"Generated {len(created_records)} payroll records for {month}",
            'count': len(created_records)
        })

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        payroll = self.get_object()
        today = datetime.date.today()
        ref = request.data.get('transaction_reference') or f"NEFT-SAL-{today.strftime('%Y%m%d')}-{payroll.payslip_number}"
        method = request.data.get('payment_method', 'Bank Transfer')

        payroll.payment_status = PayrollStatus.PAID
        payroll.payment_date = today
        payroll.transaction_reference = ref
        payroll.payment_method = method
        payroll.save()

        # Synchronize directly to Finance Expense Tracking
        Expense.objects.create(
            reference=f"EXP-SAL-{payroll.payslip_number}",
            title=f"Salary Disbursement - {payroll.employee.user.get_full_name()} ({payroll.month})",
            category="Salaries & Payroll",
            vendor_name=f"{payroll.employee.user.get_full_name()} ({payroll.employee.employee_id})",
            amount=payroll.net_salary,
            tax_amount=0.00,
            payment_method=method,
            payment_date=today,
            status="Paid",
            receipt_reference=payroll.payslip_number,
            notes=f"Corporate NEFT payroll payout ref {ref}"
        )

        return Response({
            'success': True,
            'message': f"Salary of ₹{payroll.net_salary:,.2f} marked as Paid for {payroll.employee.user.get_full_name()}",
            'payroll': PayrollRecordSerializer(payroll).data
        })


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().order_by('-date')
    serializer_class = AttendanceSerializer
    search_fields = ['employee__user__first_name', 'employee__user__last_name', 'employee__employee_id', 'notes']
    filterset_fields = ['date', 'status', 'employee']

    @action(detail=False, methods=['post'])
    def mark_daily(self, request):
        target_date_str = request.data.get('date') or datetime.date.today().isoformat()
        records_data = request.data.get('records', [])

        saved_count = 0
        for item in records_data:
            emp_id = item.get('employee_id')
            stat = item.get('status', AttendanceStatus.PRESENT)
            notes = item.get('notes', '')

            try:
                emp = EmployeeProfile.objects.get(id=emp_id)
                Attendance.objects.update_or_create(
                    employee=emp,
                    date=target_date_str,
                    defaults={'status': stat, 'notes': notes}
                )
                saved_count += 1
            except EmployeeProfile.DoesNotExist:
                continue

        return Response({
            'success': True,
            'message': f"Updated attendance for {saved_count} staff on {target_date_str}",
            'saved_count': saved_count
        })

    @action(detail=False, methods=['get'])
    def monthly_report(self, request):
        month = int(request.query_params.get('month', datetime.date.today().month))
        year = int(request.query_params.get('year', datetime.date.today().year))

        employees = EmployeeProfile.objects.all().order_by('employee_id')
        report_data = []

        for emp in employees:
            attendances = Attendance.objects.filter(
                employee=emp,
                date__year=year,
                date__month=month
            )

            total_logged = attendances.count()
            present_cnt = attendances.filter(status=AttendanceStatus.PRESENT).count()
            wfh_cnt = attendances.filter(status=AttendanceStatus.WFH).count()
            half_cnt = attendances.filter(status=AttendanceStatus.HALF_DAY).count()
            leave_cnt = attendances.filter(status=AttendanceStatus.ON_LEAVE).count()
            absent_cnt = attendances.filter(status=AttendanceStatus.ABSENT).count()

            # Effective working days present (present + wfh + 0.5 * half_day)
            effective_present = present_cnt + wfh_cnt + (0.5 * half_cnt)
            attendance_rate = round((effective_present / total_logged * 100), 1) if total_logged > 0 else 100.0

            report_data.append({
                'employee_id': str(emp.id),
                'employee_code': emp.employee_id,
                'name': emp.user.get_full_name() or emp.user.username,
                'role': emp.user.role,
                'designation': emp.user.designation,
                'department': emp.user.department,
                'avatar': emp.user.avatar_text,
                'total_days': total_logged,
                'present': present_cnt,
                'wfh': wfh_cnt,
                'half_day': half_cnt,
                'on_leave': leave_cnt,
                'absent': absent_cnt,
                'attendance_rate': attendance_rate,
            })

        return Response({
            'success': True,
            'month': month,
            'year': year,
            'report': report_data
        })
