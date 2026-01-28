# accounts/middleware.py
import time
from django.contrib.auth import logout
from django.http import HttpResponseForbidden

IDLE_TIMEOUT_SECONDS = 15 * 60  # 15 minutes
class AdminSuperuserOnlyMiddleware:
    """
    Blocks access to /admin/* for anyone who isn't a superuser or admin.
    - Anonymous users can still see the admin login page, but once they log in
      as a non-superuser/non-admin they'll get blocked immediately.
    - Superusers and admin role users proceed as normal.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path or ""
        if path.startswith("/admin/"):
            user = getattr(request, "user", None)
            # Allow the login page to render for anonymous users
            if user and user.is_authenticated:
                # Allow superusers and admin role users
                if not (user.is_superuser or getattr(user, 'role', None) == 'ADMIN'):
                    return HttpResponseForbidden("Admin site is restricted to superusers and admins.")
        return self.get_response(request)
class IdleSessionTimeoutMiddleware:
    """
    Logs out authenticated users after IDLE_TIMEOUT_SECONDS of inactivity.
    Works with session auth and JWT-backed views that still use request.user.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            now = int(time.time())
            last = request.session.get("last_activity", now)
            if now - last > IDLE_TIMEOUT_SECONDS:
                logout(request)
                # Optionally clear session entirely:
                # request.session.flush()
            request.session["last_activity"] = now
        return self.get_response(request)
