# DDI_backend_final/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from .admin import admin_site

from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from dj_rest_auth.views import UserDetailsView

# ViewSets
from patients.views import PatientViewSet
from prescriptions.views import MedicationViewSet
from notifications.views import NotificationViewSet

# Auth & invitations
from accounts.views_auth import EmailPasswordLoginView, TwoFactorSetupView, TwoFactorDisableView
from accounts.views import (
    SuperuserCreateAdminView,
    AdminCreateProfessionalView,
    SuperuserInviteAdminView,
    AdminInviteProfessionalView,
    InvitationInfoView,
    InvitationAcceptView,
    AdminUserManagementView,
    AdminUserActionView,
    UserProfileView,
)

# Passkeys
from accounts.passkeys import (
    BeginRegisterPasskey, FinishRegisterPasskey,
    BeginLoginPasskey, FinishLoginPasskey,
    MyPasskeysView, RenamePasskeyView, DeletePasskeyView,
)

# DDI
from interactions.views import DDICheckView, AdminDashboardView
from notifications.views import NotificationViewSet
router = DefaultRouter()
router.register(r"patients", PatientViewSet, basename="patients")
router.register(r"medications", MedicationViewSet, basename="medications")
router.register(r"notifications", NotificationViewSet, basename="notifications")
# ---- ViewSet aliases for pharmacist UI (same handlers, different prefixes) ----
patient_list = PatientViewSet.as_view({"get": "list", "post": "create"})
patient_detail = PatientViewSet.as_view({
    "get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"
})

med_list = MedicationViewSet.as_view({"get": "list", "post": "create"})
med_detail = MedicationViewSet.as_view({
    "get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"
})

urlpatterns = [
    # Redirect root to admin
    path("", RedirectView.as_view(url="/admin/", permanent=False)),
    path("admin/", admin_site.urls),

    # ----- Auth (custom JWT login first) -----
    path("api/auth/login/", EmailPasswordLoginView.as_view(), name="jwt_email_login"),
    path("api/auth/2fa/setup/", TwoFactorSetupView.as_view(), name="2fa_setup"),
    path("api/auth/2fa/disable/", TwoFactorDisableView.as_view(), name="2fa_disable"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    # dj-rest-auth still included for /api/auth/user/ etc.
    path("api/auth/", include("dj_rest_auth.urls")),
    # Custom profile view with professional/admin profile data:
    path("api/profile/", UserProfileView.as_view()),

    # ----- Role-based account mgmt -----
    path("api/su/create-admin/", SuperuserCreateAdminView.as_view()),
    path("api/admin/create-professional/", AdminCreateProfessionalView.as_view()),

    # ----- Invitations -----
    path("api/su/invitations/admin/", SuperuserInviteAdminView.as_view()),
    path("api/admin/invitations/professional/", AdminInviteProfessionalView.as_view()),

    # ----- Core API (router) -----
    path("api/", include(router.urls)),

    # ----- Invitations (must come after router to avoid conflicts) -----
    path("api/invitations/<str:code>/", InvitationInfoView.as_view()),
    path("api/invitations/<str:code>/accept/", InvitationAcceptView.as_view()),

    # ----- Pharmacist aliases (to satisfy existing frontend calls) -----
    path("api/pharmacist/patients/", patient_list),
    path("api/pharmacist/patient/<int:pk>/", patient_detail),

    path("api/pharmacist/drugs/", med_list),
    path("api/pharmacist/drugs/<int:pk>/", med_detail),

    # ----- DDI -----
    path("api/ddi/check/", DDICheckView.as_view()),

    # ----- Admin Dashboard -----
    path("api/admin/dashboard/", AdminDashboardView.as_view()),

    # ----- User Management -----
    path("api/admin/users/", AdminUserManagementView.as_view()),
    path("api/admin/users/<int:user_id>/<str:action>/", AdminUserActionView.as_view()),

    # ----- API schema + docs -----
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema")),

    # ----- Passkeys -----
    path("api/passkeys/begin-register/", BeginRegisterPasskey.as_view()),
    path("api/passkeys/finish-register/", FinishRegisterPasskey.as_view()),
    path("api/passkeys/begin-login/", BeginLoginPasskey.as_view()),
    path("api/passkeys/finish-login/", FinishLoginPasskey.as_view()),
    path("api/passkeys/", MyPasskeysView.as_view()),
    path("api/passkeys/<int:pk>/rename/", RenamePasskeyView.as_view()),
    path("api/passkeys/<int:pk>/", DeletePasskeyView.as_view()),
]
