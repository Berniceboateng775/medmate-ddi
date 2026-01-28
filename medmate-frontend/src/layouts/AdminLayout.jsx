// src/layouts/AdminLayout.jsx
import BaseLayout from "./BaseLayout"
import { LayoutDashboard, UserPlus, Users, UserCheck, Settings } from "lucide-react"

const navItems = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Patients",
    path: "/admin/patients",
    icon: <Users size={20} />,
  },
  {
    label: "Register Patient",
    path: "/admin/register-patient",
    icon: <UserCheck size={20} />,
  },
  {
    label: "Register User",
    path: "/admin/register-user",
    icon: <UserPlus size={20} />,
  },
  {
    label: "Settings",
    path: "/admin/settings",
    icon: <Settings size={20} />,
    highlight: true,
  },
]

const AdminLayout = () => {
  return <BaseLayout role="ADMIN" navItems={navItems} />
}

export default AdminLayout
