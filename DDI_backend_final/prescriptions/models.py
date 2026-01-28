# prescriptions/models.py
from django.db import models
from patients.models import Patient
from accounts.models import ProfessionalProfile
from drugs.models import Drug

class Medication(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="medications")
    drug_name = models.CharField(max_length=255, blank=True, default='')  # Drug name as string
    dosage = models.CharField(max_length=100)     # e.g., 10 mg
    frequency = models.CharField(max_length=100)  # e.g., bid
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=True)
    prescribed_by = models.ForeignKey(ProfessionalProfile, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.patient} - {self.drug_name} {self.dosage} {self.frequency}"
