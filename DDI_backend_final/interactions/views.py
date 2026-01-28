# interactions/views.py
import os
import io
import time
import logging
import contextlib
from typing import Dict, Tuple, Any, Optional

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from django.db import models
from datetime import timedelta

from gradio_client import Client

from .serializers import PairCheckSerializer
from .models import DDICheck, ErrorLog

logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# HF Space config (override via environment variables)
# -----------------------------------------------------------------------------
# Bernice
BERNICE_URL       = os.getenv("BERNICE_URL", "https://bernice775-transformer-model-ddi.hf.space")
BERNICE_API_NAME  = "/run_interaction_check"    # param: drug_input
BERNICE_TIMEOUT_S = int(os.getenv("BERNICE_TIMEOUT_S", "120"))
BERNICE_RETRIES   = int(os.getenv("BERNICE_RETRIES", "2"))

# Freda — SIX 'a's
FREDA_URL         = os.getenv("FREDA_URL", "https://fredaaaaaa-severity.hf.space")
FREDA_REPO_ID     = os.getenv("FREDA_REPO_ID", "Fredaaaaaa/severity")
FREDA_API_NAME    = "/lambda"                   # param: x
FREDA_TIMEOUT_S   = int(os.getenv("FREDA_TIMEOUT_S", "150"))
FREDA_RETRIES     = int(os.getenv("FREDA_RETRIES", "3"))

# If Spaces are private/gated, set a read token:
HF_TOKEN          = os.getenv("HF_TOKEN")  # hf_****************
DEBUG_LOG_SPACES  = os.getenv("DEBUG_LOG_SPACES", "0") == "1"  # log endpoints

# -----------------------------------------------------------------------------
# Utilities
# -----------------------------------------------------------------------------
def _normalize(drug: str) -> str:
    return " ".join(drug.strip().lower().split())

def _quiet_call(fn, *args, **kwargs):
    """Suppress stdout/stderr (avoids Windows '✔' charmap crashes)."""
    buf_out, buf_err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(buf_out), contextlib.redirect_stderr(buf_err):
        return fn(*args, **kwargs)

def _client(target: str) -> Client:
    logger.info("Initializing HF client for %s", target)
    c: Client = _quiet_call(Client, target, hf_token=HF_TOKEN)
    # Warm up Space and list endpoints; this also wakes cold starts
    if DEBUG_LOG_SPACES:
        try:
            api = _quiet_call(c.view_api)
            endpoints = [a["api_name"] for a in api.get("named_endpoints", [])]
            logger.info("Space ready at %s; endpoints: %s", target, endpoints)
        except Exception as e:
            logger.warning("view_api() failed for %s: %s", target, e)
    else:
        # even if DEBUG off, do a silent warm-up once
        try:
            _quiet_call(c.view_api)
        except Exception:
            pass
    return c

def _repo_to_url(repo_id: str) -> Optional[str]:
    if "/" not in repo_id:
        return None
    owner, name = repo_id.split("/", 1)
    sub = f"{owner.strip().lower()}-{name.strip().lower()}".replace("_", "-")
    return f"https://{sub}.hf.space"

# -----------------------------------------------------------------------------
# Robust queued calls with retries/backoff
# -----------------------------------------------------------------------------
def _call_space_with_queue(client: Client, api_name: str, timeout_s: int, **kwargs):
    """
    Uses the queue API (submit) and waits for result with a timeout.
    """
    job = _quiet_call(client.submit, api_name=api_name, **kwargs)
    # Wait for completion with timeout
    return job.result(timeout=timeout_s)

