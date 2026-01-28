# prescriptions/serializers.py
from rest_framework import serializers
from .models import Medication

class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = (
            "id",
            "patient",
            "drug_name",
            "dosage",
            "frequency",
            "start_date",
            "end_date",
            "prescribed_by",
        )
        read_only_fields = ("prescribed_by",)

    def create(self, validated_data):
        request = self.context["request"]
        prof = request.user.professional_profile  # assumes every prescriber has one
        validated_data["prescribed_by"] = prof
        return super().create(validated_data)
