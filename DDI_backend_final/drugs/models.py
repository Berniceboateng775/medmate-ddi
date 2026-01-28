# drugs/models.py
from django.db import models

class Drug(models.Model):
    name = models.CharField(max_length=255, unique=True)
    atc_code = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.name
