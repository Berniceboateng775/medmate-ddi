# patients/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdmin, IsDoctorOrPharmacist
from .models import Patient
from .serializers import PatientSerializer

class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer

    def get_permissions(self):
        """
        Allow doctors, pharmacists, and admins to view patients, but only admins to create/modify them.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only admins can create/modify patients
            permission_classes = [IsAuthenticated, IsAdmin]
        else:
            # Doctors, pharmacists, and admins can view patients
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "professional_profile"):
            return Patient.objects.filter(hospital=user.professional_profile.hospital)
        if hasattr(user, "admin_profile"):
            return Patient.objects.filter(hospital=user.admin_profile.hospital)
        if user.is_superuser:
            return Patient.objects.all()
        return Patient.objects.none()
