// src/pages/PharmacistPatientDetail.jsx
"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams } from "react-router-dom"
import API from "../services/api"

/* ---------------------------
   PubChem Autocomplete (shared)
---------------------------- */
const AUTOCOMPLETE_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/Compound"
const acCache = new Map()

function usePubChemAutocomplete(query, { limit = 12, debounceMs = 180 } = {}) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const controllerRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    const q = (query || "").trim()
    if (!q) {
      setResults([])
      setLoading(false)
      return
    }

    const key = q.toLowerCase() + `|${limit}`
    if (acCache.has(key)) {
      setResults(acCache.get(key))
      setLoading(false)
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    if (controllerRef.current) controllerRef.current.abort()

    timerRef.current = setTimeout(async () => {
      setLoading(true)
      const ctrl = new AbortController()
      controllerRef.current = ctrl
      try {
        const url = `${AUTOCOMPLETE_BASE}/${encodeURIComponent(q)}/json?limit=${limit}`
        const res = await fetch(url, { signal: ctrl.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const list = Array.isArray(data?.dictionary_terms?.compound)
          ? data.dictionary_terms.compound.slice(0, limit)
          : []
        acCache.set(key, list)
        setResults(list)
      } catch (e) {
        if (e.name !== "AbortError") setResults([])
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (controllerRef.current) controllerRef.current.abort()
    }
  }, [query, limit, debounceMs])

  return { results, loading }
}

function SuggestInput({ value, onChange, onSelect, placeholder, id, inputClass = "" }) {
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(-1)
  const { results, loading } = usePubChemAutocomplete(value)
  const wrapRef = useRef(null)

  useEffect(() => {
    setOpen(Boolean(value?.trim()) && (loading || results.length > 0))
    setHi(-1)
  }, [value, loading, results.length])

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const onKeyDown = (e) => {
    if (!open) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHi((n) => Math.min(n + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHi((n) => Math.max(n - 1, 0))
    } else if (e.key === "Enter") {
      if (hi >= 0 && results[hi]) {
        e.preventDefault()
        onSelect(results[hi])
        setOpen(false)
      }
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div className="relative w-full" ref={wrapRef}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`border rounded px-2 py-1 w-full ${inputClass}`}
        autoComplete="off"
        spellCheck="false"
      />
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {loading && <div className="px-4 py-3 text-sm text-gray-500">Searching…</div>}
          {!loading && results.length === 0 && <div className="px-4 py-3 text-sm text-gray-500">No suggestions</div>}
          {!loading &&
            results.map((name, i) => (
              <button
                key={name + i}
                type="button"
                onMouseEnter={() => setHi(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect(name)
                  setOpen(false)
                }}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  hi === i ? "bg-green-50" : "bg-white"
                } hover:bg-green-50`}
              >
                {name}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

/* ---------------------------
   Helpers
---------------------------- */
const buildPairs = (names = []) => {
  const pairs = []
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      pairs.push(`${names[i]}, ${names[j]}`)
    }
  }
  return pairs
}

const severityBadge = (sev) => {
  const s = String(sev || "").toLowerCase()
  const cls =
    s.includes("contra") || s.includes("major")
      ? "bg-red-100 text-red-800 border-red-200"
      : s.includes("moderate")
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : "bg-gray-100 text-gray-800 border-gray-200"
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {sev || "Unknown"}
    </span>
  )
}

const parseRecommendation = (raw) => {
  const text = (raw || "").trim()
  if (!text) return { items: [], bestCombination: "", sources: [] }

  const bestRe = /\?\?Best combination:\?\?\s*([\s\S]*?)(?=\n\s*(?:\?\?Sources:\?\?|$))/i
  const srcRe = /\?\?Sources:\?\?\s*([\s\S]*)/i

  const bestMatch = text.match(bestRe)
  const srcMatch = text.match(srcRe)

  const bestCombination = bestMatch?.[1]?.trim() || ""
  const sources = (srcMatch?.[1] || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)

  const head = bestMatch ? text.slice(0, bestMatch.index).trim() : text
  const items = head
    .split(/\n(?=\d+\.\s)|\n-\s|\n•\s/i)
    .map((t) => t.trim())
    .filter(Boolean)

  return { items, bestCombination, sources }
}

const PharmacistPatientDetail = () => {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)

  // prescribe form
  const [drugName, setDrugName] = useState("")
  const [dosage, setDosage] = useState("")
  const [frequency, setFrequency] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // edit
  const [editingMedId, setEditingMedId] = useState(null)
  const [editForm, setEditForm] = useState({})

  // DDI
  const [pairOptions, setPairOptions] = useState([])
  const [selectedPair, setSelectedPair] = useState("")
  const [ddiResult, setDdiResult] = useState(null)
  const [ddiLoading, setDdiLoading] = useState(false)

  const fetchPatient = useCallback(async () => {
    setLoading(true)
    try {
      const res = await API.get(`/patients/${id}/`)
      const data = res.data
      setPatient(data)

      const names = (data.medications || []).map((m) => (m.drug_name || "").trim()).filter(Boolean)
      setPairOptions(buildPairs(names))
    } catch (err) {
      console.error("❌ Failed to fetch patient:", err)
      setPatient(null)
      setPairOptions([])
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchPatient()
  }, [fetchPatient])


  // -------- prescribe --------
  const handlePrescribe = async () => {
    try {
      if (!drugName.trim() || !dosage.trim() || !frequency.trim()) {
        alert("Please fill drug name, dosage and frequency.")
        return
      }

      await API.post("/medications/", {
        patient: id,
        drug_name: drugName,
        dosage,
        frequency,
        start_date: startDate || null,
        end_date: endDate || null,
      })

      alert("✅ Medication added")
      setDrugName("")
      setDosage("")
      setFrequency("")
      setStartDate("")
      setEndDate("")
      await fetchPatient()
    } catch (err) {
      console.error("❌ Error adding medication:", err)
      alert("Failed to add medication")
    }
  }

  // -------- edit --------
  const handleEditClick = (med) => {
    setEditingMedId(med.id)
    setEditForm({
      drug_name: med.drug_name || "",
      dosage: med.dosage || "",
      frequency: med.frequency || "",
      start_date: med.start_date || "",
      end_date: med.end_date || "",
    })
  }

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditSave = async (medId) => {
    try {
      if (!editForm.drug_name?.trim() || !editForm.dosage?.trim() || !editForm.frequency?.trim()) {
        alert("Please fill drug name, dosage and frequency.")
        return
      }

      await API.put(`/medications/${medId}/`, {
        drug_name: editForm.drug_name,
        dosage: editForm.dosage,
        frequency: editForm.frequency,
        start_date: editForm.start_date || null,
        end_date: editForm.end_date || null,
        patient: id,
      })

      alert("Medication updated")
      setEditingMedId(null)
      await fetchPatient()
    } catch (err) {
      console.error("❌ Failed to update medication:", err)
      alert("Failed to update medication")
    }
  }

  const handleDeleteMedication = async (medId) => {
    try {
      await API.delete(`/medications/${medId}/`)
      alert("Medication deleted")
      await fetchPatient()
    } catch (err) {
      console.error("❌ Failed to delete medication:", err)
      alert("Failed to delete medication")
    }
  }

  // -------- DDI --------
  const handleDDICheck = async () => {
    if (!selectedPair) return
    setDdiLoading(true)
    setDdiResult(null)
    try {
      const res = await API.post("/ddi/check/", { selected_pair: selectedPair })
      const data = res?.data || {}

      const explanation = data.extended_explanation || ""
      const explanationWas429 = /(^|\n)\s*Error:\s*429\b/i.test(explanation)
      const explanationWas503 = /(^|\n)\s*Error:\s*503\b/i.test(explanation)

      setDdiResult({
        drugs:
          data.drugs ||
          (data.drug1 && data.drug2 ? `${data.drug1}, ${data.drug2}` : selectedPair),
        severity: data.severity || "Unknown",
        description: data.description || "No description provided.",
        extended_explanation: (explanationWas429 || explanationWas503) ? "" : explanation,
        _explanationWas429: explanationWas429,
        _explanationWas503: explanationWas503,
        recommendation: data.recommendation || "",
      })
    } catch (err) {
      console.error("DDI check failed:", err)
      setDdiResult({ error: "Failed to check DDI." })
    } finally {
      setDdiLoading(false)
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="text-gray-600 text-lg">Loading patient details...</span>
        </div>
      </div>
    )

  if (!patient)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Patient not found</h3>
          <p className="mt-2 text-gray-500">The patient you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{patient.full_name}</h1>
              <p className="text-gray-600 mt-1">Patient Details & Medical Records</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
              ID: {patient.patient_id}
            </span>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-8">
        {/* Patient Information Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Patient Information
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-lg font-semibold text-gray-900">{patient.full_name}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500">Gender</label>
                <p className="text-lg text-gray-900">{patient.gender || "—"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                <p className="text-lg text-gray-900">{patient.dob || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Medications Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
              Current Medications
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {patient.medications?.length || 0}
              </span>
            </h2>
          </div>
          <div className="p-6">
            {patient.medications?.length ? (
              <div className="space-y-4">
                {patient.medications.map((med) => (
                  <div
                    key={med.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-emerald-200 transition-colors"
                  >
                    {editingMedId === med.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Drug Name</label>
                          <input
                            type="text"
                            value={editForm.drug_name}
                            onChange={(e) => handleEditChange("drug_name", e.target.value)}
                            placeholder="e.g., Amoxicillin"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                            <input
                              type="text"
                              value={editForm.dosage}
                              onChange={(e) => handleEditChange("dosage", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="e.g., 500mg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                            <input
                              type="text"
                              value={editForm.frequency}
                              onChange={(e) => handleEditChange("frequency", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="e.g., twice daily"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={editForm.start_date || ""}
                              onChange={(e) => handleEditChange("start_date", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                              type="date"
                              value={editForm.end_date || ""}
                              onChange={(e) => handleEditChange("end_date", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            type="button"
                            onClick={() => handleEditSave(med.id)}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingMedId(null)}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{med.drug_name}</h3>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Dosage:</span>
                              <p className="font-medium text-gray-900">{med.dosage || "—"}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Frequency:</span>
                              <p className="font-medium text-gray-900">{med.frequency || "—"}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Start Date:</span>
                              <p className="font-medium text-gray-900">{med.start_date || "—"}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">End Date:</span>
                              <p className="font-medium text-gray-900">{med.end_date || "—"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            type="button"
                            onClick={() => handleEditClick(med)}
                            className="text-emerald-600 hover:text-emerald-700 p-2 rounded-lg hover:bg-emerald-50 transition-colors"
                            title="Edit medication"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMedication(med.id)}
                            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete medication"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No medications recorded</h3>
                <p className="mt-2 text-gray-500">Start by prescribing a medication below.</p>
              </div>
            )}
          </div>
        </div>

        {/* Drug Interaction Checker Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              Drug Interaction Checker
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Drug Pair</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={selectedPair}
                  onChange={(e) => setSelectedPair(e.target.value)}
                  disabled={ddiLoading}
                >
                  <option value="">Choose a drug pair to check for interactions</option>
                  {pairOptions.map((pair, idx) => (
                    <option key={idx} value={pair}>
                      {pair}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleDDICheck}
                disabled={!selectedPair || ddiLoading}
                className={`py-2 px-4 rounded-lg transition-colors flex items-center ${
                  ddiLoading
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                }`}
              >
                {ddiLoading ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Checking....
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Check Interaction
                  </>
                )}
              </button>
            </div>

            {ddiLoading && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center">
                  <span className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full mr-3"></span>
                  <span className="text-emerald-700 font-medium">Analyzing drug interactions...</span>
                </div>
                <p className="text-emerald-600 text-sm mt-1">Please wait while we check for potential interactions.</p>
              </div>
            )}

            {/* DDI RESULT */}
            {ddiResult && !ddiLoading && (
              <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                {ddiResult.error ? (
                  <div className="flex items-center text-red-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {ddiResult.error}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-sm font-bold text-gray-700">Drugs</label>
                      <p className="text-gray-900 font-semibold">
                        {ddiResult.drugs || selectedPair || "—"}
                      </p>
                      {severityBadge(ddiResult.severity)}
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-700">Interaction Description</label>
                      <p className="text-gray-900 mt-1 whitespace-pre-line">
                        {ddiResult.description || "No description provided."}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-700">Extended Description</label>
                      {ddiResult.extended_explanation ? (
                        <p className="text-gray-900 mt-1 whitespace-pre-line">{ddiResult.extended_explanation}</p>
                      ) : ddiResult._explanationWas429 || ddiResult._explanationWas503 ? (
                        <p className="text-gray-500 mt-1 italic">
                          Detailed mechanism is temporarily unavailable. Please try again shortly.
                        </p>
                      ) : (
                        <p className="text-gray-500 mt-1 italic">No detailed mechanism/explanation available for this pair.</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-700">Recommendation and Sources</label>
                      <div className="mt-2 bg-white border rounded-md p-4 space-y-4">
                        {(() => {
                          const { items, bestCombination, sources } = parseRecommendation(ddiResult.recommendation)
                          const hasAny = items.length > 0 || bestCombination || sources.length > 0

                          if (!hasAny) {
                            return <p className="text-sm text-gray-800 whitespace-pre-line">No recommendation provided.</p>
                          }

                          return (
                            <div>
                              {items.map((item, idx) => (
                                <div key={idx} className="border-b last:border-b-0 pb-2">
                                  <p className="text-sm text-gray-800 whitespace-pre-line">{item}</p>
                                </div>
                              ))}

                              {bestCombination && (
                                <>
                                  <hr className="my-4" />
                                  <div className="space-y-2">
                                    <p className="font-semibold text-gray-700">Best combination:</p>
                                    <p className="text-sm text-gray-800 whitespace-pre-line">{bestCombination}</p>
                                  </div>
                                </>
                              )}

                              {sources.length > 0 && (
                                <>
                                  <hr className="my-4" />
                                  <div className="space-y-2">
                                    <p className="font-semibold text-gray-700">Sources:</p>
                                    <div className="text-sm text-gray-800 space-y-1">
                                      {sources.map((line, i) => (<p key={i}>{line}</p>))}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* end DDI RESULT */}
          </div>
        </div>

        {/* Prescribe New Medication Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Prescribe New Medication
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Drug Name</label>
                <SuggestInput
                  id="pharm-presc-drug"
                  value={drugName}
                  onChange={setDrugName}
                  onSelect={setDrugName}
                  placeholder="Type drug name (e.g., Amoxicillin)"
                  inputClass="border border-gray-300 rounded-lg p-3 w-full"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
                  <input
                    type="text"
                    placeholder="e.g., 500 mg"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                  <input
                    type="text"
                    placeholder="e.g., twice daily"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handlePrescribe}
                className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Medication to Patient
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PharmacistPatientDetail