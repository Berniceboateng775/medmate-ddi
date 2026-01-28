# accounts/views_auth.py
from __future__ import annotations

from django.contrib.auth import authenticate
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from accounts.security import (
    is_locked_out,
    record_failed_login,
    clear_login_failures,
)
import qrcode
import io
import base64


def client_ip(request) -> str:
    """Basic client IP extraction (fine for dev; harden if behind proxies)."""
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


class EmailPasswordLoginView(APIView):
    """
    Email + Password → JWT (access, refresh) + minimal user blob
    - AllowAny (no session / CSRF needed because we use JWT)
    - Scoped throttle 'login' (configure in settings REST_FRAMEWORK.DEFAULT_THROTTLE_RATES)
    - Simple cache-based lockout via accounts.security helpers
    """
    permission_classes = [permissions.AllowAny]
    throttle_scope = "login"
    throttle_classes = [ScopedRateThrottle]

    def post(self, request):
        print(f"Raw request.data: {request.data}")
        print(f"Request.data type: {type(request.data)}")

        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        ip = client_ip(request)

        print(f"Login attempt - Email: '{email}', Password provided: {bool(password)}")
        print(f"Processed email: '{email}', password length: {len(password) if password else 0}")

        if not email or not password:
            print(f"Validation failed - email: '{email}', password: '{password}'")
            return Response({"detail": "email and password required"}, status=400)

        # lockout check
        if is_locked_out(email, ip):
            return Response({"detail": "Too many failed attempts. Try again later."}, status=429)

        # authenticate against custom User (USERNAME_FIELD = 'email')
        user = authenticate(request=request, email=email, password=password)
        if not user:
            record_failed_login(email, ip)
            return Response({"detail": "Invalid credentials"}, status=400)

        if not user.is_active:
            return Response({"detail": "User inactive"}, status=403)

        # Check if 2FA is enabled
        if user.email_2fa_enabled:
            totp_code = request.data.get("totp_code")
            if not totp_code:
                # Send 2FA code to email
                user.generate_email_2fa_code()
                return Response({"requires_2fa": True, "user_id": user.id}, status=200)
            if not user.verify_email_2fa_code(totp_code):
                record_failed_login(email, ip)
                return Response({"detail": "Invalid 2FA code"}, status=400)

        # success → clear failures + mint tokens
        clear_login_failures(email, ip)
        refresh = RefreshToken.for_user(user)

        # Get hospital name from user profile
        hospital_name = None
        if hasattr(user, 'admin_profile') and user.admin_profile:
            hospital_name = user.admin_profile.hospital.name
        elif hasattr(user, 'professional_profile') and user.professional_profile:
            hospital_name = user.professional_profile.hospital.name

        user_data = {
            "id": user.id,
            "email": user.email,
            "role": getattr(user, "role", None),
            "first_name": getattr(user, "first_name", "") or "",
            "last_name": getattr(user, "last_name", "") or "",
            "hospital": hospital_name,
        }

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": user_data,
            },
            status=status.HTTP_200_OK,
        )


class TwoFactorSetupView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        action = request.data.get('action', 'enable')

        if action == 'enable':
            if user.email_2fa_enabled:
                return Response({"detail": "2FA already enabled"}, status=400)
            # Enable 2FA directly without verification since user is authenticated
            user.enable_email_2fa()
            return Response({"detail": "2FA enabled"})
        elif action == 'disable':
            if not user.email_2fa_enabled:
                return Response({"detail": "2FA not enabled"}, status=400)
            code = request.data.get("code")
            if not code:
                return Response({"detail": "Code required"}, status=400)
            if user.verify_email_2fa_code(code):
                user.disable_email_2fa()
                return Response({"detail": "2FA disabled"})
            else:
                return Response({"detail": "Invalid code"}, status=400)
        else:
            return Response({"detail": "Invalid action"}, status=400)


class TwoFactorDisableView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        code = request.data.get("code")
        if not code:
            return Response({"detail": "Code required"}, status=400)

        if user.verify_email_2fa_code(code):
            user.disable_email_2fa()
            return Response({"detail": "2FA disabled"})
        else:
            return Response({"detail": "Invalid code"}, status=400)
