# MedMate DDI - Drug-Drug Interaction Checker

A comprehensive healthcare application for checking drug-drug interactions (DDI) using AI-powered models. Built with Django REST Framework (backend) and React (frontend).

![MedMate DDI](https://img.shields.io/badge/MedMate-DDI-emerald?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square)
![Django](https://img.shields.io/badge/Django-5.2-green?style=flat-square)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

## 🔗 Live Demo

**🌐 Try the App**: [https://medmate-ddi.vercel.app](https://medmate-ddi.vercel.app)

**📡 API Documentation**: [https://medmate-backend-0hgo.onrender.com/api/docs/](https://medmate-backend-0hgo.onrender.com/api/docs/)

### Demo Video

<video src="demo/Live demo of working app -medmate.mp4" controls width="100%"></video>


## 🌟 Features

- **Drug-Drug Interaction Checking**: AI-powered DDI detection using HuggingFace Spaces
- **Severity Classification**: Get severity levels (Mild, Moderate, Severe) for drug interactions
- **Multi-Role Access**: Support for Doctors, Pharmacists, and Administrators
- **Patient Management**: Track patient prescriptions and medications
- **Real-time Notifications**: Stay updated on critical interactions
- **Secure Authentication**: JWT-based auth with 2FA support and passkeys
- **Admin Dashboard**: Analytics and user management

## 🏗️ Project Structure

```
my-medmate/
├── DDI_backend_final/     # Django REST API Backend
│   ├── accounts/          # User authentication & management
│   ├── drugs/             # Drug database
│   ├── interactions/      # DDI checking logic
│   ├── patients/          # Patient management
│   ├── prescriptions/     # Prescription handling
│   └── notifications/     # Alert system
│
└── medmate-frontend/      # React SPA Frontend
    ├── src/
    │   ├── components/    # Reusable UI components
    │   ├── pages/         # Route pages
    │   └── services/      # API integration
    └── public/
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git

### Backend Setup

```bash
cd DDI_backend_final

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example and fill in values)
cp .env.example .env

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Frontend Setup

```bash
cd medmate-frontend

# Install dependencies
npm install

# Create .env.local file
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env.local

# Start development server
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **API Docs**: http://localhost:8000/api/docs
- **Admin Panel**: http://localhost:8000/admin

## ⚙️ Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `DJANGO_SECRET_KEY` | Django secret key (generate a secure one) |
| `DEBUG` | Set to `True` for development |
| `SENDGRID_API_KEY` | SendGrid API key for emails |
| `DEFAULT_FROM_EMAIL` | Verified sender email |
| `HF_TOKEN` | HuggingFace API token |
| `FRONTEND_ORIGIN` | Frontend URL for CORS |

### Frontend (.env.local)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL |

## 🌐 Deployment

### Backend (Render)

1. Connect your GitHub repo to [Render](https://render.com)
2. Create a new Web Service
3. Use `DDI_backend_final` as the root directory
4. Configure environment variables
5. Deploy

### Frontend (Vercel)

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set root directory to `medmate-frontend`
3. Add `VITE_API_BASE_URL` environment variable
4. Deploy

## 🤖 AI Models

This project uses custom-trained machine learning models for DDI prediction, built from scratch using pharmacological data and deployed on HuggingFace Spaces:

- **Severity Model** (`Fredaaaaaa/severity`): Custom-trained model that predicts interaction severity levels (Mild, Moderate, Severe) based on drug pair analysis
- **Transformer Model** (`Bernice775/Transformer_model_DDI`): A transformer-based model trained on pharmacological datasets to generate detailed interaction descriptions, explanations, and clinical recommendations

The models were developed using:
- DrugBank and pharmacological interaction datasets
- SMILES molecular representations for drug encoding
- T5/Transformer architectures for sequence-to-sequence generation

## 📚 API Documentation

Interactive API documentation is available at `/api/docs/` when the backend is running.

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login/` | POST | User login |
| `/api/ddi/check/` | POST | Check drug interaction |
| `/api/patients/` | GET/POST | Patient management |
| `/api/medications/` | GET/POST | Medication management |

## 🔒 Security Features

- JWT Authentication with refresh tokens
- Two-Factor Authentication (2FA)
- WebAuthn/Passkeys support
- Rate limiting on sensitive endpoints
- Session timeout handling
- CORS protection

## 🛠️ Tech Stack

### Backend
- Django 5.2
- Django REST Framework
- PostgreSQL (production) / SQLite (development)
- SendGrid for emails
- HuggingFace Gradio Client

### Frontend
- React 19
- Vite
- Tailwind CSS
- Axios
- React Router
- Recharts

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Superuser** | Full system access, create admins |
| **Admin** | Manage hospital users, view analytics |
| **Doctor** | Manage patients, prescriptions, check DDIs |
| **Pharmacist** | View patients, check DDIs, manage medications |

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Made with ❤️ for safer healthcare
