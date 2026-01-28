# MedMate Backend - Django REST API

A comprehensive Drug-Drug Interaction (DDI) backend API built with Django REST Framework.

## 🚀 Deployment to Render

### Prerequisites
- Render account (https://render.com)
- SendGrid account with API key
- Git repository

**Note:** Render will automatically provision a PostgreSQL database for you - no manual database setup required!

### Step 1: Prepare Your Repository
1. Ensure all files are committed to your Git repository
2. The following files should be in your repository root:
   - `requirements.txt`
   - `render.yaml`
   - `build.sh`
   - `manage.py`
   - `DDI_backend_final/` (your Django project)

### Step 2: Deploy with Render Blueprint
1. **Connect your Git repository** to Render
2. **Use the Blueprint deployment** with the `render.yaml` file
3. **Render will automatically create:**
   - PostgreSQL database service (`medmate-db`)
   - Django web service (`medmate-backend`)
4. **Set up the following secrets** in Render dashboard > Settings > Secrets:

| Secret Name | Value |
|-------------|--------|
| `django_secret_key` | A long random string for Django SECRET_KEY (generate with `openssl rand -hex 32`) |
| `sendgrid_api_key` | Your SendGrid API key |
| `default_from_email` | Your verified sender email |
| `frontend_origin` | Your frontend URL (e.g., https://your-frontend.onrender.com) |
| `cors_allowed_origins` | Comma-separated frontend URLs |
| `csrf_trusted_origins` | Comma-separated frontend URLs |
| `allowed_hosts` | Your Render domain (e.g., your-app.onrender.com) |

### Step 3: Deploy to Render
1. Connect your Git repository to Render
2. Use the `render.yaml` configuration
3. Deploy the web service
4. Your API will be available at `https://your-app.onrender.com`

### Step 4: Post-Deployment
1. Run database migrations if needed
2. Test the API endpoints
3. Update your frontend to use the production API URL

## 🔧 Configuration

### Database
The app uses **PostgreSQL** for production (automatically provisioned by Render). The database URL is automatically configured through the `render.yaml` blueprint.

### Environment Variables
- `DEBUG`: Set to `false` for production
- `SECRET_KEY`: Django secret key
- `DATABASE_URL`: Automatically provided by Render PostgreSQL service
- `SENDGRID_API_KEY`: SendGrid API key for emails
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts

### Database
The app supports both SQLite (development) and PostgreSQL (production) via `DATABASE_URL`.

## 📧 Email Features
- User invitation emails
- 2FA security codes
- Medication notifications

## 🛠 Development
```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## 📚 API Documentation
Available at `/api/docs/` when running the server.