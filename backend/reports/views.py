from django.db.models import Sum, Count, Q, F
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from clients.models import Client, ClientStatus
from projects.models import Project, Task, ProjectPriority, ProjectStatus, TaskStatus
from employees.models import EmployeeProfile
from finance.models import Invoice, Quotation, Payment, InvoicePaymentStatus, QuotationStatus, Income, Expense
from inventory.models import EquipmentAsset, StockItem
from marketing.models import SocialMediaClient
from core.models import User

@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_stats(request):
    """
    Get live aggregated business statistics directly from database
    """
    total_clients = Client.objects.count()
    active_clients = Client.objects.filter(client_status=ClientStatus.ACTIVE).count()
    
    total_employees = User.objects.filter(is_active=True).count()
    
    total_projects = Project.objects.count()
    active_projects = Project.objects.filter(status=ProjectStatus.IN_PROGRESS).count()
    completed_projects = Project.objects.filter(status=ProjectStatus.COMPLETED).count()
    pending_projects = Project.objects.filter(status__in=[ProjectStatus.NEW, ProjectStatus.PLANNING, ProjectStatus.ASSIGNED]).count()
    urgent_projects = Project.objects.filter(priority=ProjectPriority.URGENT).count()
    
    # Financials
    paid_inv = Invoice.objects.filter(payment_status=InvoicePaymentStatus.PAID).aggregate(s=Sum('total_amount'))['s'] or 0.0
    pending_inv = Invoice.objects.filter(payment_status__in=[InvoicePaymentStatus.PENDING, InvoicePaymentStatus.PARTIALLY_PAID, InvoicePaymentStatus.OVERDUE]).aggregate(s=Sum('total_amount'))['s'] or 0.0
    
    # Live Income & Expense Sums
    total_income_sum = float(Income.objects.aggregate(s=Sum('amount'))['s'] or 0.0)
    total_expenses_sum = float(Expense.objects.aggregate(s=Sum('amount'))['s'] or 0.0)
    total_revenue = float(paid_inv) if paid_inv > 0 else total_income_sum
    operating_expenses = total_expenses_sum
    net_profit = total_revenue - operating_expenses

    pending_payments = float(pending_inv)
    
    pending_quotations_count = Quotation.objects.filter(status__in=[QuotationStatus.DRAFT, QuotationStatus.SENT]).count()
    pending_invoices_count = Invoice.objects.filter(payment_status__in=[InvoicePaymentStatus.PENDING, InvoicePaymentStatus.OVERDUE]).count()
    
    # Marketing
    social_clients_count = SocialMediaClient.objects.count()
    marketing_projects_count = Project.objects.filter(service_type__icontains='Marketing').count()
    videos_completed_count = SocialMediaClient.objects.aggregate(v=Sum('videos_completed'))['v'] or 0
    
    # Tasks
    tasks_pending = Task.objects.filter(status__in=[TaskStatus.PENDING, TaskStatus.IN_PROGRESS]).count()
    tasks_completed = Task.objects.filter(status=TaskStatus.COMPLETED).count()

    # Inventory & Assets
    total_assets = EquipmentAsset.objects.count()
    total_asset_val = float(EquipmentAsset.objects.aggregate(s=Sum('purchase_cost'))['s'] or 0.0)
    low_stock_items = StockItem.objects.filter(quantity__lte=F('min_stock_threshold')).count()

    return Response({
        'success': True,
        'stats': {
            'total_clients': total_clients,
            'active_clients': active_clients,
            'total_employees': total_employees,
            'total_projects': total_projects,
            'active_projects': active_projects,
            'completed_projects': completed_projects,
            'pending_projects': pending_projects,
            'urgent_projects': urgent_projects,
            'total_revenue': total_revenue,
            'total_income': total_income_sum,
            'total_expenses': operating_expenses,
            'net_profit': net_profit,
            'pending_payments': pending_payments,
            'paid_amount': total_revenue,
            'pending_quotations': pending_quotations_count,
            'pending_invoices': pending_invoices_count,
            'digital_marketing_projects': marketing_projects_count,
            'social_media_clients': social_clients_count,
            'videos_completed': videos_completed_count,
            'tasks_pending': tasks_pending,
            'tasks_completed': tasks_completed,
            'total_assets': total_assets,
            'total_asset_val': total_asset_val,
            'low_stock_items': low_stock_items,
        }
    })


import datetime
import calendar

