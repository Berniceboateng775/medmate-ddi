# accounts/serializers.py
from rest_framework import serializers
from dj_rest_auth.serializers import LoginSerializer as BaseLoginSerializer
from .models import User, AdminProfile, ProfessionalProfile,Invitation, Hospital, Roles
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from .emails import send_invitation_email
from .models import PasskeyCredential

class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = "__all__"

class InviteAdminSerializer(serializers.Serializer):
    email = serializers.EmailField()
    hospital = HospitalSerializer()

    def create(self, validated):
        # Only superuser can do this; hospital is created (or reused)
        request = self.context["request"]
        assert request.user.is_superuser, "Only superuser can invite admins."
        hosp_data = validated["hospital"]
        hospital, _ = Hospital.objects.get_or_create(
            name=hosp_data["name"],
            defaults={
                "registration_number": hosp_data.get("registration_number",""),
                "address": hosp_data.get("address",""),
                "contact_email": hosp_data.get("contact_email",""),
                "contact_phone": hosp_data.get("contact_phone",""),
                "department": hosp_data.get("department",""),
            }
        )
        inv = Invitation.objects.create(
            invite_type=Invitation.InviteType.ADMIN,
            email=validated["email"],
            hospital=hospital,
            invited_by=request.user,
        )
        send_invitation_email(inv.email, inv.code, "ADMIN")
        return inv
    
    def to_representation(self, instance):
        return {
            "invite_type": instance.invite_type,
            "email": instance.email,
            "hospital": instance.hospital.name if instance.hospital else None,
            "code": instance.code,  # <-- for testing
            "expires_at": instance.expires_at,
        }
class InviteProfessionalSerializer(serializers.Serializer):
    email = serializers.EmailField()
    professional_role = serializers.ChoiceField(choices=[(Roles.DOCTOR, "DOCTOR"), (Roles.PHARMACIST, "PHARMACIST")])

    def create(self, validated):
        # Only admins; tie invite to admin's hospital
        request = self.context["request"]
        admin = getattr(request.user, "admin_profile", None)
        if not admin:
            raise serializers.ValidationError("Only hospital admins can invite professionals.")
        inv = Invitation.objects.create(
            invite_type=Invitation.InviteType.PROFESSIONAL,
            email=validated["email"],
            role=validated["professional_role"],
            hospital=admin.hospital,
            invited_by=request.user,
        )
        send_invitation_email(inv.email, inv.code, inv.role)
        return inv
    
    def to_representation(self, instance):
        return {
            "invite_type": instance.invite_type,
            "email": instance.email,
            "role": instance.role,
            "hospital": instance.hospital.name if instance.hospital else None,
            "code": instance.code,  # <-- for testing
            "expires_at": instance.expires_at,
        }
class AcceptInvitationSerializer(serializers.Serializer):
    # Common fields
    password = serializers.CharField(write_only=True, min_length=12)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)

    # Admin-only extra
    position = serializers.CharField(required=False, allow_blank=True)
    staff_badge_number = serializers.CharField(required=False, allow_blank=True)

    # Professional-only extra
    specialization = serializers.CharField(required=False, allow_blank=True)
    license_number = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        code = self.context["code"]
        try:
            inv = Invitation.objects.get(code=code)
        except Invitation.DoesNotExist:
            raise serializers.ValidationError("Invalid invitation code.")
        if inv.is_used:
            raise serializers.ValidationError("Invitation already used.")
        if inv.is_expired:
            raise serializers.ValidationError("Invitation expired.")
        self.invitation = inv
        # Validate password strength
        validate_password(attrs["password"])
        return attrs

    def create(self, validated):
        inv = self.invitation
        email = inv.email

        if inv.invite_type == Invitation.InviteType.ADMIN:
            user = User.objects.create_user(
                email=email,
                password=validated["password"],
                role=Roles.ADMIN,
                is_staff=True,  # allow admin site access
                phone=validated.get("phone",""),
            )
            AdminProfile.objects.create(
                user=user,
                hospital=inv.hospital,
                first_name=validated["first_name"],
                middle_name="",
                last_name=validated["last_name"],
                position=validated.get("position",""),
                staff_badge_number=validated.get("staff_badge_number",""),
                phone=validated.get("phone",""),
            )

        elif inv.invite_type == Invitation.InviteType.PROFESSIONAL:
            role = inv.role
            if role not in (Roles.DOCTOR, Roles.PHARMACIST):
                raise serializers.ValidationError("Invalid professional role in invitation.")
            user = User.objects.create_user(
                email=email,
                password=validated["password"],
                role=role,
                phone=validated.get("phone",""),
            )
            ProfessionalProfile.objects.create(
                user=user,
                first_name=validated["first_name"],
                middle_name="",
                last_name=validated["last_name"],
                professional_role=role,
                specialization=validated.get("specialization",""),
                license_number=validated.get("license_number",""),
                hospital=inv.hospital,
                department=validated.get("department",""),
                phone=validated.get("phone",""),
            )
        else:
            raise serializers.ValidationError("Unsupported invitation type.")

        inv.mark_used(user)
        return user    

