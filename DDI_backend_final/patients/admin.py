# patients/admin.py
from django.contrib import admin
from .models import Patient

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("id", "patient_id", "full_name", "dob", "gender")
    search_fields = ("patient_id", "full_name", "email", "phone")
    list_filter = ("gender",)