def _freda_predict_pair(drug1: str, drug2: str) -> str:
    """
    Calls Freda (severity) with retries/backoff. Tries URL -> repo_id -> derived URL.
    Uses queue submit to tolerate cold starts and long inferences.
    """
    attempts_targets = []
    if FREDA_URL:
        attempts_targets.append(("URL", FREDA_URL))
    if FREDA_REPO_ID:
        attempts_targets.append(("REPO_ID", FREDA_REPO_ID))
        derived = _repo_to_url(FREDA_REPO_ID)
        if derived and (not FREDA_URL or derived != FREDA_URL):
            attempts_targets.append(("DERIVED_URL", derived))

    last_err: Optional[Exception] = None
    backoff = 2.0
    for kind, target in attempts_targets:
        for attempt in range(1, FREDA_RETRIES + 1):
            try:
                logger.info("FREDA attempt %d/%d (%s): %s", attempt, FREDA_RETRIES, kind, target)
                client = _client(target)
                return _call_space_with_queue(
                    client,
                    api_name=FREDA_API_NAME,
                    timeout_s=FREDA_TIMEOUT_S,
                    x=f"{drug1},{drug2}",
                )
            except Exception as e:
                last_err = e
                logger.warning("FREDA call failed (attempt %d, %s): %s", attempt, kind, e)
                if attempt < FREDA_RETRIES:
                    time.sleep(backoff)
                    backoff *= 1.6
        # next target kind

    # All attempts failed
    raise last_err if last_err else RuntimeError("Freda client creation failed")

def _bernice_generate_for_pair(drug1: str, drug2: str) -> Dict[str, str]:
    last_err: Optional[Exception] = None
    backoff = 1.6
    for attempt in range(1, BERNICE_RETRIES + 1):
        try:
            client = _client(BERNICE_URL)
            out: Tuple[str, str, str] = _call_space_with_queue(
                client,
                api_name=BERNICE_API_NAME,
                timeout_s=BERNICE_TIMEOUT_S,
                drug_input=f"{drug1},{drug2}",
            )
            interaction, explanation, recommendations = out
            return {
                "interaction": interaction or "",
                "explanation": explanation or "",
                "recommendations": recommendations or "",
            }
        except Exception as e:
            last_err = e
            logger.warning("Bernice call failed (attempt %d): %s", attempt, e)
            if attempt < BERNICE_RETRIES:
                time.sleep(backoff)
                backoff *= 1.6
    raise last_err if last_err else RuntimeError("Bernice call failed")