class PasskeySerializer(serializers.ModelSerializer):
    class Meta:
        model = PasskeyCredential
        fields = [
            "id", "label", "aaguid", "sign_count", "backup_eligible",
            "backup_state", "transports", "created_at"
        ]

class AdminCreateSerializer(serializers.Serializer):
    # user
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=12)
    phone = serializers.CharField(required=False, allow_blank=True)
    # profile
    first_name = serializers.CharField()
    middle_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField()
    position = serializers.CharField()
    staff_badge_number = serializers.CharField(required=False, allow_blank=True)
    hospital = HospitalSerializer()

    def create(self, validated):
        hosp_data = validated.pop("hospital")
        hospital, _ = Hospital.objects.get_or_create(
            name=hosp_data["name"],
            defaults={
                "registration_number": hosp_data.get("registration_number",""),
                "address": hosp_data.get("address",""),
                "contact_email": hosp_data.get("contact_email",""),
                "contact_phone": hosp_data.get("contact_phone",""),
                "department": hosp_data.get("department",""),
            }
        )
        user = User.objects.create_user(
            email=validated["email"],
            password=validated["password"],
            role=Roles.ADMIN,
            phone=validated.get("phone",""),
            is_staff=True,  # allows admin site access if desired
        )
        profile = AdminProfile.objects.create(
            user=user,
            hospital=hospital,
            first_name=validated["first_name"],
            middle_name=validated.get("middle_name",""),
            last_name=validated["last_name"],
            position=validated["position"],
            staff_badge_number=validated.get("staff_badge_number",""),
        )
        return user

class ProfessionalCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=12)
    phone = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField()
    middle_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField()
    professional_role = serializers.ChoiceField(choices=[(r.value, r.label) for r in Roles if r != Roles.ADMIN and r != Roles.SUPERUSER])
    specialization = serializers.CharField(required=False, allow_blank=True)
    license_number = serializers.CharField()
    department = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated):
        admin_user = self.context["request"].user
        admin_profile = admin_user.admin_profile  # enforce admin-only
        user = User.objects.create_user(
            email=validated["email"],
            password=validated["password"],
            role=validated["professional_role"],
            phone=validated.get("phone",""),
        )
        ProfessionalProfile.objects.create(
            user=user,
            first_name=validated["first_name"],
            middle_name=validated.get("middle_name",""),
            last_name=validated["last_name"],
            professional_role=validated["professional_role"],
            specialization=validated.get("specialization",""),
            license_number=validated["license_number"],
            hospital=admin_profile.hospital,
            department=validated.get("department",""),
        )
        return user
class InvitationInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ("invite_type", "email", "role", "expires_at", "is_used", "is_expired", "hospital")
class EmailLoginSerializer(BaseLoginSerializer):
    username = None
    def get_fields(self):
        fields = super().get_fields()
        fields.pop("username", None)
        if "email" in fields:
            fields["email"].required = True
        return fields


class UserDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "role", "phone", "is_staff", "is_superuser")