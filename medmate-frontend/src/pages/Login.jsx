"use client"

// src/pages/Login.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, KeyRound, Shield } from "lucide-react"
import API from "../services/api"

// --- base64url helpers ---
const b64uToBuf = (s) => {
  if (!s) return new ArrayBuffer(0)
  s = s.replace(/-/g, "+").replace(/_/g, "/")
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0
  const base64 = s + "=".repeat(pad)
  const str = atob(base64)
  const bytes = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i)
  return bytes.buffer
}
const bufToB64u = (buf) => {
  const bytes = new Uint8Array(buf)
  let str = ""
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i])
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const [loadingPwd, setLoadingPwd] = useState(false)
  const [loadingPk, setLoadingPk] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const navigate = useNavigate()

  const showMessage = (message, type = "info") => {
    const box = document.getElementById("messageBox")
    if (!box) return
    box.textContent = message
    box.className =
      `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-transform transform ` +
      `${type === "error" ? "bg-red-500" : type === "success" ? "bg-green-600" : "bg-blue-600"} text-white translate-y-0 opacity-100`
    setTimeout(() => {
      box.classList.add("translate-y-full", "opacity-0")
    }, 3000)
  }

  const routeByRole = (user) => {
    const role = (user?.role || "").toUpperCase()
    if (role === "PHARMACIST") navigate("/pharmacist")
    else if (role === "DOCTOR") navigate("/doctor")
    else if (role === "ADMIN" || role === "SUPERUSER") navigate("/admin")
    else {
      showMessage(`Unknown user role: "${user?.role}"`, "error")
      navigate("/login")
    }
  }

  // ----- Email + Password -----
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoadingPwd(true)
    try {
      console.log("Login attempt:", { email: email.trim(), password: password ? "[HIDDEN]" : "", totpCode: totpCode ? "[HIDDEN]" : "" })
      const loginData = { email: email.trim(), password }
      if (requires2FA && totpCode) {
        loginData.totp_code = totpCode
      }
      const res = await API.post("/auth/login/", loginData)
      const data = res.data || {}

      if (data.requires_2fa) {
        setRequires2FA(true)
        setLoadingPwd(false)
        showMessage("A 2FA code has been sent to your email. Please enter it below.", "info")
        return
      }

      const { access, refresh, user: loginUser } = data

      localStorage.setItem("access", access)
      localStorage.setItem("refresh", refresh)
      API.defaults.headers.common["Authorization"] = `Bearer ${access}`

      // Try to enrich with /auth/user/ (optional)
      let meUser = null
      try {
        const me = await API.get("/auth/user/")
        meUser = me.data
      } catch (_) {}

      const mergedUser = { ...(meUser || {}), ...(loginUser || {}) }
      localStorage.setItem("user", JSON.stringify(mergedUser))
      setRequires2FA(false)
      routeByRole(mergedUser)
    } catch (err) {
      const msg =
        err?.response?.data?.detail || err?.response?.data?.non_field_errors?.[0] || "Invalid email or password"
      showMessage(msg, "error")
    } finally {
      if (!requires2FA) {
        setLoadingPwd(false)
      }
    }
  }

  // ----- Passkey (WebAuthn) Login -----
  const handlePasskeyLogin = async () => {
    if (!("credentials" in navigator)) {
      showMessage("WebAuthn not supported in this browser.", "error")
      return
    }

    setLoadingPk(true)
    try {
      // 1) Begin login (username-first if email provided)
      const begin = await API.post("/passkeys/begin-login/", { email: email.trim() || undefined })
      const { options, challenge_id } = begin.data || {}
      const pk = options?.publicKey || options || {}

      // 2) Normalize → ArrayBuffers; drop invalid transports
      const publicKey = {
        ...pk,
        challenge: b64uToBuf(pk.challenge),
        allowCredentials: (pk.allowCredentials || []).map((d) => ({
          type: d.type || "public-key",
          id: b64uToBuf(d.id),
          // Browser requires an array of known strings; if backend sent null/"" just omit it.
          transports: Array.isArray(d.transports) ? d.transports : undefined,
        })),
      }

      // 3) Call WebAuthn
      const cred = await navigator.credentials.get({ publicKey })
      if (!cred) throw new Error("Authentication was cancelled")

      // 4) Prepare assertion payload
      const assertion = {
        id: cred.id,
        rawId: bufToB64u(cred.rawId),
        type: cred.type,
        response: {
          clientDataJSON: bufToB64u(cred.response.clientDataJSON),
          authenticatorData: bufToB64u(cred.response.authenticatorData),
          signature: bufToB64u(cred.response.signature),
          userHandle: cred.response.userHandle ? bufToB64u(cred.response.userHandle) : null,
        },
        clientExtensionResults: cred.getClientExtensionResults?.() || {},
      }

      // 5) Finish login
      const fin = await API.post("/passkeys/finish-login/", {
        challenge_id,
        credential: JSON.stringify(assertion),
      })

      const { access, refresh, user } = fin.data || {}
      localStorage.setItem("access", access)
      localStorage.setItem("refresh", refresh)
      localStorage.setItem("user", JSON.stringify(user))
      API.defaults.headers.common["Authorization"] = `Bearer ${access}`

      showMessage("Signed in with passkey", "success")
      routeByRole(user)
    } catch (err) {
      console.error("Passkey login error:", err)
      const msg = err?.response?.data?.detail || err.message || "Passkey login failed"
      showMessage(msg, "error")
    } finally {
      setLoadingPk(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 overflow-x-hidden">
      <div
        id="messageBox"
        className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-transform transform translate-y-full opacity-0 duration-300"
      />

      <header className="bg-white border-b border-stone-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">MedMate</h1>
              <p className="text-xs text-stone-500">Clinical Drug Analysis</p>
            </div>
          </div>
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors duration-200"
            >
              Home
            </button>
            <button
              onClick={() => navigate("/anonymous-checker")}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors duration-200"
            >
              Try Free
            </button>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium">Login</button>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-6">
              <Shield className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-stone-900 mb-2">Healthcare Provider Access</h1>
            <p className="text-stone-600 leading-relaxed">
              Secure login for medical professionals to access patient drug interaction analysis and clinical tools.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 pl-11 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    placeholder="doctor@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-stone-400" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    className="w-full px-4 py-3 pl-11 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-stone-400" />
                </div>
              </div>

              {requires2FA && (
                <div>
                  <label htmlFor="totpCode" className="block text-sm font-medium text-stone-700 mb-2">
                    2FA Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="totpCode"
                      className="w-full px-4 py-3 pl-11 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter code from email"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      maxLength="6"
                      required
                    />
                    <Shield className="absolute left-3.5 top-3.5 h-5 w-5 text-stone-400" />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loadingPwd}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                  loadingPwd
                    ? "bg-emerald-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                } text-white`}
              >
                {loadingPwd ? "Authenticating..." : requires2FA ? "Verify 2FA" : "Access Dashboard"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-stone-200">
              <button
                onClick={handlePasskeyLogin}
                disabled={loadingPk}
                className={`w-full py-3 px-4 border border-stone-200 rounded-xl hover:bg-stone-50 transition-all duration-200 flex items-center justify-center gap-3 ${
                  loadingPk ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                <KeyRound className="h-5 w-5 text-stone-600" />
                <span className="text-stone-700 font-medium">{loadingPk ? "Verifying Passkey..." : "Use Passkey"}</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-stone-500">Protected by enterprise-grade security and HIPAA compliance</p>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-4">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} All rights reserved. Healthcare technology you can trust.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Login
