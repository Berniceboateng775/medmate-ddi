# accounts/passkeys.py
from __future__ import annotations
import json

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from django.conf import settings
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import PasskeyCredential, User
from .serializers import PasskeySerializer
from .challenges import new_challenge_id, put_challenge, pop_challenge

# Duo Labs webauthn (v2 preferred; we fall back to v1 signatures when needed)
from webauthn.helpers.structs import (
    PublicKeyCredentialRpEntity,
    PublicKeyCredentialUserEntity,
    PublicKeyCredentialDescriptor,
    AuthenticatorSelectionCriteria,
    ResidentKeyRequirement,
    UserVerificationRequirement,
    AttestationConveyancePreference,
    RegistrationCredential,
    AuthenticationCredential,
)
from webauthn import (
    generate_registration_options,
    generate_authentication_options,
    verify_registration_response,
    verify_authentication_response,
)

# ---------------------------
# helpers
# ---------------------------

def b64u(data: bytes) -> str:
    import base64
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def b64u_to_bytes(s: str) -> bytes:
    import base64
    pad = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)

def _enum_val(x):
    return getattr(x, "value", x)

def credentials_to_descriptors(creds: list[PasskeyCredential]) -> list[PublicKeyCredentialDescriptor]:
    """Convert stored credentials to descriptors for allow/exclude lists."""
    out = []
    for c in creds:
        try:
            raw_id = b64u_to_bytes(c.credential_id)
        except Exception:
            continue
        out.append(
            PublicKeyCredentialDescriptor(
                id=raw_id,
                type="public-key",
                transports=c.transports or None,
            )
        )
    return out

# ---- option serializers (turn dataclasses into browser-ready dicts)

def serialize_reg_options(options) -> dict:
    """
    Convert PublicKeyCredentialCreationOptions -> dict shaped like:
    { publicKey: { rp, user, challenge, pubKeyCredParams, ... } }
    with base64url strings for binary fields.
    """
    rp = {"id": getattr(options.rp, "id", None), "name": getattr(options.rp, "name", None)}

    user_id = getattr(options.user, "id", None)
    user = {
        "id": b64u(user_id if isinstance(user_id, (bytes, bytearray)) else str(user_id).encode()),
        "name": getattr(options.user, "name", None),
        "displayName": getattr(options.user, "display_name", None),
    }

    challenge_raw = getattr(options, "challenge", None)
    if isinstance(challenge_raw, (bytes, bytearray)):
        challenge = b64u(challenge_raw)
    else:
        # make bytes just in case some version provides str
        challenge = b64u(str(challenge_raw).encode())

    pk_params = [{"type": p.type, "alg": p.alg} for p in getattr(options, "pub_key_cred_params", [])]

    exclude = []
    for d in getattr(options, "exclude_credentials", []) or []:
        did = getattr(d, "id", None)
        if isinstance(did, (bytes, bytearray)):
            did_b64u = b64u(did)
        else:
            did_b64u = b64u(str(did).encode()) if did is not None else None
        exclude.append({
            "type": d.type,
            "id": did_b64u,
            "transports": d.transports or None,
        })

    sel = getattr(options, "authenticator_selection", None)
    if sel:
        authenticator_selection = {
            "residentKey": _enum_val(getattr(sel, "resident_key", None)),
            "userVerification": _enum_val(getattr(sel, "user_verification", None)),
            "requireResidentKey": bool(getattr(sel, "require_resident_key", False)),
        }
    else:
        authenticator_selection = None

    public_key = {
        "rp": rp,
        "user": user,
        "challenge": challenge,
        "pubKeyCredParams": pk_params,
        "timeout": getattr(options, "timeout", None),
        "attestation": _enum_val(getattr(options, "attestation", "none")),
        "excludeCredentials": exclude or None,
        "authenticatorSelection": authenticator_selection,
    }
    return {"publicKey": {k: v for k, v in public_key.items() if v is not None}}

def serialize_authn_options(options) -> dict:
    """
    Convert PublicKeyCredentialRequestOptions -> dict shaped like:
    { publicKey: { challenge, rpId, allowCredentials, ... } }
    with base64url strings for binary fields.
    """
    chal = getattr(options, "challenge", None)
    if isinstance(chal, (bytes, bytearray)):
        challenge = b64u(chal)
    else:
        challenge = b64u(str(chal).encode())

    allow = []
    for d in getattr(options, "allow_credentials", []) or []:
        did = getattr(d, "id", None)
        if isinstance(did, (bytes, bytearray)):
            did_b64u = b64u(did)
        else:
            did_b64u = b64u(str(did).encode()) if did is not None else None
        allow.append({
            "type": d.type,
            "id": did_b64u,
            "transports": d.transports or None,
        })

    public_key = {
        "challenge": challenge,
        "timeout": getattr(options, "timeout", None),
        "rpId": getattr(options, "rp_id", None),
        "allowCredentials": allow or None,
        "userVerification": _enum_val(getattr(options, "user_verification", "preferred")),
    }
    return {"publicKey": {k: v for k, v in public_key.items() if v is not None}}

