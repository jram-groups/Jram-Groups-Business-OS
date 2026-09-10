from django.urls import path, include
from rest_framework.routers import DefaultRouter
from marketing.views import SocialMediaClientViewSet

router = DefaultRouter()
router.register(r'social-clients', SocialMediaClientViewSet, basename='social_clients')

urlpatterns = [
    path('', include(router.urls)),
]
