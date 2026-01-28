"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Shield, ArrowLeft } from "lucide-react"
import API from "../services/api"

const TwoFactorSetup = () => {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}")
    } catch {
      return {}
    }
  })()

  const isEnabled = user?.email_2fa_enabled

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const data = { action: isEnabled ? 'disable' : 'enable' }
      if (isEnabled) {
        data.code = code
      }

      await API.post("/auth/2fa/setup/", data)

      // Refresh user data
      const me = await API.get("/auth/user/")
      const updatedUser = { ...user, ...me.data }
      localStorage.setItem("user", JSON.stringify(updatedUser))

      navigate(-1) // Go back
    } catch (err) {
      setError(err?.response?.data?.detail || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
              <Shield className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEnabled ? 'Disable' : 'Enable'} Two-Factor Authentication
            </h1>
            <p className="text-gray-600 mt-2">
              {isEnabled
                ? 'Enter the code sent to your email to disable 2FA.'
                : 'Two-factor authentication is enabled by default for your security.'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isEnabled && (
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="code"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength="6"
                  required
                />
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                loading
                  ? "bg-emerald-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
              } text-white`}
            >
              {loading ? 'Processing...' : (isEnabled ? 'Disable 2FA' : 'Enable 2FA')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TwoFactorSetup