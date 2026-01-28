"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import API from "../services/api"

export default function AcceptInvite() {
  const { code } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState(null)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    password: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    phone: "",
    specialization: "",
    license_number: "",
    department: "",
    position: "",
    staff_badge_number: "",
  })

  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        const { data } = await API.get(`/invitations/${code}/`)
        if (!cancel) setInvite(data)
      } catch (e) {
        setError("Invitation not found, used, or expired.")
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [code])

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    // Clear error for this field when user starts typing
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: "" })
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!form.first_name.trim()) errors.first_name = "First name is required"
    if (!form.last_name.trim()) errors.last_name = "Last name is required"
    if (!form.password || form.password.length < 6) errors.password = "Password must be at least 6 characters"

    const inviteType = (invite.invite_type || "").toUpperCase()
    if (inviteType !== "ADMIN") {
      if (!form.license_number.trim()) errors.license_number = "License number is required"
      if (!form.specialization.trim()) errors.specialization = "Specialization is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) return

    setSubmitting(true)
    try {
      const { data } = await API.post(`/invitations/${code}/accept/`, form)
      localStorage.setItem("access", data.access || "")
      localStorage.setItem("refresh", data.refresh || "")
      localStorage.setItem("user", JSON.stringify(data.user || {}))
      const role = (data.user?.role || "").toUpperCase()
      if (role === "ADMIN") navigate("/admin", { replace: true })
      else if (role === "DOCTOR") navigate("/doctor", { replace: true })
      else if (role === "PHARMACIST") navigate("/pharmacist", { replace: true })
      else navigate("/", { replace: true })
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to accept invitation.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Invalid Invitation</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!invite) return null

  const inviteType = (invite.invite_type || "").toUpperCase()
  const profRole = (invite.role || "").toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Accept Invitation</h1>
                <p className="text-emerald-100 text-sm">Complete your account setup</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    You've been invited as{" "}
                    {inviteType === "ADMIN" ? "Administrator" : profRole || "Healthcare Professional"}
                  </h3>
                  {invite.hospital && (
                    <p className="text-sm text-gray-600 mt-1">
                      at <span className="font-medium">{invite.hospital.name || invite.hospital}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Please complete the form below to activate your account</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="first_name"
                      value={form.first_name}
                      onChange={onChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                        formErrors.first_name ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                      placeholder="Enter your first name"
                      required
                    />
                    {formErrors.first_name && <p className="text-red-600 text-xs mt-1">{formErrors.first_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                    <input
                      name="middle_name"
                      value={form.middle_name}
                      onChange={onChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Enter your middle name (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="last_name"
                      value={form.last_name}
                      onChange={onChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                        formErrors.last_name ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                      placeholder="Enter your last name"
                      required
                    />
                    {formErrors.last_name && <p className="text-red-600 text-xs mt-1">{formErrors.last_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Enter your phone number"
                      type="tel"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                      formErrors.password ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="Create a strong password (min. 12 characters)"
                    required
                  />
                  {formErrors.password && <p className="text-red-600 text-xs mt-1">{formErrors.password}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    Use at least 6 characters with a mix of letters, numbers, and symbols
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {inviteType === "ADMIN" ? "Administrative Information" : "Professional Information"}
                </h4>

                {inviteType === "ADMIN" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Position/Title</label>
                      <input
                        name="position"
                        value={form.position}
                        onChange={onChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder="e.g., Hospital Administrator, IT Manager"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Staff Badge Number</label>
                      <input
                        name="staff_badge_number"
                        value={form.staff_badge_number}
                        onChange={onChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder="Enter your staff badge number"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specialization <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="specialization"
                        value={form.specialization}
                        onChange={onChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                          formErrors.specialization ? "border-red-300 bg-red-50" : "border-gray-300"
                        }`}
                        placeholder="e.g., Cardiology, Internal Medicine"
                        required
                      />
                      {formErrors.specialization && (
                        <p className="text-red-600 text-xs mt-1">{formErrors.specialization}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        License/Registration Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="license_number"
                        value={form.license_number}
                        onChange={onChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                          formErrors.license_number ? "border-red-300 bg-red-50" : "border-gray-300"
                        }`}
                        placeholder="Enter your professional license number"
                        required
                      />
                      {formErrors.license_number && (
                        <p className="text-red-600 text-xs mt-1">{formErrors.license_number}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department/Unit</label>
                      <input
                        name="department"
                        value={form.department}
                        onChange={onChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder="e.g., Emergency Department, ICU, Outpatient Clinic"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  {submitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Create Account & Get Started
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 text-center mt-3">
                  By creating an account, you agree to our terms of service and privacy policy
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
