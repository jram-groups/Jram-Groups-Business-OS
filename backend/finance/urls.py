from django.urls import path, include
from rest_framework.routers import DefaultRouter
from finance.views import QuotationViewSet, InvoiceViewSet, PaymentViewSet, IncomeViewSet, ExpenseViewSet

router = DefaultRouter()
router.register(r'quotations', QuotationViewSet, basename='quotations')
router.register(r'invoices', InvoiceViewSet, basename='invoices')
router.register(r'payments', PaymentViewSet, basename='payments')
router.register(r'income', IncomeViewSet, basename='income')
router.register(r'expenses', ExpenseViewSet, basename='expenses')

urlpatterns = [
    path('', include(router.urls)),
]

