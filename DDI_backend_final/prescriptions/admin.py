# prescriptions/admin.py
from django.contrib import admin
from .models import Medication

@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "drug_name", "dosage", "frequency", "is_current")
    list_filter = ("is_current",)
    autocomplete_fields = ("patient",)