# ---------------------------
# Views
# ---------------------------

class BeginRegisterPasskey(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user: User = request.user

        rp_entity = PublicKeyCredentialRpEntity(id=settings.RP_ID, name=settings.RP_NAME)
        user_entity = PublicKeyCredentialUserEntity(
            id=str(user.pk).encode(),
            name=user.email,
            display_name=user.email,
        )

        exclude = credentials_to_descriptors(list(user.passkeys.all()))
        selection = AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.PREFERRED,
            user_verification=UserVerificationRequirement.PREFERRED,
            require_resident_key=False,
        )

        # v2 → v1 fallback
        try:
            options = generate_registration_options(
                rp=rp_entity,
                user=user_entity,
                authenticator_selection=selection,
                attestation=AttestationConveyancePreference.NONE,
                exclude_credentials=exclude,
            )
        except TypeError:
            options = generate_registration_options(
                rp_id=settings.RP_ID,
                rp_name=settings.RP_NAME,
                user_id=user_entity.id,            # bytes
                user_name=user.email,
                user_display_name=user.email,
                authenticator_selection=selection,
                attestation=AttestationConveyancePreference.NONE,
                exclude_credentials=exclude,
            )

        # Serialize options for browser
        options_payload = serialize_reg_options(options)

        # Store challenge as base64url (always)
        challenge_raw = getattr(options, "challenge", None)
        if isinstance(challenge_raw, (bytes, bytearray)):
            stored_challenge = b64u(challenge_raw)
        else:
            stored_challenge = b64u(str(challenge_raw).encode())

        challenge_id = new_challenge_id()
        put_challenge(challenge_id, {
            "type": "registration",
            "challenge": stored_challenge,
            "user_id": user.pk,
            "created_at": timezone.now().isoformat(),
        })

        return Response({
            "options": options_payload,   # { publicKey: { ... } }
            "challenge_id": challenge_id,
            "rpId": settings.RP_ID,
            "origin": settings.WEBAUTHN_ORIGIN,
        })

