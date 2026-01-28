# accounts/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .serializers import (
    InviteAdminSerializer, InviteProfessionalSerializer,
    InvitationInfoSerializer, AcceptInvitationSerializer,
)
from .models import Invitation, User, AdminProfile, ProfessionalProfile
from .permissions import IsSuperuser, IsAdmin
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import AdminCreateSerializer, ProfessionalCreateSerializer
from .permissions import IsSuperuser, IsAdmin
from django.contrib.auth import update_session_auth_hash
from django.db import models

class SuperuserCreateAdminView(generics.CreateAPIView):
    serializer_class = AdminCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperuser]

class AdminCreateProfessionalView(generics.CreateAPIView):
    serializer_class = ProfessionalCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

class SuperuserInviteAdminView(generics.CreateAPIView):
    serializer_class = InviteAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperuser]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

class AdminInviteProfessionalView(generics.CreateAPIView):
    serializer_class = InviteProfessionalSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

class InvitationInfoView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    lookup_field = "code"
    queryset = Invitation.objects.all()

    def retrieve(self, request, *args, **kwargs):
        inv = self.get_object()
        data = InvitationInfoSerializer(inv).data
        return Response(data)

class InvitationAcceptView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, code):
        serializer = AcceptInvitationSerializer(data=request.data, context={"code": code})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Auto-login: return JWTs
        refresh = RefreshToken.for_user(user)
        return Response(
            {"access": str(refresh.access_token), "refresh": str(refresh)},
            status=status.HTTP_201_CREATED
        )


class AdminUserManagementView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        """List users that the admin can manage (their hospital only)"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            hospital = admin_profile.hospital
        except AdminProfile.DoesNotExist:
            return Response({'error': 'Admin profile not found'}, status=403)

        # Get all users associated with this hospital
        hospital_filter = (
            models.Q(admin_profile__hospital=hospital) |
            models.Q(professional_profile__hospital=hospital)
        )
        hospital_users = User.objects.filter(hospital_filter).distinct().select_related('admin_profile', 'professional_profile')

        users_data = []
        for user in hospital_users:
            # Don't allow managing superusers or other admins
            if user.is_superuser or (hasattr(user, 'admin_profile') and user.admin_profile):
                continue

            users_data.append({
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'date_joined': user.date_joined.isoformat(),
                'full_name': self._get_user_full_name(user),
            })

        return Response({'users': users_data})

    def _get_user_full_name(self, user):
        """Get the full name from the appropriate profile"""
        if hasattr(user, 'professional_profile') and user.professional_profile:
            profile = user.professional_profile
            return f"{profile.first_name} {profile.last_name}".strip()
        return user.email


class AdminUserActionView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, user_id, action):
        """Perform actions on users: deactivate, activate, reset_password"""
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            hospital = admin_profile.hospital
        except AdminProfile.DoesNotExist:
            return Response({'error': 'Admin profile not found'}, status=403)

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        # Verify the target user belongs to the admin's hospital
        hospital_user_filter = (
            models.Q(id=user_id) &
            (models.Q(admin_profile__hospital=hospital) |
             models.Q(professional_profile__hospital=hospital))
        )
        is_hospital_user = User.objects.filter(hospital_user_filter).exists()

        if not is_hospital_user:
            return Response({'error': 'User not found in your hospital'}, status=404)

        # Don't allow managing superusers or other admins
        if target_user.is_superuser or (hasattr(target_user, 'admin_profile') and target_user.admin_profile):
            return Response({'error': 'Cannot manage admin or superuser accounts'}, status=403)

        if action == 'deactivate':
            target_user.is_active = False
            target_user.save()
            return Response({'message': 'User deactivated successfully'})

        elif action == 'activate':
            target_user.is_active = True
            target_user.save()
            return Response({'message': 'User activated successfully'})

        elif action == 'reset_password':
            # Generate a temporary password and set it
            temp_password = User.objects.make_random_password()
            target_user.set_password(temp_password)
            target_user.save()

            # In a real app, you'd send this via email
            # For now, return it in the response (not recommended for production)
            return Response({
                'message': 'Password reset successfully',
                'temp_password': temp_password  # Remove this in production
            })

        else:
            return Response({'error': 'Invalid action'}, status=400)


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Return user profile with professional/admin profile information"""
        user = request.user

        # Base user data
        profile_data = {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active,
            'date_joined': user.date_joined.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'email_2fa_enabled': user.email_2fa_enabled,
        }

        # Add professional profile data if exists
        if hasattr(user, 'professional_profile') and user.professional_profile:
            profile = user.professional_profile
            profile_data.update({
                'name': f"{profile.first_name} {profile.last_name}".strip(),
                'first_name': profile.first_name,
                'middle_name': profile.middle_name,
                'last_name': profile.last_name,
                'specialization': profile.specialization,
                'license_number': profile.license_number,
                'hospital': profile.hospital.name,
                'department': profile.department,
                'phone': profile.phone,
            })

        # Add admin profile data if exists
        elif hasattr(user, 'admin_profile') and user.admin_profile:
            profile = user.admin_profile
            profile_data.update({
                'name': f"{profile.first_name} {profile.last_name}".strip(),
                'first_name': profile.first_name,
                'middle_name': profile.middle_name,
                'last_name': profile.last_name,
                'position': profile.position,
                'staff_badge_number': profile.staff_badge_number,
                'hospital': profile.hospital.name,
                'phone': profile.phone,
            })

        return Response(profile_data)