from django.urls import path
from reports.views import dashboard_stats, analytics_reports, master_report

urlpatterns = [
    path('dashboard-stats/', dashboard_stats, name='dashboard_stats'),
    path('analytics/', analytics_reports, name='analytics_reports'),
    path('master-report/', master_report, name='master_report'),
]

