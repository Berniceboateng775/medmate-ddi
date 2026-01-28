# DDI_backend_final/settings.py
from pathlib import Path
from datetime import timedelta
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv(BASE_DIR / '.env')

# Production settings
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret-change-me")
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# ALLOWED_HOSTS - include production domain
allowed_hosts = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1")
if isinstance(allowed_hosts, str):
    ALLOWED_HOSTS = [host.strip() for host in allowed_hosts.split(",")]
else:
    ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# Always allow the production domain
if "ddi-2n0x.onrender.com" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append("ddi-2n0x.onrender.com")
# Login lockout tuning
LOGIN_MAX_ATTEMPTS = 5                   # N bad attempts within WINDOW triggers cooldown
LOGIN_ATTEMPT_WINDOW_SECONDS = 300       # 5 minutes window
LOGIN_COOLDOWN_SECONDS = 900             # lockout 15 minutes

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",

    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "drf_spectacular",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "dj_rest_auth",

    "accounts",
    "hospitals",
    "patients",
    "drugs",
    "prescriptions",
    "interactions",
    "notifications",
    "sendgrid",
    "DDI_backend_final",  # For management commands
]

SITE_ID = 1

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Add Whitenoise for static files
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "accounts.middleware.IdleSessionTimeoutMiddleware",
    "accounts.middleware.AdminSuperuserOnlyMiddleware",
]

ROOT_URLCONF = "DDI_backend_final.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

WSGI_APPLICATION = "DDI_backend_final.wsgi.application"

# Database configuration - supports both SQLite and PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    # Use DATABASE_URL if provided (for production)
    import dj_database_url
    DATABASES = {
        "default": dj_database_url.config(default=DATABASE_URL)
    }
else:
    # Default to SQLite for development
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 12}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- Passkeys / WebAuthn ---
# rp_id must be the host only (no scheme/port). For dev this can be 'localhost'.
RP_ID = os.getenv("RP_ID", "localhost")
RP_NAME = os.getenv("RP_NAME", "MedMate DDI")
# Must exactly match your frontend’s origin (scheme + host + port)
WEBAUTHN_ORIGIN = os.getenv("WEBAUTHN_ORIGIN", "http://localhost:5173")

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Whitenoise settings for static files
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "accounts.User"

SESSION_COOKIE_AGE = 60 * 60 * 8
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_SAVE_EVERY_REQUEST = True

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.ScopedRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {"login": "10/min"},
}

REST_USE_JWT = True
REST_SESSION_LOGIN = False

REST_AUTH_SERIALIZERS = {
    "LOGIN_SERIALIZER": "accounts.serializers.EmailLoginSerializer",
    "USER_DETAILS_SERIALIZERS": "accounts.serializers.UserDetailsSerializer",
    "USER_DETAILS_SERIALIZER": "accounts.serializers.UserDetailsSerializer",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "DDI Backend API",
    "DESCRIPTION": "Drug–Drug Interaction backend",
    "VERSION": "1.0.0",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}

ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_USER_MODEL_EMAIL_FIELD = "email"
ACCOUNT_LOGIN_METHODS = {"email"}
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]
ACCOUNT_EMAIL_VERIFICATION = "optional"

AUTHENTICATION_BACKENDS = (
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
)

EMAIL_BACKEND = "sgbackend.SendGridBackend"
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "YOUR_SENDGRID_API_KEY_HERE")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "no-reply@medmate.local")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

# CORS settings
CORS_ALLOWED_ORIGINS = [origin.rstrip('/') for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000").split(",")]
CORS_ALLOW_CREDENTIALS = True

# CSRF settings
CSRF_TRUSTED_ORIGINS = os.getenv("CSRF_TRUSTED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000").split(",")

# HF Spaces config used by your DDI endpoints
HF_TOKEN = os.getenv("HF_TOKEN", "")
HF_SPACE_FREDA   = os.getenv("HF_SPACE_FREDA",   "Fredaaaaaa/smilesssssss")
HF_SPACE_BERNICE = os.getenv("HF_SPACE_BERNICE", "Bernice775/t5-ddi-api")
