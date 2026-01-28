"use client"

import { useEffect, useState } from "react"
import API from "../services/api"

const showMessage = (message, type = "info") => {
  const box = document.getElementById("messageBox")
  if (box) {
    box.textContent = message
    box.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-transform transform ${
      type === "error"
        ? "bg-red-500 text-white"
        : type === "success"
          ? "bg-green-500 text-white"
          : "bg-blue-500 text-white"
    } translate-y-0 opacity-100`
    setTimeout(() => box.classList.add("translate-y-full", "opacity-0"), 3000)
  }
}

const AdminDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showUserActions, setShowUserActions] = useState({})
  const [showSystemSettings, setShowSystemSettings] = useState(false)
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "system")
  const [announcement, setAnnouncement] = useState("")
  const [reportGenerating, setReportGenerating] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    fetchUsers()
    // Get current user info from localStorage
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData))
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      const response = await API.get("/admin/users/")
      setUsers(response.data.users || [])
    } catch (err) {
      console.error("Failed to load users:", err)
      showMessage("Failed to load users", "error")
    } finally {
      setUsersLoading(false)
    }
  }

  const handleUserAction = async (userId, action) => {
    try {
      let endpoint = `/admin/users/${userId}/${action}/`
      let requestData = {}

      if (action === "promote") {
        // For promote action, we need to specify the new role
        const user = users.find((u) => u.id === userId)
        const newRole = user.role === "DOCTOR" ? "ADMIN" : "DOCTOR"
        endpoint = `/admin/users/${userId}/update-role/`
        requestData = { role: newRole }
      }

      const response = await API.post(endpoint, requestData)
      showMessage(response.data.message, "success")
      fetchUsers() // Refresh the users list
      setShowUserActions({}) // Close all dropdowns
    } catch (err) {
      console.error(`Failed to ${action} user:`, err)
      showMessage(`Failed to ${action} user`, "error")
    }
  }

  const handleGenerateReport = async () => {
    try {
      setReportGenerating(true)
      showMessage("Generating comprehensive report...", "info")
      setShowReportDialog(false)

      // Create report content
      const reportData = {
        timestamp: new Date().toISOString(),
        metrics: data?.metrics,
        users: users.length,
        recentActivity: data?.ddi_checks_7d,
        usersList: users.map((u) => ({
          name: u.full_name,
          email: u.email,
          role: u.role,
          status: u.is_active ? "Active" : "Inactive",
          lastLogin: u.last_login,
        })),
      }

      // Generate PDF content as text (in real app, use jsPDF or similar)
      const reportContent = `
MEDMATE SYSTEM REPORT
Generated: ${new Date().toLocaleString()}

SYSTEM METRICS:
- Total Users: ${reportData.metrics?.users || 0}
- New Sign-ups (7d): ${reportData.metrics?.new_signups_7d || 0}
- DDI Checks (24h): ${reportData.metrics?.ddi_checks_24h || 0}
- Error Rate (24h): ${reportData.metrics?.error_rate_24h || 0}%

ACTIVITY DATA (Last 7 Days):
${reportData.recentActivity?.map((count, i) => `Day ${i + 1}: ${count} checks`).join("\n") || "No data"}

USER SUMMARY:
Total Active Users: ${reportData.usersList?.filter((u) => u.status === "Active").length || 0}
Total Inactive Users: ${reportData.usersList?.filter((u) => u.status === "Inactive").length || 0}

DETAILED USER LIST:
${reportData.usersList?.map((u) => `${u.name} (${u.email}) - ${u.role} - ${u.status}`).join("\n") || "No users"}
      `

      // Create and download the file
      const blob = new Blob([reportContent], { type: "text/plain" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `medmate-report-${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setTimeout(() => {
        showMessage("Report downloaded successfully!", "success")
        setReportGenerating(false)
      }, 1500)
    } catch (err) {
      showMessage("Failed to generate report", "error")
      setReportGenerating(false)
    }
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)

    // Apply theme to document
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark")
    } else {
      // System theme
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
    showMessage(`Theme changed to ${newTheme}`, "success")
  }

  const handlePostAnnouncement = async () => {
    if (!announcement.trim()) {
      showMessage("Please enter an announcement", "error")
      return
    }

    try {
      showMessage("Sending announcement to all users...", "info")
      setShowAnnouncementDialog(false)

      // Get all user emails from the users list
      const userEmails = users.map((user) => user.email).filter((email) => email)

      if (userEmails.length === 0) {
        showMessage("No users found to send announcement to", "error")
        return
      }

      try {
        // Try the email announcement endpoint first
        const response = await API.post("/admin/send-announcement/", {
          message: announcement,
          recipients: userEmails,
          subject: "Important Announcement from MedMate Administration",
        })
        showMessage(`Announcement sent to ${userEmails.length} users successfully!`, "success")
      } catch (emailError) {
        console.log("[v0] Email endpoint failed, trying notification system:", emailError)

        // Fallback: Try to send as in-app notifications
        try {
          const notificationResponse = await API.post("/admin/notifications/", {
            message: announcement,
            title: "System Announcement",
            recipients: userEmails,
            type: "announcement",
          })
          showMessage(`Announcement sent as notifications to ${userEmails.length} users!`, "success")
        } catch (notificationError) {
          console.log("[v0] Notification endpoint also failed:", notificationError)

          // Final fallback: Log the announcement locally and show success
          console.log("[v0] Announcement would be sent to:", userEmails)
          console.log("[v0] Announcement message:", announcement)
          showMessage(`Announcement logged for ${userEmails.length} users (backend endpoint needs setup)`, "info")
        }
      }

      setAnnouncement("")
    } catch (err) {
      console.error("Failed to send announcement:", err)
      showMessage("Failed to send announcement", "error")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login"
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await API.get("/admin/dashboard/")
      setData(response.data)
    } catch (err) {
      setError("Failed to load dashboard data")
      console.error("Dashboard error:", err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (dateString) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleString()
  }

  const toggleUserActions = (userId) => {
    setShowUserActions((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-red-600 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { metrics, ddi_checks_7d, recent_users } = data || {}

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${theme === "dark" ? "dark bg-gray-900" : "bg-gray-50"}`}
    >
      {/* Message Box for notifications */}
      <div
        id="messageBox"
        className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-transform transform translate-y-full opacity-0 duration-300"
      />

      {/* Header */}
      <div
        className={`border-b transition-colors duration-200 px-6 py-4 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1
              className={`text-2xl font-bold transition-colors duration-200 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              System Overview
            </h1>
            <p
              className={`mt-1 transition-colors duration-200 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
            >
              Monitor and manage your healthcare platform
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Generate Report Button */}
            <button
              onClick={() => setShowReportDialog(true)}
              disabled={reportGenerating}
              className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:border-gray-500"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              }`}
            >
              <svg
                className={`w-4 h-4 ${reportGenerating ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {reportGenerating ? "Generating..." : "Generate Report"}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className={`flex items-center gap-2 p-2 rounded-full transition-colors ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-700 font-semibold text-sm">
                    {currentUser?.full_name?.charAt(0) || "A"}
                  </span>
                </div>
              </button>

              {showProfileDropdown && (
                <div
                  className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg border z-50 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <div className={`p-4 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-100"}`}>
                    <p className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {currentUser?.full_name || "Administrator"}
                    </p>
                    <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                      {currentUser?.email || "admin@hospital.com"}
                    </p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowSystemSettings(true)
                        setShowProfileDropdown(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${theme === "dark" ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      System Settings
                    </button>
                    <hr className={`my-2 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`} />
                    <button
                      onClick={handleLogout}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${theme === "dark" ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-red-50"}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
            <h3 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Generate System Report
            </h3>
            <p className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              Generate a comprehensive report including system metrics, user data, and activity logs. The report will be
              downloaded as a text file.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReportDialog(false)}
                className={`px-4 py-2 border rounded-lg transition-colors ${theme === "dark" ? "text-gray-200 border-gray-600 hover:bg-gray-700" : "text-gray-700 border-gray-300 hover:bg-gray-50"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download Report
              </button>
            </div>
          </div>
        </div>
      )}

      {showSystemSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              System Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}
                >
                  Theme
                </label>
                <div className="space-y-2">
                  {[
                    { value: "light", label: "Light Mode", icon: "☀️" },
                    { value: "dark", label: "Dark Mode", icon: "🌙" },
                    { value: "system", label: "System Default", icon: "💻" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={option.value}
                        checked={theme === option.value}
                        onChange={(e) => handleThemeChange(e.target.value)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-lg">{option.icon}</span>
                      <span className={`text-sm ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSystemSettings(false)}
                className={`px-4 py-2 border rounded-lg transition-colors ${theme === "dark" ? "text-gray-200 border-gray-600 hover:bg-gray-700" : "text-gray-700 border-gray-300 hover:bg-gray-50"}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnnouncementDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Post Announcement
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}
                >
                  Announcement Message
                </label>
                <textarea
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="Enter your announcement message..."
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-colors ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  rows={4}
                />
                <p className={`text-xs mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  This announcement will be sent via email to all {users.length} registered users.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAnnouncementDialog(false)
                  setAnnouncement("")
                }}
                className={`px-4 py-2 border rounded-lg transition-colors ${theme === "dark" ? "text-gray-200 border-gray-600 hover:bg-gray-700" : "text-gray-700 border-gray-300 hover:bg-gray-50"}`}
              >
                Cancel
              </button>
              <button
                onClick={handlePostAnnouncement}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                  />
                </svg>
                Send to {users.length} Users
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div
            className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all duration-200 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  Total Users
                </p>
                <p className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {metrics?.users || 0}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all duration-200 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  New Sign-ups (7d)
                </p>
                <p className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {metrics?.new_signups_7d || 0}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all duration-200 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  DDI Checks (24h)
                </p>
                <p className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {metrics?.ddi_checks_24h || 0}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all duration-200 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  Error Rate (24h)
                </p>
                <p className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {metrics?.error_rate_24h || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div
          className={`rounded-xl shadow-sm border transition-colors duration-200 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          <div className={`p-6 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
            <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Activity Overview - Last 7 Days
            </h3>
            <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              Drug interaction checks performed daily
            </p>
          </div>
          <div className="p-6">
            <div
              className={`h-40 flex items-end space-x-3 rounded-lg p-6 ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}
            >
              {ddi_checks_7d?.map((count, index) => {
                const maxCount = Math.max(...ddi_checks_7d)
                const height = maxCount > 0 ? (count / maxCount) * 100 : 0
                const days = ["7d ago", "6d ago", "5d ago", "4d ago", "3d ago", "2d ago", "1d ago"]
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-emerald-500 rounded-t-lg transition-all duration-300 hover:bg-emerald-600"
                      style={{ height: `${Math.max(height, 8)}%` }}
                    ></div>
                    <span className={`text-xs mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                      {days[index]}
                    </span>
                    <span className={`text-xs font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div
          className={`rounded-xl shadow-sm border transition-colors duration-200 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          <div className={`p-6 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
            <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Quick Actions
            </h3>
            <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              Common administrative tasks
            </p>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              <a
                href="/register"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                Register User
              </a>
              <button
                onClick={() => setShowAnnouncementDialog(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm font-medium ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                  />
                </svg>
                Post Announcement
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                Toggle Maintenance
              </button>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div
          className={`rounded-xl shadow-sm border transition-colors duration-200 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          <div className={`p-6 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  User Management
                </h3>
                <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  Manage all users in your hospital system
                </p>
              </div>
              <button
                onClick={fetchUsers}
                disabled={usersLoading}
                className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm font-medium disabled:opacity-50 ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg
                  className={`w-4 h-4 ${usersLoading ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {usersLoading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={theme === "dark" ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}
                  >
                    User
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}
                  >
                    Role
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}
                  >
                    Status
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}
                  >
                    Last Login
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y transition-colors duration-200 ${theme === "dark" ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"}`}
              >
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`transition-colors ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 text-sm font-medium">
                            {user.full_name?.charAt(0) || user.email?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {user.full_name}
                          </div>
                          <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${theme === "dark" ? "border-gray-600 text-gray-200" : "border-gray-300 text-gray-700"}`}
                      >
                        {user.role === "ADMIN" && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                        )}
                        {user.role === "DOCTOR" && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        )}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {formatDate(user.last_login)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                      <div className="flex items-center gap-2">
                        {/* Deactivate/Activate Button */}
                        <button
                          onClick={() => handleUserAction(user.id, user.is_active ? "deactivate" : "activate")}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            user.is_active
                              ? theme === "dark"
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : "bg-red-100 hover:bg-red-200 text-red-800"
                              : theme === "dark"
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-green-100 hover:bg-green-200 text-green-800"
                          }`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={
                                user.is_active
                                  ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                                  : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              }
                            />
                          </svg>
                          {user.is_active ? "Deactivate" : "Activate"}
                        </button>

                        {/* Change Role Button */}
                        <button
                          onClick={() => handleUserAction(user.id, "promote")}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            theme === "dark"
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-blue-100 hover:bg-blue-200 text-blue-800"
                          }`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                          {user.role === "DOCTOR" ? "Make Admin" : "Make Doctor"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && !usersLoading && (
            <div className="text-center py-12">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}
              >
                <svg
                  className={`w-8 h-8 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                No users found
              </h3>
              <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>No users found in your hospital.</p>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showProfileDropdown ||
        Object.keys(showUserActions).length > 0 ||
        showSystemSettings ||
        showAnnouncementDialog) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowProfileDropdown(false)
            setShowUserActions({})
            setShowSystemSettings(false)
            setShowAnnouncementDialog(false)
          }}
        />
      )}
    </div>
  )
}

export default AdminDashboard
