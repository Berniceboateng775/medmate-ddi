# accounts/admin.py
from django import forms
from django.conf import settings
from django.contrib import admin
from django.utils.html import format_html
from .models import PasskeyCredential
admin.site.register(PasskeyCredential)
from .models import User, PasskeyCredential

from .models import (
    User,
    AdminProfile,
    ProfessionalProfile,
    Hospital,
    Invitation,
    Roles,
)

class PasskeyInline(admin.TabularInline):
    model = PasskeyCredential
    extra = 0
    readonly_fields = ("label", "aaguid", "sign_count", "backup_eligible", "backup_state", "transports", "created_at")
    can_delete = True

# ---------------- Hospital admin (needed for autocomplete_fields on Invitation) ----------------
@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ("name", "registration_number", "contact_email", "contact_phone", "department")
    search_fields = ("name", "registration_number", "contact_email", "contact_phone")


# ---------------- Invitation admin ----------------
class InvitationForm(forms.ModelForm):
    class Meta:
        model = Invitation
        fields = "__all__"

    def clean(self):
        cleaned = super().clean()
        invite_type = cleaned.get("invite_type")
        role = cleaned.get("role")
        hospital = cleaned.get("hospital")

        if not hospital:
            raise forms.ValidationError("Hospital is required for all invitations.")

        # PROFESSIONAL invites must pick a professional role
        if invite_type == Invitation.InviteType.PROFESSIONAL:
            if not role:
                raise forms.ValidationError("Select a professional role for PROFESSIONAL invites.")
            if role not in {Roles.DOCTOR, Roles.PHARMACIST, Roles.NURSE}:
                raise forms.ValidationError("Role must be DOCTOR, PHARMACIST, or NURSE for PROFESSIONAL invites.")

        # ADMIN invites must NOT set a role
        if invite_type == Invitation.InviteType.ADMIN and role:
            raise forms.ValidationError("Leave 'role' empty for ADMIN invites.")

        return cleaned


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    form = InvitationForm

    list_display = (
        "code_short", "invite_type", "email", "hospital", "role",
        "is_used_bool", "is_expired_bool", "expires_at",
        "invited_by", "created_at",
        "frontend_link", "accept_api",
    )
    list_filter = ("invite_type", "role", "hospital", "used_at")
    search_fields = ("email", "code")
    autocomplete_fields = ("hospital",)
    readonly_fields = (
        "code", "invited_by", "created_at", "used_at", "accepted_user", "expires_at",
        "is_used_bool", "is_expired_bool", "frontend_link", "accept_api",
    )

    def save_model(self, request, obj, form, change):
        # set inviter on create
        if not obj.pk and not obj.invited_by:
            obj.invited_by = request.user
        super().save_model(request, obj, form, change)
        # optional: send email (console backend in dev)
        try:
            from .emails import send_invitation_email
            if not obj.is_used and not obj.is_expired:
                send_invitation_email(obj.email, obj.code, obj.invite_type)
        except Exception as e:
            print(f"Failed to send invitation email: {e}")

    # ---- helpers / columns ----
    def code_short(self, obj):
        return (obj.code or "")[:8] + "…"
    code_short.short_description = "code"

    def is_used_bool(self, obj):
        return bool(obj.is_used)
    is_used_bool.boolean = True
    is_used_bool.short_description = "is_used"

    def is_expired_bool(self, obj):
        return bool(obj.is_expired)
    is_expired_bool.boolean = True
    is_expired_bool.short_description = "is_expired"

    def frontend_link(self, obj):
        base = getattr(settings, "FRONTEND_ORIGIN", "http://localhost:3000")
        url = f"{base}/invite/{obj.code}"
        return format_html('<a href="{}" target="_blank">{}</a>', url, url)
    frontend_link.short_description = "Frontend link"

    def accept_api(self, obj):
        url = f"http://localhost:8000/api/invitations/{obj.code}/accept/"
        return format_html('<code>{}</code>', url)
    accept_api.short_description = "Accept API"


# ---------------- Other admins ----------------
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "role", "is_active", "is_staff", "is_superuser")
    search_fields = ("email", "first_name", "last_name")
    list_filter = ("role", "is_active", "is_staff", "is_superuser")
    inlines = [PasskeyInline]

@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "first_name", "last_name", "hospital", "position", "staff_badge_number")
    search_fields = ("user__email", "first_name", "last_name", "staff_badge_number")
    list_filter = ("hospital",)

@admin.register(ProfessionalProfile)
class ProfessionalProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "professional_role", "first_name", "last_name", "hospital", "license_number")
    search_fields = ("user__email", "first_name", "last_name", "license_number")
    list_filter = ("professional_role", "hospital")




