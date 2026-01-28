# patients/serializers.py
from rest_framework import serializers
from .models import Patient
from prescriptions.models import Medication


def _drug_display_name(drug) -> str:
    if not drug:
        return ""
    # Try common name fields on your Drug model
    return getattr(drug, "name", None) \
        or getattr(drug, "generic_name", None) \
        or getattr(drug, "brand_name", None) \
        or ""


class PatientMedicationInlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = (
            "id",
            "drug_name",
            "dosage",
            "frequency",
            "start_date",
            "end_date",
        )


class PatientSerializer(serializers.ModelSerializer):
    # Add nested list of medications on patient detail
    medications = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = (
            "id",
            "full_name",
            "dob",
            "gender",
            "patient_id",
            "phone",
            "email",
            "hospital",
            "allergies",
            "past_adverse_reactions",
            "medical_conditions",
            "genetic_info",
            "weight_kg",
            "height_cm",
            "blood_type",
            "emergency_contact",
            "medications",
        )
        read_only_fields = ("patient_id", "hospital")

    def get_medications(self, obj):
        qs = (
            Medication.objects
            .filter(patient=obj)
            .order_by("-id")
        )
        return PatientMedicationInlineSerializer(qs, many=True).data

    def create(self, validated_data):
        # Auto-attach hospital from the logged-in professional (or admin)
        request = self.context["request"]
        user = request.user

        if hasattr(user, "professional_profile"):
            validated_data["hospital"] = user.professional_profile.hospital
        elif hasattr(user, "admin_profile"):
            validated_data["hospital"] = user.admin_profile.hospital
        else:
            raise serializers.ValidationError("User is not associated with a hospital.")

        # Generate patient_id
        from django.utils.crypto import get_random_string
        validated_data["patient_id"] = get_random_string(10).upper()

        return super().create(validated_data)
