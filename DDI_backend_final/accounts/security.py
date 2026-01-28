# accounts/security.py
from __future__ import annotations
from django.core.cache import cache
from django.conf import settings
from datetime import timedelta

ATTEMPTS = int(getattr(settings, "LOGIN_MAX_ATTEMPTS", 5))
WINDOW_S = int(getattr(settings, "LOGIN_ATTEMPT_WINDOW_SECONDS", 300))  # 5 min
COOLDOWN_S = int(getattr(settings, "LOGIN_COOLDOWN_SECONDS", 900))      # 15 min

def _norm(email: str) -> str:
    return (email or "").strip().lower()

def _keys(email: str, ip: str) -> tuple[str, str]:
    e = _norm(email)
    i = (ip or "").strip()
    return (f"loginfail:{e}:{i}", f"loginlock:{e}:{i}")

def is_locked_out(email: str, ip: str) -> bool:
    _, lock_key = _keys(email, ip)
    return bool(cache.get(lock_key))

def record_failed_login(email: str, ip: str) -> int:
    fail_key, lock_key = _keys(email, ip)
    count = cache.get(fail_key, 0) + 1
    if count == 1:
        cache.set(fail_key, count, timeout=WINDOW_S)
    else:
        cache.incr(fail_key)

    if count >= ATTEMPTS:
        cache.set(lock_key, True, timeout=COOLDOWN_S)
        cache.delete(fail_key)
    return count

def clear_login_failures(email: str, ip: str) -> None:
    fail_key, lock_key = _keys(email, ip)
    cache.delete_many([fail_key, lock_key])
