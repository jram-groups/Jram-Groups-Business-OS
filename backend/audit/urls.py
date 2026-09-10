from django.urls import path, include
from rest_framework.routers import DefaultRouter
from audit.views import ActivityLogViewSet

router = DefaultRouter()
router.register(r'', ActivityLogViewSet, basename='audit')

urlpatterns = [
    path('', include(router.urls)),
]
