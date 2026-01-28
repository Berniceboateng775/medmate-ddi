# accounts/permissions.py
from rest_framework.permissions import BasePermission
from .models import Roles

class IsSuperuser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == Roles.ADMIN)

class IsDoctorOrPharmacist(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role in (Roles.DOCTOR, Roles.PHARMACIST))
