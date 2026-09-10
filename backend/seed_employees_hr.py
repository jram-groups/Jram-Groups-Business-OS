import datetime
import random
from employees.models import EmployeeProfile, PayrollRecord, Attendance, PayrollStatus, AttendanceStatus

def seed_hr():
    print("Seeding Employees HR, Payroll, and Attendance data...")

    profiles = list(EmployeeProfile.objects.all())
    if not profiles:
        print("No employee profiles found!")
        return

    salary_map = {
        'arun_founder': 250000,
        'priya_ceo': 180000,
        'rahul_manager': 115000,
        'divya_head': 95000,
        'rohan_dev': 75000,
        'kavya_intern': 25000,
    }

    details_map = {
        'arun_founder': {
            'phone_secondary': '+91 94440 12345',
            'blood_group': 'O+',
            'pan_number': 'ABCPA1234K',
            'bank_account_number': '5010023918231',
            'bank_ifsc_code': 'HDFC0000240',
            'emergency_contact': 'Kavitha Kumar (+91 98840 98765)',
            'skills': ['Strategic Leadership', 'Venture Growth', 'Fullstack Architecture', 'Enterprise Sales'],
        },
        'priya_ceo': {
            'phone_secondary': '+91 98401 22334',
            'blood_group': 'A+',
            'pan_number': 'BPRPS4512M',
            'bank_account_number': '5010044819283',
            'bank_ifsc_code': 'HDFC0000240',
            'emergency_contact': 'Ramesh Sharma (+91 98401 99887)',
            'skills': ['Corporate Strategy', 'Client Relations', 'P&L Optimization', 'Brand Strategy'],
        },
        'rahul_manager': {
            'phone_secondary': '+91 97908 33445',
            'blood_group': 'B+',
            'pan_number': 'CRPRR9921L',
            'bank_account_number': '9120100349182',
            'bank_ifsc_code': 'UTIB0001042',
            'emergency_contact': 'Suresh Raj (+91 97908 11223)',
            'skills': ['Agile Scrum', 'Resource Planning', 'Operations', 'Client Delivery'],
        },
        'divya_head': {
            'phone_secondary': '+91 99620 44556',
            'blood_group': 'AB+',
            'pan_number': 'DMNDM7731P',
            'bank_account_number': '2039182391023',
            'bank_ifsc_code': 'SBIN0001823',
            'emergency_contact': 'Menon Govind (+91 99620 99881)',
            'skills': ['System Architecture', 'React & Node.js', 'Team Mentorship', 'Media Production'],
        },
        'rohan_dev': {
            'phone_secondary': '+91 96001 55667',
            'blood_group': 'O+',
            'pan_number': 'RDSRD3321Q',
            'bank_account_number': '6019283918239',
            'bank_ifsc_code': 'ICIC0000104',
            'emergency_contact': 'Anjali Das (+91 96001 11229)',
            'skills': ['Django REST Framework', 'React & Tailwind', 'PostgreSQL', 'Docker'],
        },
        'kavya_intern': {
            'phone_secondary': '+91 95000 66778',
            'blood_group': 'B+',
            'pan_number': 'KNKN44821R',
            'bank_account_number': '1029384918293',
            'bank_ifsc_code': 'HDFC0000180',
            'emergency_contact': 'Nair Radhakrishnan (+91 95000 99882)',
            'skills': ['Frontend Prototyping', 'Content Research', 'Video Editing', 'Social Media'],
        },
    }

    # 1. Update Profile Info & Encrypted Salary
    for ep in profiles:
        username = ep.user.username
        if username in salary_map:
            ep.salary = str(salary_map[username])
        if username in details_map:
            d = details_map[username]
            ep.phone_secondary = d['phone_secondary']
            ep.blood_group = d['blood_group']
            ep.pan_number = d['pan_number']
            ep.bank_account_number = d['bank_account_number']
            ep.bank_ifsc_code = d['bank_ifsc_code']
            ep.emergency_contact = d['emergency_contact']
            ep.skills = d['skills']
        ep.save()
    print("Updated salaries & profile details.")

    # 2. Seed Payroll Records for August 2026 (All Paid) & September 2026 (Mixed)
    months_to_seed = [
        ('August 2026', 2026, 8, True),
        ('September 2026', 2026, 9, False),
    ]

    for month_name, year, m_num, all_paid in months_to_seed:
        for idx, ep in enumerate(profiles, start=1):
            payslip_no = f"PAY-{year}{m_num:02d}-{idx:03d}"
            existing = PayrollRecord.objects.filter(payslip_number=payslip_no).first()
            if existing:
                continue

            ctc = float(ep.salary or 50000)
            basic = round(ctc * 0.50, 2)
            hra = round(ctc * 0.30, 2)
            allowances = round(ctc * 0.20, 2)
            pf = round(min(basic * 0.12, 1800.0), 2)
            pt = 200.00 if ctc > 15000 else 0.00
            deductions = round(pf + pt, 2)
            net_salary = round((basic + hra + allowances) - deductions, 2)

            is_paid = all_paid or (ep.user.role in ['FOUNDER', 'CEO', 'MANAGER'])
            pay_status = PayrollStatus.PAID if is_paid else PayrollStatus.PENDING
            p_date = datetime.date(year, m_num, 1) if is_paid else None
            p_ref = f"NEFT-SAL-{year}{m_num:02d}-{idx:03d}" if is_paid else None

            PayrollRecord.objects.create(
                employee=ep,
                month=month_name,
                year=year,
                month_number=m_num,
                basic_salary=basic,
                hra=hra,
                allowances=allowances,
                deductions=deductions,
                net_salary=net_salary,
                payment_status=pay_status,
                payment_date=p_date,
                payment_method='Bank Transfer',
                transaction_reference=p_ref,
                payslip_number=payslip_no,
                notes=f"Processed payroll disbursement for {month_name}"
            )
    print(f"Total Payroll Records in database: {PayrollRecord.objects.count()}")

    # 3. Seed Daily Attendance for September 2026 (Sept 1 to Sept 7)
    dates = [
        datetime.date(2026, 9, 1),
        datetime.date(2026, 9, 2),
        datetime.date(2026, 9, 3),
        datetime.date(2026, 9, 4),
        datetime.date(2026, 9, 5),
        datetime.date(2026, 9, 7), # Mon
    ]

    for d in dates:
        for ep in profiles:
            existing = Attendance.objects.filter(employee=ep, date=d).first()
            if existing:
                continue

            # Deterministic variation
            if d.day == 4 and ep.user.username == 'rohan_dev':
                stat = AttendanceStatus.WFH
                notes = 'Approved remote development day'
            elif d.day == 5 and ep.user.username == 'kavya_intern':
                stat = AttendanceStatus.ON_LEAVE
                notes = 'College exam leave'
            elif d.day == 3 and ep.user.username == 'divya_head':
                stat = AttendanceStatus.WFH
                notes = 'Onsite shoot coordination'
            else:
                stat = AttendanceStatus.PRESENT
                notes = 'In-office biometric check-in'

            Attendance.objects.create(
                employee=ep,
                date=d,
                status=stat,
                check_in=datetime.time(9, random.randint(5, 30)),
                check_out=datetime.time(18, random.randint(0, 45)),
                notes=notes
            )
    print(f"Total Attendance Records in database: {Attendance.objects.count()}")
    print("HR, Payroll, and Attendance seeding completed successfully!")

if __name__ == '__main__':
    seed_hr()
