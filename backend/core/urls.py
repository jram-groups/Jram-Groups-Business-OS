from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import UserViewSet, auth_me, switch_active_role, auth_login, user_profile, change_password

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')

urlpatterns = [
    path('auth/login/', auth_login, name='auth_login'),
    path('auth/me/', auth_me, name='auth_me'),
    path('auth/profile/', user_profile, name='user_profile'),
    path('auth/change-password/', change_password, name='change_password'),
    path('auth/switch-role/', switch_active_role, name='switch_role'),
    path('', include(router.urls)),
]

