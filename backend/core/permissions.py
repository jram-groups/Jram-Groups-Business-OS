from rest_framework import permissions
from core.models import UserRole

class IsFounder(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.FOUNDER)

class IsFounderOrCEO(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and 
            request.user.role in [UserRole.FOUNDER, UserRole.CEO]
        )

class IsManagerOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and 
            request.user.role in [UserRole.FOUNDER, UserRole.CEO, UserRole.MANAGER]
        )

class IsTeamHeadOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and 
            request.user.role in [UserRole.FOUNDER, UserRole.CEO, UserRole.MANAGER, UserRole.TEAM_HEAD]
        )

class IsEmployeeOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and 
            request.user.role in [UserRole.FOUNDER, UserRole.CEO, UserRole.MANAGER, UserRole.TEAM_HEAD, UserRole.EMPLOYEE]
        )