def get_dynamic_monthly_cashflow():
    """
    Computes real monthly revenue (from Income and paid Invoices) and operating expenses
    for the trailing 6 months chronologically directly from the database.
    """
    today = datetime.date.today()
    results = []

    for i in range(5, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1

        month_label = calendar.month_abbr[m]

        # Inflow: Income recorded in this month
        income_sum = float(Income.objects.filter(
            payment_date__year=y,
            payment_date__month=m
        ).aggregate(s=Sum('amount'))['s'] or 0.0)

        # Expense recorded in this month
        expense_sum = float(Expense.objects.filter(
            payment_date__year=y,
            payment_date__month=m
        ).aggregate(s=Sum('amount'))['s'] or 0.0)

        results.append({
            'month': month_label,
            'year': y,
            'revenue': income_sum,
            'expenses': expense_sum,
            'profit': income_sum - expense_sum
        })

    return results


@api_view(['GET'])
@permission_classes([AllowAny])
def analytics_reports(request):
    """
    Get live analytics and multi-chart dataset for Reports page computed directly from active database
    """
    monthly_revenue = get_dynamic_monthly_cashflow()

    # Project Priority Breakdown (100% live counts, zero hardcoded fallbacks)
    priority_dist = [
        {'name': 'Low', 'value': Project.objects.filter(priority=ProjectPriority.LOW).count()},
        {'name': 'Medium', 'value': Project.objects.filter(priority=ProjectPriority.MEDIUM).count()},
        {'name': 'High', 'value': Project.objects.filter(priority=ProjectPriority.HIGH).count()},
        {'name': 'Urgent', 'value': Project.objects.filter(priority=ProjectPriority.URGENT).count()},
    ]

    # Project Status Breakdown (100% live counts, zero hardcoded fallbacks)
    status_dist = [
        {'name': 'In Progress', 'value': Project.objects.filter(status=ProjectStatus.IN_PROGRESS).count()},
        {'name': 'Completed', 'value': Project.objects.filter(status=ProjectStatus.COMPLETED).count()},
        {'name': 'Planning', 'value': Project.objects.filter(status=ProjectStatus.PLANNING).count()},
        {'name': 'On Hold', 'value': Project.objects.filter(status=ProjectStatus.ON_HOLD).count()},
    ]

    # Employee Workload (aggregated from real tasks assigned)
    workload_map = {}
    for task in Task.objects.select_related('assigned_to').all():
        if task.assigned_to:
            name = task.assigned_to.get_full_name() or task.assigned_to.username
            if name not in workload_map:
                workload_map[name] = {'name': name, 'tasks': 0, 'completed': 0}
            workload_map[name]['tasks'] += 1
            if task.status == TaskStatus.COMPLETED:
                workload_map[name]['completed'] += 1
    employee_workload = list(workload_map.values())

    # Quotation & Invoice Conversion (100% dynamic, zero hardcoded fallbacks)
    total_q = Quotation.objects.count()
    accepted_q = Quotation.objects.filter(status=QuotationStatus.ACCEPTED).count()
    conv_rate = round((accepted_q / total_q * 100), 1) if total_q > 0 else 0.0

    conversion = {
        'total_quotations': total_q,
        'accepted_quotations': accepted_q,
        'conversion_rate_pct': conv_rate
    }

    return Response({
        'success': True,
        'analytics': {
            'monthly_revenue': monthly_revenue,
            'priority_distribution': priority_dist,
            'status_distribution': status_dist,
            'employee_workload': employee_workload,
            'conversion': conversion
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def master_report(request):
    """
    Consolidated Master Enterprise Report API:
    Aggregates all modules with zero data omissions for full analytics & PDF reporting
    """
    from finance.serializers import InvoiceSerializer, QuotationSerializer, IncomeSerializer, ExpenseSerializer
    from projects.serializers import ProjectSerializer, TaskSerializer
    from employees.serializers import EmployeeProfileSerializer
    from inventory.serializers import EquipmentAssetSerializer, StockItemSerializer
    from marketing.serializers import SocialMediaClientSerializer
    from clients.serializers import ClientSerializer

    # 1. Financial KPIs
    paid_inv = float(Invoice.objects.filter(payment_status=InvoicePaymentStatus.PAID).aggregate(s=Sum('total_amount'))['s'] or 0.0)
    pending_inv = float(Invoice.objects.filter(payment_status__in=[
        InvoicePaymentStatus.PENDING, InvoicePaymentStatus.PARTIALLY_PAID, InvoicePaymentStatus.OVERDUE
    ]).aggregate(s=Sum('total_amount'))['s'] or 0.0)
    total_income = float(Income.objects.aggregate(s=Sum('amount'))['s'] or 0.0)
    total_expenses = float(Expense.objects.aggregate(s=Sum('amount'))['s'] or 0.0)
    gross_revenue = paid_inv if paid_inv > 0 else total_income
    net_profit = gross_revenue - total_expenses
    profit_margin = round((net_profit / gross_revenue * 100), 1) if gross_revenue > 0 else 0.0

    # 2. Operational KPIs
    total_clients = Client.objects.count()
    active_clients = Client.objects.filter(client_status=ClientStatus.ACTIVE).count()
    total_projects = Project.objects.count()
    active_projects = Project.objects.filter(status=ProjectStatus.IN_PROGRESS).count()
    completed_projects = Project.objects.filter(status=ProjectStatus.COMPLETED).count()
    urgent_projects = Project.objects.filter(priority=ProjectPriority.URGENT).count()
    total_tasks = Task.objects.count()
    completed_tasks = Task.objects.filter(status=TaskStatus.COMPLETED).count()
    pending_tasks = total_tasks - completed_tasks

    # 3. Workforce & Inventory KPIs
    total_employees = EmployeeProfile.objects.count()
    total_assets = EquipmentAsset.objects.count()
    total_asset_value = float(EquipmentAsset.objects.aggregate(s=Sum('purchase_cost'))['s'] or 0.0)
    low_stock_count = StockItem.objects.filter(quantity__lte=F('min_stock_threshold')).count()
    social_clients_count = SocialMediaClient.objects.count()

    kpi = {
        'gross_revenue': gross_revenue,
        'total_income': total_income,
        'total_expenses': total_expenses,
        'net_profit': net_profit,
        'profit_margin': profit_margin,
        'pending_receivables': pending_inv,
        'total_clients': total_clients,
        'active_clients': active_clients,
        'total_projects': total_projects,
        'active_projects': active_projects,
        'completed_projects': completed_projects,
        'urgent_projects': urgent_projects,
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'pending_tasks': pending_tasks,
        'task_completion_rate': round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0,
        'total_employees': total_employees,
        'total_assets': total_assets,
        'total_asset_value': total_asset_value,
        'low_stock_items': low_stock_count,
        'social_media_clients': social_clients_count,
    }

    # Complete Data Sets (Zero Omissions)
    invoices = InvoiceSerializer(Invoice.objects.select_related('client', 'project').all().order_by('-invoice_date'), many=True).data
    quotations = QuotationSerializer(Quotation.objects.select_related('client', 'project').all().order_by('-created_at'), many=True).data
    incomes = IncomeSerializer(Income.objects.select_related('client', 'project', 'invoice').all().order_by('-payment_date'), many=True).data
    expenses = ExpenseSerializer(Expense.objects.all().order_by('-payment_date'), many=True).data
    projects = ProjectSerializer(Project.objects.select_related('client').prefetch_related('assigned_employees').all().order_by('-created_at'), many=True).data
    tasks = TaskSerializer(Task.objects.select_related('project', 'assigned_to').all().order_by('-created_at'), many=True).data
    employees = EmployeeProfileSerializer(EmployeeProfile.objects.select_related('user').all().order_by('-created_at'), many=True).data
    assets = EquipmentAssetSerializer(EquipmentAsset.objects.select_related('assigned_to').all().order_by('-created_at'), many=True).data
    stock = StockItemSerializer(StockItem.objects.all().order_by('name'), many=True).data
    social_clients = SocialMediaClientSerializer(SocialMediaClient.objects.all().order_by('-created_at'), many=True).data
    clients = ClientSerializer(Client.objects.all().order_by('name'), many=True).data

    # Dynamic trailing cash flow trajectory computed from real database entries
    monthly_revenue = get_dynamic_monthly_cashflow()

    return Response({
        'success': True,
        'kpi': kpi,
        'invoices': invoices,
        'quotations': quotations,
        'incomes': incomes,
        'expenses': expenses,
        'projects': projects,
        'tasks': tasks,
        'employees': employees,
        'assets': assets,
        'stock': stock,
        'social_clients': social_clients,
        'clients': clients,
        'monthly_revenue': monthly_revenue,
    })


