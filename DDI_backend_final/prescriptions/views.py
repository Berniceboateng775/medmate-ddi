# prescriptions/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.conf import settings

from accounts.permissions import IsDoctorOrPharmacist
from accounts.models import Roles
from .models import Medication
from .serializers import MedicationSerializer

# If you added the notifications app:
from notifications.models import Notification


class MedicationViewSet(viewsets.ModelViewSet):
    serializer_class = MedicationSerializer
    permission_classes = [IsAuthenticated, IsDoctorOrPharmacist]

    def get_queryset(self):
        prof = self.request.user.professional_profile
        qs = (
            Medication.objects
            .filter(patient__hospital=prof.hospital)
            .select_related("patient", "prescribed_by__user")
        )
        # allow filtering by patient
        pid = self.request.query_params.get("patient")
        if pid:
            qs = qs.filter(patient_id=pid)
        return qs

    # ------------- substitution notification helpers -------------

    def _notify_substitution_if_needed(self, *, request, instance, old_drug_name, new_drug_name):
        """
        If a PHARMACIST changed the drug on this medication, notify the prescribing DOCTOR.
        """
        user = request.user
        if getattr(user, "role", "").upper() != Roles.PHARMACIST:
            return
        if old_drug_name == new_drug_name:
            return

        # Determine prescriber (doctor) to notify
        prescriber_prof = getattr(instance, "prescribed_by", None)  # ProfessionalProfile or None
        doctor_user = getattr(prescriber_prof, "user", None)
        if not doctor_user or getattr(doctor_user, "role", "").upper() != Roles.DOCTOR:
            return

        # Build nice message with names
        pharmacist_prof = getattr(user, "professional_profile", None)
        pharmacist_name = (
            f"{pharmacist_prof.first_name} {pharmacist_prof.last_name}".strip()
            if pharmacist_prof else user.email
        )
        patient = getattr(instance, "patient", None)

        title = "Medication Substitution"
        message = (
            f"{pharmacist_name} substituted a medication for patient "
            f"{getattr(patient, 'full_name', 'Unknown')}."
        )
        if old_drug_name or new_drug_name:
            message += f" {old_drug_name or 'Previous drug'} → {new_drug_name or 'New drug'}."

        # Create in-app notification
        try:
            Notification.objects.create(
                recipient=doctor_user,
                title=title,
                message=message,
                patient_id=getattr(patient, "id", None),
                medication_id=getattr(instance, "id", None),
            )
        except Exception:
            # If notifications app isn't present, just skip quietly
            pass

        # Best-effort email (console backend in dev)
        try:
            send_mail(
                subject=title,
                message=message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@medmate.local"),
                recipient_list=[doctor_user.email],
                fail_silently=True,
            )
        except Exception:
            pass

    # ------------- overrides to detect substitution -------------

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_drug_name = getattr(instance, "drug_name", None)
        response = super().update(request, *args, **kwargs)

        # Compare after save
        try:
            instance.refresh_from_db()
        except Exception:
            return response

        new_drug_name = getattr(instance, "drug_name", None)
        self._notify_substitution_if_needed(
            request=request,
            instance=instance,
            old_drug_name=old_drug_name,
            new_drug_name=new_drug_name,
        )
        return response

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_drug_name = getattr(instance, "drug_name", None)
        response = super().partial_update(request, *args, **kwargs)

        try:
            instance.refresh_from_db()
        except Exception:
            return response

        new_drug_name = getattr(instance, "drug_name", None)
        self._notify_substitution_if_needed(
            request=request,
            instance=instance,
            old_drug_name=old_drug_name,
            new_drug_name=new_drug_name,
        )
        return response
