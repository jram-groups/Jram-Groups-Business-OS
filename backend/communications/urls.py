from django.urls import path, include
from rest_framework.routers import DefaultRouter
from communications.views import WhatsAppLogViewSet, EmailLogViewSet, send_whatsapp_api, send_email_api

router = DefaultRouter()
router.register(r'whatsapp-logs', WhatsAppLogViewSet, basename='whatsapp_logs')
router.register(r'email-logs', EmailLogViewSet, basename='email_logs')

urlpatterns = [
    path('send-whatsapp/', send_whatsapp_api, name='send_whatsapp'),
    path('send-email/', send_email_api, name='send_email'),
    path('', include(router.urls)),
]
