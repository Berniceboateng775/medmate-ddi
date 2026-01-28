# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from secrets import token_urlsafe, token_hex
from datetime import timedelta
from django.conf import settings
import pyotp
import qrcode
import io
import base64


class Roles(models.TextChoices):
    SUPERUSER = "SUPERUSER", _("Superuser")
    ADMIN = "ADMIN", _("Hospital Admin")
    DOCTOR = "DOCTOR", _("Doctor")
    PHARMACIST = "PHARMACIST", _("Pharmacist")
    NURSE = "NURSE", _("Nurse")


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("email_2fa_enabled", True)  # Enable 2FA by default
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        # Optional: tag superusers with role for app logic
        extra_fields.setdefault("role", Roles.SUPERUSER)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None  # disable username
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.DOCTOR)
    phone = models.CharField(max_length=30, blank=True)

    # 2FA fields
    email_2fa_enabled = models.BooleanField(default=False, help_text="Whether email 2FA is enabled")
    email_2fa_code = models.CharField(max_length=6, blank=True, help_text="Temporary 2FA code")
    email_2fa_code_expires = models.DateTimeField(null=True, blank=True, help_text="When the 2FA code expires")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []  # no extra fields for createsuperuser

    objects = UserManager()  # use our email-based manager

    def __str__(self):
        return f"{self.email} ({self.role})"

    def generate_email_2fa_code(self):
        """Generate and send a 2FA code via email"""
        import random
        self.email_2fa_code = str(random.randint(100000, 999999))
        self.email_2fa_code_expires = timezone.now() + timedelta(minutes=10)
        self.save(update_fields=['email_2fa_code', 'email_2fa_code_expires'])
        from accounts.emails import send_2fa_code
        send_2fa_code(self.email, self.email_2fa_code)
        return self.email_2fa_code


    def verify_email_2fa_code(self, code):
        """Verify the 2FA code"""
        if not self.email_2fa_code or self.email_2fa_code != code or timezone.now() > self.email_2fa_code_expires:
            return False
        return True

    def enable_email_2fa(self):
        """Enable email 2FA"""
        self.email_2fa_enabled = True
        self.email_2fa_code = ''
        self.email_2fa_code_expires = None
        self.save(update_fields=['email_2fa_enabled', 'email_2fa_code', 'email_2fa_code_expires'])

    def disable_email_2fa(self):
        """Disable email 2FA"""
        self.email_2fa_enabled = False
        self.email_2fa_code = ''
        self.email_2fa_code_expires = None
        self.save(update_fields=['email_2fa_enabled', 'email_2fa_code', 'email_2fa_code_expires'])


class Hospital(models.Model):
    name = models.CharField(max_length=255)
    registration_number = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)
    department = models.CharField(max_length=255, blank=True)  # optional branch/department

    def __str__(self):
        return self.name


class AdminProfile(models.Model):
    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="admin_profile")
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name="admins")
    position = models.CharField(max_length=255)
    staff_badge_number = models.CharField(max_length=100, blank=True)
    proof_of_authority = models.FileField(upload_to="proofs/", blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True)

    def __str__(self):
        return f"Admin {self.first_name} {self.last_name}"


class ProfessionalProfile(models.Model):
    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="professional_profile")
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    professional_role = models.CharField(max_length=50, choices=Roles.choices)
    specialization = models.CharField(max_length=255, blank=True)
    license_number = models.CharField(max_length=100)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name="professionals")
    department = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=30, blank=True)

    def __str__(self):
        return f"{self.professional_role} {self.first_name} {self.last_name}"


class Invitation(models.Model):
    class InviteType(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        PROFESSIONAL = "PROFESSIONAL", "Professional"

    code = models.CharField(max_length=128, unique=True, editable=False)
    invite_type = models.CharField(max_length=20, choices=InviteType.choices)
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=Roles.choices, blank=True)  # for professionals (DOCTOR/PHARMACIST/NURSE)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, null=True, blank=True)
    invited_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, related_name="sent_invitations")
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    accepted_user = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="accepted_invitation"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = token_urlsafe(32)
        if not self.expires_at:
            # use datetime.timedelta (imported above), not timezone.timedelta
            self.expires_at = timezone.now() + timedelta(hours=36)
        super().save(*args, **kwargs)

    @property
    def is_used(self):
        return self.used_at is not None

    @property
    def is_expired(self):
        # null-safe for admin "add" form before save
        if not self.expires_at:
            return False
        return timezone.now() > self.expires_at

    def mark_used(self, user):
        self.used_at = timezone.now()
        self.accepted_user = user
        self.save(update_fields=["used_at", "accepted_user"])

    def __str__(self):
        return f"{self.invite_type} → {self.email}"
class PasskeyCredential(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="passkeys")

    # Base64url strings for portability
    credential_id = models.CharField(max_length=512, unique=True)
    public_key = models.TextField()

    # optional metadata
    aaguid = models.CharField(max_length=64, blank=True)
    sign_count = models.PositiveBigIntegerField(default=0)
    transports = models.JSONField(default=list, blank=True)
    backup_eligible = models.BooleanField(default=False)
    backup_state = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    label = models.CharField(max_length=128, blank=True)  # user-visible label (optional)

    def __str__(self):
        return f"{self.user.email} – {self.credential_id[:12]}…"