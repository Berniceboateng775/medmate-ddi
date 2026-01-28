# patients/models.py
from django.db import models
from accounts.models import Hospital

class Patient(models.Model):
    # Patient core
    full_name = models.CharField(max_length=255)  # allow initials if desired in UI
    dob = models.DateField()
    gender = models.CharField(max_length=20, choices=[
        ("Male","Male"), ("Female","Female"), ("Other","Other"), ("PreferNotToSay","Prefer not to say")
    ])
    patient_id = models.CharField(max_length=20, unique=True)  # system generated
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name="patients")

    # Drug-related medical fields
    allergies = models.TextField(blank=True)  # simple MVP: CSV or free text
    past_adverse_reactions = models.TextField(blank=True)
    medical_conditions = models.TextField(blank=True)
    genetic_info = models.TextField(blank=True)  # e.g., CYP2D6 status
    weight_kg = models.FloatField(null=True, blank=True)
    height_cm = models.FloatField(null=True, blank=True)
    blood_type = models.CharField(max_length=3, blank=True)
    emergency_contact = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.full_name} ({self.patient_id})"
