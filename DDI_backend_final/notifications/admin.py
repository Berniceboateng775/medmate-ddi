# notifications/admin.py
from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("recipient", "title", "created_at", "read_at")
    search_fields = ("recipient__email", "title", "message")
    list_filter = ("read_at",)
