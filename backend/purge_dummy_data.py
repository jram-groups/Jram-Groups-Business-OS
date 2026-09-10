import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from django.db import transaction
from core.models import User
from employees.models import EmployeeProfile, PayrollRecord, Attendance
from clients.models import Client
from projects.models import Project, Task
from finance.models import Quotation, Invoice, Payment, Income, Expense
from marketing.models import SocialMediaClient
from inventory.models import EquipmentAsset, StockItem
from communications.models import WhatsAppLog, EmailLog
from notifications.models import Notification
from audit.models import ActivityLog

def purge_dummy_data():
    print("==================================================")
    print("STARTING CONTROLLED DUMMY DATA PURGE")
    print("Preserving ALL login user accounts in core.User...")
    print("==================================================")

    # 1. Check existing users
    users = list(User.objects.all())
    print(f"Preserving {len(users)} login user accounts:")
    for u in users:
        print(f"  - {u.username} ({u.get_full_name()} - {u.role})")

    with transaction.atomic():
        # Communications & Logs
        w_count = WhatsAppLog.objects.count()
        WhatsAppLog.objects.all().delete()
        print(f"Deleted {w_count} WhatsApp logs.")

        e_count = EmailLog.objects.count()
        EmailLog.objects.all().delete()
        print(f"Deleted {e_count} Email logs.")

        n_count = Notification.objects.count()
        Notification.objects.all().delete()
        print(f"Deleted {n_count} notifications.")

        a_count = ActivityLog.objects.count()
        ActivityLog.objects.all().delete()
        print(f"Deleted {a_count} activity logs.")

        # HR Attendance & Payroll dummy records
        att_count = Attendance.objects.count()
        Attendance.objects.all().delete()
        print(f"Deleted {att_count} attendance records.")

        pay_count = PayrollRecord.objects.count()
        PayrollRecord.objects.all().delete()
        print(f"Deleted {pay_count} payroll records.")

        # Inventory
        ast_count = EquipmentAsset.objects.count()
        EquipmentAsset.objects.all().delete()
        print(f"Deleted {ast_count} equipment assets.")

        stk_count = StockItem.objects.count()
        StockItem.objects.all().delete()
        print(f"Deleted {stk_count} consumable stock items.")

        # Marketing
        mkt_count = SocialMediaClient.objects.count()
        SocialMediaClient.objects.all().delete()
        print(f"Deleted {mkt_count} social media retainers.")

        # Finance
        paym_count = Payment.objects.count()
        Payment.objects.all().delete()
        print(f"Deleted {paym_count} payments.")

        inc_count = Income.objects.count()
        Income.objects.all().delete()
        print(f"Deleted {inc_count} income records.")

        exp_count = Expense.objects.count()
        Expense.objects.all().delete()
        print(f"Deleted {exp_count} expense records.")

        inv_count = Invoice.objects.count()
        Invoice.objects.all().delete()
        print(f"Deleted {inv_count} invoices.")

        quo_count = Quotation.objects.count()
        Quotation.objects.all().delete()
        print(f"Deleted {quo_count} quotations.")

        # Projects & Tasks
        tsk_count = Task.objects.count()
        Task.objects.all().delete()
        print(f"Deleted {tsk_count} tasks.")

        prj_count = Project.objects.count()
        Project.objects.all().delete()
        print(f"Deleted {prj_count} projects.")

        # Clients
        cli_count = Client.objects.count()
        Client.objects.all().delete()
        print(f"Deleted {cli_count} clients.")

        # Keep EmployeeProfile for the active login users, remove any orphaned profiles
        valid_user_ids = [u.id for u in users]
        orphaned_emps = EmployeeProfile.objects.exclude(user_id__in=valid_user_ids)
        orph_count = orphaned_emps.count()
        orphaned_emps.delete()
        print(f"Cleaned {orph_count} orphaned employee profiles.")

        # Record fresh system initialization activity log
        ActivityLog.objects.create(
            user_name="Arun Kumar",
            user_role="Founder",
            action="System Purge & Reset",
            module="System",
            record_title="Live Data Initialization",
            details="All sample dummy records purged. System configured for 100% real user inputs with full cross-page synchronization."
        )
        print("Logged clean system audit record.")

    print("==================================================")
    print("DUMMY DATA PURGE COMPLETE SUCCESSFULLY")
    print(f"Active Users preserved: {User.objects.count()}")
    print(f"Employee Profiles preserved: {EmployeeProfile.objects.count()}")
    print("==================================================")

if __name__ == '__main__':
    purge_dummy_data()
