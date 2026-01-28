# drugs/admin.py
from django.contrib import admin
from .models import Drug

@admin.register(Drug)
class DrugAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "atc_code")
    search_fields = ("name", "atc_code")
