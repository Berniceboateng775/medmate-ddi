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
    setTimeout(() => {
      if (box) box.classList.add("translate-y-full", "opacity-0")
    }, 3000)
  }
}

const PharmacistDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentUser, setCurrentUser] = useState(null)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showSystemSettings, setShowSystemSettings] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "system")
  const [trendingDrugs, setTrendingDrugs] = useState([])
  const [patientCount, setPatientCount] = useState(0)
  const [prescriptionChecksCount, setPrescriptionChecksCount] = useState(0)
  const [inventoryAlertsCount, setInventoryAlertsCount] = useState(0)

  useEffect(() => {
    fetchDashboardData()
    fetchPatientCount()
    fetchPrescriptionChecksCount()
    fetchInventoryAlertsCount()
    fetchTrendingDrugs()
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData))
      } catch (err) {
        console.error("Error parsing user data:", err)
      }
    }
    // apply system theme on mount if necessary
    if (localStorage.getItem("theme") === "dark") {
      document.documentElement.classList.add("dark")
    } else if (localStorage.getItem("theme") === "light") {
      document.documentElement.classList.remove("dark")
    } else {
      // system default - let CSS handle
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await API.get("/pharmacist/dashboard/")
      setData(response.data)
    } catch (err) {
      console.log("Pharmacist dashboard API not available, using fallback data")
      setData({ status: "loaded" })
    } finally {
      setLoading(false)
    }
  }

  const fetchPatientCount = async () => {
    try {
      const response = await API.get("/pharmacist/patients/")
      setPatientCount(response.data.length || 0)
    } catch (err) {
      console.log("Patient count API not available")
      setPatientCount(0)
    }
  }

  const fetchPrescriptionChecksCount = async () => {
    try {
      const response = await API.get("/pharmacist/prescription-checks/today/")
      setPrescriptionChecksCount(response.data.count || 0)
    } catch (err) {
      console.log("Prescription checks API not available")
      setPrescriptionChecksCount(0)
    }
  }

  const fetchInventoryAlertsCount = async () => {
    try {
      const response = await API.get("/pharmacist/inventory/alerts/")
      setInventoryAlertsCount(response.data.count || 0)
    } catch (err) {
      console.log("Inventory alerts API not available")
      setInventoryAlertsCount(0)
    }
  }

  const fetchTrendingDrugs = async () => {
    try {
      const response = await API.get("/pharmacist/trending-drugs/")
      setTrendingDrugs(response.data.drugs || [])
    } catch (err) {
      console.log("Trending drugs API not available, using fallback")
      setTrendingDrugs([
        { name: "Amoxicillin", category: "Antibiotic", prescriptions: 180, trend: "up" },
        { name: "Paracetamol", category: "Analgesic", prescriptions: 160, trend: "stable" },
        { name: "Ibuprofen", category: "NSAID", prescriptions: 140, trend: "down" },
        { name: "Loratadine", category: "Antihistamine", prescriptions: 120, trend: "stable" },
        { name: "Omeprazole", category: "PPI", prescriptions: 110, trend: "up" },
      ])
    }
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark")
    } else {
      // system
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }

    showMessage(`Theme changed to ${newTheme}`, "success")
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse py-8">
            <div className="h-6 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl" />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl" />
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
              <p>{error}</p>
              <button
                onClick={() => {
                  setError("")
                  fetchDashboardData()
                  fetchPatientCount()
                  fetchPrescriptionChecksCount()
                  fetchInventoryAlertsCount()
                  fetchTrendingDrugs()
                }}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Retry Loading
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${theme === "dark" ? "dark bg-gray-900" : "bg-gray-50"}`}>
      {/* Message Box for notifications */}
      <div
        id="messageBox"
        className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-transform transform translate-y-full opacity-0 duration-300"
      />

      {/* Top Header */}
      <div
        className={`border-b transition-colors duration-200 px-6 py-4 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">PHARMACIST</span>
                </div>
                <h1 className={`text-xl font-bold transition-colors duration-200 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  Pharmacy Dashboard
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className={`flex items-center gap-2 p-2 rounded-full transition-colors ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-700 font-semibold text-sm">
                    {currentUser?.full_name?.charAt(0) || "P"}
                  </span>
                </div>
              </button>

              {showProfileDropdown && (
                <div
                  className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg border z-50 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <div className={`p-4 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-100"}`}>
                    <p className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {currentUser?.full_name || currentUser?.first_name + " " + currentUser?.last_name || "Pharmacist"}
                    </p>
                    <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                      {currentUser?.email || "pharmacist@hospital.com"}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      System Settings
                    </button>
                    <hr className={`my-2 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`} />
                    <button
                      onClick={handleLogout}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${theme === "dark" ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-red-50"}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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

      {/* System Settings Modal */}
      {showSystemSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>System Settings</h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Theme</label>
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
                      <span className={`text-sm ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>{option.label}</span>
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

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all duration-200 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Active Patients</p>
                <p className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{patientCount}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all duration-200 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Prescription Checks Today</p>
                <p className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{prescriptionChecksCount}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all duration-200 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Inventory Alerts</p>
                <p className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{inventoryAlertsCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trending Medications */}
        <div className={`rounded-xl shadow-sm border transition-colors duration-200 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className={`p-6 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
            <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Trending Medications</h3>
            <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Most dispensed / restocked medications this month</p>
          </div>

          <div className="p-6">
            {trendingDrugs.length > 0 ? (
              <div className="space-y-4">
                {trendingDrugs.map((drug, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      <div>
                        <p className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{drug.name}</p>
                        <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{drug.category}</p>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{drug.prescriptions}</p>
                        <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>dispensed</p>
                      </div>
                      <div className="flex items-center">
                        {drug.trend === "up" ? (
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                          </svg>
                        ) : drug.trend === "down" ? (
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
                  <svg className={`w-8 h-8 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>No trending data available</h3>
                <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Medication trends will appear here when data is available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`rounded-xl shadow-sm border transition-colors duration-200 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className={`p-6 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
            <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Quick Actions</h3>
            <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Common pharmacy tasks and tools</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => showMessage("Opening Drug Interaction Check", "info")}
                className="flex items-center gap-3 p-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Drug Interaction Check</span>
              </button>

              <button
                onClick={() => showMessage("Opening Inventory Management", "info")}
                className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${theme === "dark" ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7" />
                </svg>
                <span className="font-medium">Inventory Management</span>
              </button>

              <button
                onClick={() => showMessage("Opening Dispense Medication", "info")}
                className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${theme === "dark" ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Dispense Medication</span>
              </button>

              <button
                onClick={() => showMessage("Opening Patient Search", "info")}
                className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${theme === "dark" ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6M17 11A6 6 0 1111 5a6 6 0 016 6z" />
                </svg>
                <span className="font-medium">Patient Search</span>
              </button>

              <button
                onClick={() => showMessage("Opening Restock Orders", "info")}
                className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${theme === "dark" ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M9 3v4M15 3v4M4 21h16" />
                </svg>
                <span className="font-medium">Restock Orders</span>
              </button>

              <button
                onClick={() => showMessage("Opening Prescription Validation", "info")}
                className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${theme === "dark" ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c1.657 0 3-1.343 3-3S13.657 2 12 2 9 3.343 9 5s1.343 3 3 3zM4 20v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
                </svg>
                <span className="font-medium">Prescription Validation</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showProfileDropdown || showSystemSettings) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowProfileDropdown(false)
            setShowSystemSettings(false)
          }}
        />
      )}
    </div>
  )
}

export default PharmacistDashboard
