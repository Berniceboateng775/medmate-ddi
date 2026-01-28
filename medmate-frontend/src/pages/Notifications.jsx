"use client"

import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import API from "../services/api"

const BellIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h11z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
)

const RefreshIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
)

const CheckIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
)

const UserIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
)

const AlertIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
)

export default function Notifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await API.get("/notifications/")
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("Failed to load notifications", e)
      setError("Failed to load notifications")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const markRead = async (id) => {
    try {
      await API.post(`/notifications/${id}/read/`)
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    } catch (e) {
      console.error("Failed to mark as read", e)
    }
  }

  const markAllRead = async () => {
    const unread = items.filter((n) => !n.is_read)
    await Promise.all(unread.map((n) => API.post(`/notifications/${n.id}/read/`).catch(() => {})))
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const goToContext = (n) => {
    if (n.patient) navigate(`/doctor/patient/${n.patient}`)
  }

  const getNotificationIcon = (notification) => {
    if (notification.type === "patient") return UserIcon
    if (notification.type === "alert" || notification.type === "critical") return AlertIcon
    return BellIcon
  }

  const getNotificationColor = (notification) => {
    if (notification.type === "critical") return "text-red-600 bg-red-50"
    if (notification.type === "alert") return "text-orange-600 bg-orange-50"
    if (notification.type === "patient") return "text-emerald-600 bg-emerald-50"
    return "text-blue-600 bg-blue-50"
  }

  const unreadCount = items.filter((n) => !n.is_read).length

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BellIcon className="h-8 w-8 text-emerald-600" />
              Notifications
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center text-sm font-semibold bg-red-500 text-white rounded-full h-6 w-6">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-gray-600 mt-1">Stay updated with important alerts and patient information</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                unreadCount === 0
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <CheckIcon className="h-4 w-4" />
              Mark all read
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Notifications</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={load}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-gray-600">You'll see important updates and alerts here when they arrive.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {items.map((n) => {
                const NotificationIcon = getNotificationIcon(n)
                const colorClasses = getNotificationColor(n)

                return (
                  <div
                    key={n.id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${!n.is_read ? "bg-blue-50/30" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${colorClasses}`}>
                        <NotificationIcon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {!n.is_read && <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />}
                              <h3 className="font-semibold text-gray-900">{n.title}</h3>
                            </div>
                            {n.message && <p className="text-gray-700 mb-3 whitespace-pre-wrap">{n.message}</p>}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {n.patient && (
                                <button
                                  onClick={() => goToContext(n)}
                                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                                >
                                  View patient →
                                </button>
                              )}
                              {n.medication && (
                                <span className="flex items-center gap-1">
                                  <svg
                                    className="h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                                    />
                                  </svg>
                                  Medication #{n.medication}
                                </span>
                              )}
                              <span>{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {!n.is_read && (
                              <button
                                onClick={() => markRead(n.id)}
                                className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