class FinishRegisterPasskey(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        challenge_id = request.data.get("challenge_id")
        raw_cred = request.data.get("credential")  # may be JSON string or dict
        label = (request.data.get("label") or "").strip()

        if not challenge_id or not raw_cred:
            return Response({"detail": "Missing challenge_id or credential"}, status=400)

        ticket = pop_challenge(challenge_id)
        if not ticket or ticket.get("type") != "registration":
            return Response({"detail": "Invalid or expired challenge"}, status=400)

        expected_challenge_b64u = ticket["challenge"]
        try:
            expected_challenge_bytes = b64u_to_bytes(expected_challenge_b64u)
        except Exception:
            expected_challenge_bytes = str(expected_challenge_b64u).encode()

        user: User = request.user

        # Robustly build a RegistrationCredential instance
        data = json.loads(raw_cred) if isinstance(raw_cred, str) else raw_cred
        reg_cred = None

        # pydantic v2
        if hasattr(RegistrationCredential, "model_validate"):
            try:
                reg_cred = (RegistrationCredential.model_validate_json(raw_cred)
                            if isinstance(raw_cred, str)
                            else RegistrationCredential.model_validate(data))
            except Exception:
                reg_cred = None

        # pydantic v1
        if reg_cred is None and hasattr(RegistrationCredential, "parse_obj"):
            try:
                reg_cred = (RegistrationCredential.parse_raw(raw_cred)
                            if isinstance(raw_cred, str)
                            else RegistrationCredential.parse_obj(data))
            except Exception:
                reg_cred = None

        # dataclass ctor
        if reg_cred is None:
            try:
                reg_cred = RegistrationCredential(**data)
            except Exception:
                reg_cred = data  # last resort

        try:
            verified = verify_registration_response(
                credential=reg_cred,
                expected_challenge=expected_challenge_bytes,  # ← bytes, not str
                expected_rp_id=settings.RP_ID,
                expected_origin=settings.WEBAUTHN_ORIGIN,
                require_user_verification=False,
            )
        except Exception as e:
            return Response({"detail": f"Registration verification failed: {e}"}, status=400)

        cred = PasskeyCredential.objects.create(
            user=user,
            credential_id=b64u(verified.credential_id),
            public_key=b64u(verified.credential_public_key),
            aaguid=str(getattr(verified, "aaguid", "") or ""),
            sign_count=getattr(verified, "sign_count", 0) or 0,
            backup_eligible=bool(getattr(verified, "backup_eligible", False)),
            backup_state=bool(getattr(verified, "backup_state", False)),
            transports=[],
            label=label[:128] if label else "",
        )

        return Response({"ok": True, "credential_id": cred.credential_id, "label": cred.label})

class BeginLoginPasskey(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """If 'email' is provided, do username-first. Otherwise allow usernameless."""
        email = (request.data.get("email") or "").strip().lower()
        rp_id = getattr(settings, "RP_ID", "localhost")

        allow = None
        hinted_user_id = None

        if email:
            try:
                user = User.objects.get(email=email)
                allow = credentials_to_descriptors(list(user.passkeys.all())) or None
                hinted_user_id = user.pk
            except User.DoesNotExist:
                allow = None  # indistinguishable

        options = generate_authentication_options(
            rp_id=rp_id,
            allow_credentials=allow,
            user_verification=UserVerificationRequirement.PREFERRED,
        )

        # Store challenge as base64url
        chal = getattr(options, "challenge", None)
        if isinstance(chal, (bytes, bytearray)):
            stored_challenge = b64u(chal)
        else:
            stored_challenge = b64u(str(chal).encode())

        challenge_id = new_challenge_id()
        put_challenge(challenge_id, {
            "type": "authentication",
            "challenge": stored_challenge,
            "user_id": hinted_user_id,  # may be None
            "created_at": timezone.now().isoformat(),
        })

        return Response({
            "options": serialize_authn_options(options),
            "challenge_id": challenge_id,
            "rpId": rp_id,
            "origin": getattr(settings, "WEBAUTHN_ORIGIN", "http://localhost:5173"),
        })

class FinishLoginPasskey(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken
        from accounts.serializers import UserDetailsSerializer

        challenge_id = request.data.get("challenge_id")
        raw_cred = request.data.get("credential")

        if not challenge_id or not raw_cred:
            return Response({"detail": "Missing challenge_id or credential"}, status=400)

        ticket = pop_challenge(challenge_id)
        if not ticket or ticket.get("type") != "authentication":
            return Response({"detail": "Invalid or expired challenge"}, status=400)

        expected_challenge_b64u = ticket["challenge"]
        try:
            expected_challenge_bytes = b64u_to_bytes(expected_challenge_b64u)
        except Exception:
            expected_challenge_bytes = str(expected_challenge_b64u).encode()

        hinted_user_id = ticket.get("user_id")

        data = json.loads(raw_cred) if isinstance(raw_cred, str) else raw_cred
        auth_cred = None

        # pydantic v2
        if hasattr(AuthenticationCredential, "model_validate"):
            try:
                auth_cred = (AuthenticationCredential.model_validate_json(raw_cred)
                             if isinstance(raw_cred, str)
                             else AuthenticationCredential.model_validate(data))
            except Exception:
                auth_cred = None

        # pydantic v1
        if auth_cred is None and hasattr(AuthenticationCredential, "parse_obj"):
            try:
                auth_cred = (AuthenticationCredential.parse_raw(raw_cred)
                             if isinstance(raw_cred, str)
                             else AuthenticationCredential.parse_obj(data))
            except Exception:
                auth_cred = None

        # dataclass ctor
        if auth_cred is None:
            try:
                auth_cred = AuthenticationCredential(**data)
            except Exception:
                auth_cred = data

        # Determine credential id (base64url)
        try:
            raw_id = getattr(auth_cred, "raw_id", None)
            cred_id_b64u = b64u(raw_id) if isinstance(raw_id, (bytes, bytearray)) else data.get("rawId")
        except Exception:
            cred_id_b64u = data.get("rawId")

        try:
            stored = PasskeyCredential.objects.select_related("user").get(credential_id=cred_id_b64u)
        except PasskeyCredential.DoesNotExist:
            return Response({"detail": "Unknown credential"}, status=400)

        if hinted_user_id and stored.user_id != hinted_user_id:
            return Response({"detail": "Credential does not belong to requested user"}, status=400)

        try:
            verified = verify_authentication_response(
                credential=auth_cred,
                expected_challenge=expected_challenge_bytes,  # ← bytes, not str
                expected_rp_id=getattr(settings, "RP_ID", "localhost"),
                expected_origin=getattr(settings, "WEBAUTHN_ORIGIN", "http://localhost:5173"),
                credential_public_key=b64u_to_bytes(stored.public_key),
                credential_current_sign_count=stored.sign_count,
                require_user_verification=False,
            )
        except Exception as e:
            return Response({"detail": f"Authentication verification failed: {e}"}, status=400)

        if getattr(verified, "new_sign_count", None) is not None:
            stored.sign_count = max(stored.sign_count, verified.new_sign_count)
            stored.save(update_fields=["sign_count"])

        user = stored.user
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        return Response({
            "access": str(access),
            "refresh": str(refresh),
            "user": UserDetailsSerializer(user).data,
        })

class MyPasskeysView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = PasskeyCredential.objects.filter(user=request.user).order_by("-created_at")
        return Response(PasskeySerializer(qs, many=True).data)

class RenamePasskeyView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        cred = get_object_or_404(PasskeyCredential, pk=pk, user=request.user)
        label = (request.data.get("label") or "").strip()
        if not label:
            return Response({"detail": "label required"}, status=400)
        cred.label = label[:128]
        cred.save(update_fields=["label"])
        return Response(PasskeySerializer(cred).data)

class DeletePasskeyView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        cred = get_object_or_404(PasskeyCredential, pk=pk, user=request.user)
        cred.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
