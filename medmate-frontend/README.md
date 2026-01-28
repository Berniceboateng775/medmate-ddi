# MedMate Frontend - React SPA

A modern React application built with Vite, featuring authentication, prescription management, and drug-drug interaction checking.

## 🚀 Deployment to Vercel

### Prerequisites
- Vercel account (https://vercel.com)
- Deployed Django backend on Render
- Git repository

### Step 1: Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your Git repository
4. Vercel will auto-detect it as a Vite React app

### Step 2: Configure Environment Variables
In Vercel project settings, add this environment variable:

| Name | Value |
|------|--------|
| `VITE_API_BASE_URL` | `https://your-backend-app.onrender.com/api` |

**Replace `your-backend-app` with your actual Render backend URL.**

### Step 3: Deploy
1. Vercel will automatically build and deploy
2. Your app will be available at: `https://your-project.vercel.app`

## 🔧 Configuration

### Environment Variables
- `VITE_API_BASE_URL`: Backend API URL (defaults to `http://localhost:8000/api`)

### Build Configuration
- **Framework**: Vite + React
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: Latest LTS

## 🛠 Development
```bash
npm install
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🎨 Features
- **Authentication**: JWT-based login with refresh tokens
- **Role-based Access**: Doctor, Pharmacist, Admin interfaces
- **Prescription Management**: CRUD operations
- **Drug Interactions**: Real-time DDI checking
- **Responsive Design**: Tailwind CSS styling
- **Charts**: Recharts for data visualization

## 🔗 API Integration
The app connects to the Django REST API with:
- Automatic token refresh
- Request/response interceptors
- Error handling
- CORS support

## 📱 Tech Stack
- **React 19** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
