from django.db import models
from django.conf import settings
from django.utils import timezone


class DDICheck(models.Model):
    """Log of DDI checks performed by users"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='ddi_checks')
    drug1 = models.CharField(max_length=255)
    drug2 = models.CharField(max_length=255)
    severity = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    extended_explanation = models.TextField(blank=True)
    recommendation = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='success', choices=[
        ('success', 'Success'),
        ('error', 'Error'),
        ('timeout', 'Timeout'),
    ])
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.drug1} + {self.drug2} by {self.user.email if self.user else 'Anonymous'}"


class ErrorLog(models.Model):
    """Log of system errors for monitoring"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    endpoint = models.CharField(max_length=500)
    method = models.CharField(max_length=10)
    status_code = models.IntegerField()
    error_message = models.TextField()
    user_agent = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.status_code} - {self.endpoint}"


class SystemAnnouncement(models.Model):
    """System-wide announcements"""
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class SystemSettings(models.Model):
    """Global system settings"""
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'System Setting'
        verbose_name_plural = 'System Settings'

    def __str__(self):
        return self.key
