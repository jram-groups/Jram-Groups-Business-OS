from django.urls import path, include
from rest_framework.routers import DefaultRouter
from employees.views import EmployeeProfileViewSet, PayrollRecordViewSet, AttendanceViewSet

router = DefaultRouter()
router.register(r'payroll', PayrollRecordViewSet, basename='payroll')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'', EmployeeProfileViewSet, basename='employees')

urlpatterns = [
    path('', include(router.urls)),
]
