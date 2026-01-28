"use client"

import { useMemo, useState } from "react"
import API from "../services/api"

const FRONTEND_ORIGIN = import.meta.env.VITE_FRONTEND_ORIGIN || window.location.origin // e.g. http://localhost:5173

const ROLES = ["DOCTOR", "PHARMACIST", "NURSE"] // matches backend Roles

const emailRegex =
  // simple validation is fine for admin UI
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseEmails(input) {
  return Array.from(
    new Set(
      (input || "")
        .split(/[\s,;\n]+/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0),
    ),
  )
}

export default function RegisterUser() {
  const [role, setRole] = useState("DOCTOR")
  const [emailsInput, setEmailsInput] = useState("")
  const [sending, setSending] = useState(false)
  const [rows, setRows] = useState([]) // [{email, status, code, link, error}]

  const emails = useMemo(() => parseEmails(emailsInput), [emailsInput])

  const onInvite = async (e) => {
    e.preventDefault()
    if (!emails.length) return

    setSending(true)
    setRows([])

    // invite each email; show results
    const results = []
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        results.push({ email, status: "invalid", error: "Invalid email format" })
        continue
      }
      try {
        const { data } = await API.post("/admin/invitations/professional/", {
          email,
          professional_role: role, // backend expects UPPERCASE role
        })
        // Expect { code, invite_type, email, role, hospital, ... }
        const code = data?.code
        const link = code ? `${FRONTEND_ORIGIN}/invite/${code}` : ""
        results.push({ email, status: "ok", code, link })
      } catch (err) {
        const detail =
          err?.response?.data?.detail ||
          Object.entries(err?.response?.data || {})
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join(" | ") ||
          "Failed to send invite"
        results.push({ email, status: "error", error: detail })
      }
    }

    setRows(results)
    setSending(false)
  }

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      alert("Copied to clipboard")
    } catch {
      // fallback
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      alert("Copied")
    }
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invite Healthcare Professionals</h1>
          <p className="text-gray-600">
            Send invitation links to doctors, pharmacists, or nurses. Invited users will complete their registration and
            get auto-linked to your hospital.
          </p>
        </div>

        <form onSubmit={onInvite} className="space-y-8">
          {/* Role Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="border-l-4 border-emerald-500 pl-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Professional Role</h3>
              <p className="text-gray-600 text-sm">Select the role for the professionals you want to invite</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    role === r
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                      : "bg-white border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50"
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {r === "DOCTOR" && (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7v-2m6 12H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                    {r === "PHARMACIST" && (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                    {r === "NURSE" && (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-3.86.517l-.318.158a4.5 4.5 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="font-semibold">{r}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Email Input */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="border-l-4 border-blue-500 pl-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Email Addresses</h3>
              <p className="text-gray-600 text-sm">Enter one or more email addresses to send invitations</p>
            </div>

            <div className="space-y-4">
              <textarea
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Enter one or more emails. You can separate by commas, spaces, or new lines.&#10;&#10;Example:&#10;doctor1@hospital.com&#10;doctor2@hospital.com, nurse@hospital.com"
                value={emailsInput}
                onChange={(e) => setEmailsInput(e.target.value)}
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Parsed: <span className="font-semibold text-emerald-600">{emails.length}</span> email
                  {emails.length === 1 ? "" : "s"}
                </span>
                <span className="text-gray-500">
                  Endpoint: <code className="bg-gray-100 px-2 py-1 rounded">/api/admin/invitations/professional/</code>
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={sending || emails.length === 0}
              className={`inline-flex items-center px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
                sending || emails.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl"
              }`}
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending Invitations...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  Send {emails.length} Invitation{emails.length === 1 ? "" : "s"}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Results Section */}
        {rows.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="border-l-4 border-green-500 pl-4 mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Invitation Results</h3>
                <p className="text-gray-600 text-sm">Review the status of sent invitations</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email Address</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Invite Code</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Invite Link</th>
                      <th className="py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{r.email}</td>
                        <td className="py-3 px-4">
                          {r.status === "ok" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Sent
                            </span>
                          )}
                          {r.status === "invalid" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Invalid
                            </span>
                          )}
                          {r.status === "error" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.782 0-2.674-2.154-1.414-3.414L12 7.636l1.293-1.293a1 1 0 001.414-1.414L11.414 10l1.293 1.293a1 1 0 00-1.414 1.414L10 8.586 8.257 3.099z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-sm">{r.code || "—"}</td>
                        <td className="py-3 px-4">
                          {r.link ? (
                            <a
                              href={r.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 hover:underline text-sm"
                            >
                              View Invitation Link
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {r.link ? (
                            <button
                              onClick={() => copy(r.link)}
                              className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              Copy
                            </button>
                          ) : r.error ? (
                            <span className="text-red-600 text-sm">{r.error}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bulk Actions */}
              {rows.some((r) => r.code) && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() =>
                      copy(
                        rows
                          .filter((r) => r.email && r.code)
                          .map((r) => `${r.email},${r.code},${r.link || ""}`)
                          .join("\n"),
                      )
                    }
                    className="inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy All Results (CSV)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
