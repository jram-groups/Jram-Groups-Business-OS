from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('api/clients/', include('clients.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/employees/', include('employees.urls')),
    path('api/finance/', include('finance.urls')),
    path('api/marketing/', include('marketing.urls')),
    path('api/communications/', include('communications.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/audit/', include('audit.urls')),
    path('api/inventory/', include('inventory.urls')),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