# -----------------------------------------------------------------------------
# Views
# -----------------------------------------------------------------------------
class DDICheckView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Accepts either:
          { "drug1": "...", "drug2": "..." }
        or:
          { "selected_pair": "drug A, drug B" }
        """
        payload = request.data.copy()
        if "selected_pair" in payload and ("drug1" not in payload or "drug2" not in payload):
            parts = [p.strip() for p in str(payload["selected_pair"]).split(",") if p.strip()]
            if len(parts) >= 2:
                payload["drug1"], payload["drug2"] = parts[0], parts[1]

        s = PairCheckSerializer(data=payload)
        s.is_valid(raise_exception=True)
        d1 = _normalize(s.validated_data["drug1"])
        d2 = _normalize(s.validated_data["drug2"])

        user = request.user if request.user.is_authenticated else None

        # --- Freda: severity ---
        try:
            severity = _freda_predict_pair(d1, d2)
            check_status = 'success'
            error_msg = ''
        except Exception as e:
            msg = str(e)
            if any(x in msg for x in ["401", "Repository Not Found", "Invalid username or password"]):
                msg = (
                    "Freda auth/endpoint issue. Verify FREDA_REPO_ID is 'Fredaaaaaa/severity' "
                    "or set FREDA_URL to 'https://fredaaaaaa-severity.hf.space', "
                    "and provide HF_TOKEN if the Space is private."
                )
            elif "timed out" in msg.lower():
                msg = (
                    f"Freda timed out after {FREDA_TIMEOUT_S}s. The Space may be cold or busy. "
                    f"Increase FREDA_TIMEOUT_S or FREDA_RETRIES, or try again."
                )
            severity = f"Error from Freda model: {msg}"
            check_status = 'error'
            error_msg = msg
            try:
                ErrorLog.objects.create(source="Freda", message=msg)
            except Exception:
                pass

        # --- Bernice: details ---
        description = extended = recommendation = ""
        try:
            details: Dict[str, Any] = _bernice_generate_for_pair(d1, d2)
            description = details.get("interaction", "") or ""
            extended = details.get("explanation", "") or ""
            recommendation = details.get("recommendations", "") or ""
        except Exception as e:
            description = ""
            extended = f"Error from Bernice model: {e}"
            recommendation = ""
            if check_status == 'success':
                check_status = 'error'
                error_msg = f"Bernice error: {e}"
            try:
                ErrorLog.objects.create(source="Bernice", message=str(e))
            except Exception:
                pass

        # Persist the check
        try:
            DDICheck.objects.create(
                user=user,
                drug1=d1,
                drug2=d2,
                severity=str(severity),
                description=description,
                extended_explanation=extended,
                recommendation=recommendation,
                status=check_status,
                error_message=error_msg,
            )
        except Exception as e:
            logger.warning("Failed to log DDICheck: %s", e)

        return Response(
            {
                "drug1": d1,
                "drug2": d2,
                "severity": severity,
                "description": description,
                "extended_explanation": extended,
                "recommendation": recommendation,
            }
        )

class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from accounts.models import User, AdminProfile, ProfessionalProfile

        # Get admin's hospital
        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            hospital = admin_profile.hospital
        except AdminProfile.DoesNotExist:
            return Response({'error': 'Admin profile not found'}, status=403)

        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)

        # Filter users by hospital - only users associated with this hospital
        hospital_users = User.objects.filter(
            models.Q(admin_profile__hospital=hospital) |
            models.Q(professional_profile__hospital=hospital)
        ).distinct()

        total_users = hospital_users.count()
        new_signups_7d = hospital_users.filter(date_joined__gte=last_7d).count()

        # Filter DDI checks by users from this hospital
        hospital_user_ids = list(hospital_users.values_list('id', flat=True))
        user_filter = models.Q(user__in=hospital_user_ids) | models.Q(user__isnull=True)

        ddi_checks_24h = DDICheck.objects.filter(
            created_at__gte=last_24h
        ).filter(user_filter).count()

        total_checks_24h = ddi_checks_24h
        error_checks_24h = DDICheck.objects.filter(
            created_at__gte=last_24h,
            status='error'
        ).filter(user_filter).count()
        error_rate_24h = (error_checks_24h / total_checks_24h * 100) if total_checks_24h > 0 else 0

        ddi_checks_7d = []
        for i in range(7):
            day = last_7d + timedelta(days=i)
            next_day = day + timedelta(days=1)
            ddi_checks_7d.append(
                DDICheck.objects.filter(
                    created_at__gte=day,
                    created_at__lt=next_day
                ).filter(user_filter).count()
            )

        recent_users = hospital_users.select_related('admin_profile', 'professional_profile').order_by('-date_joined')[:10]
        users_data = [{
            'id': u.id,
            'email': u.email,
            'role': u.role,
            'is_active': u.is_active,
            'last_login': u.last_login.isoformat() if u.last_login else None,
            'date_joined': u.date_joined.isoformat(),
        } for u in recent_users]

        recent_ddi_checks = DDICheck.objects.select_related('user').filter(
            user_filter
        ).order_by('-created_at')[:20]
        ddi_checks_data = [{
            'id': c.id,
            'time': c.created_at.isoformat(),
            'requester': c.user.email if c.user else 'Anonymous',
            'drugs': f"{c.drug1} + {c.drug2}",
            'severity': c.severity,
            'status': c.status,
        } for c in recent_ddi_checks]

        return Response({
            'metrics': {
                'users': total_users,
                'new_signups_7d': new_signups_7d,
                'ddi_checks_24h': ddi_checks_24h,
                'error_rate_24h': round(error_rate_24h, 1),
            },
            'ddi_checks_7d': ddi_checks_7d,
            'recent_users': users_data,
            'recent_ddi_checks': ddi_checks_data,
        })
