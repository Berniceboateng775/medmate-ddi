"use client"

// src/pages/AnonymousChecker.jsx
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import API from "../services/api"

// notifications (unchanged)
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

/* ---------------------------
   PubChem Autocomplete Hook
   ---------------------------
   Endpoint (JSON):
   https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/Compound/<query>/json?limit=10
   Returns shape: { dictionary_terms: { compound: [ "Aspirin", "..." ] } }
   Source: PubChem REST autocomplete.  (See docs + example)
*/
const AUTOCOMPLETE_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/Compound"

const cache = new Map() // simple in-memory cache: key=queryLower -> results[]

function usePubChemAutocomplete(query, { limit = 10, debounceMs = 200 } = {}) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const controllerRef = useRef(null)
  const debounced = useRef(null)

  useEffect(() => {
    const q = (query || "").trim()
    if (!q) {
      setResults([])
      setError("")
      setLoading(false)
      return
    }

    // Cache hit
    const key = q.toLowerCase() + `|${limit}`
    if (cache.has(key)) {
      setResults(cache.get(key))
      setError("")
      setLoading(false)
      return
    }

    // Debounce + abort logic
    if (debounced.current) clearTimeout(debounced.current)
    if (controllerRef.current) controllerRef.current.abort()

    debounced.current = setTimeout(async () => {
      setLoading(true)
      setError("")

      const ctrl = new AbortController()
      controllerRef.current = ctrl

      try {
        const url = `${AUTOCOMPLETE_BASE}/${encodeURIComponent(q)}/json?limit=${limit}`
        const res = await fetch(url, { signal: ctrl.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()

        const list =
          data?.dictionary_terms?.compound && Array.isArray(data.dictionary_terms.compound)
            ? data.dictionary_terms.compound.slice(0, limit)
            : []

        cache.set(key, list)
        setResults(list)
      } catch (e) {
        if (e.name !== "AbortError") {
          setError("Autocomplete unavailable")
          setResults([])
        }
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => {
      if (debounced.current) clearTimeout(debounced.current)
      if (controllerRef.current) controllerRef.current.abort()
    }
  }, [query, limit, debounceMs])

  return { results, loading, error }
}

/* ---------------------------
   SuggestInput Component
   ---------------------------
   Props:
   - value, onChange(text)
   - onSelect(text)  // when user picks a suggestion
   - placeholder
   - id (for a11y)
*/
function SuggestInput({ value, onChange, onSelect, placeholder, id }) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)

  const { results, loading } = usePubChemAutocomplete(value, { limit: 12, debounceMs: 180 })

  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Open popup if there are suggestions and user has focus
  useEffect(() => {
    setOpen(Boolean(value?.trim()) && (loading || results.length > 0))
    setHighlight(-1) // reset highlight as list changes
  }, [value, loading, results.length])

  // Click outside to close
  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target)) {
        setOpen(false)
        setHighlight(-1)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  const handleKeyDown = (e) => {
    if (!open) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === "Enter") {
      if (highlight >= 0 && results[highlight]) {
        e.preventDefault()
        onSelect(results[highlight])
        setOpen(false)
      }
    } else if (e.key === "Escape") {
      setOpen(false)
      setHighlight(-1)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        id={id}
        ref={inputRef}
        type="text"
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck="false"
      />

      {open && (
        <div className="absolute z-30 mt-2 w-full max-h-64 overflow-auto rounded-lg border border-gray-300 bg-white shadow-2xl">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-600 flex items-center">
              <span className="animate-spin w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full mr-2"></span>
              Searching database...
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">No compounds found</div>
          )}

          {!loading &&
            results.map((name, idx) => (
              <button
                key={name + idx}
                type="button"
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect(name)
                  setOpen(false)
                }}
                className={`block w-full text-left px-4 py-3 text-sm transition-colors ${
                  highlight === idx
                    ? "bg-emerald-50 text-emerald-700 border-l-2 border-emerald-500"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {name}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

export default function AnonymousCheckerPage() {
  const navigate = useNavigate()
  const [drugs, setDrugs] = useState(["", ""])
  const [pairs, setPairs] = useState([])
  const [selectedPair, setSelectedPair] = useState("")
  const [interactionResult, setInteractionResult] = useState(null)
  const [loadingInteraction, setLoadingInteraction] = useState(false)

  // original logic preserved
  const handleDrugChange = (index, value) => {
    const updated = [...drugs]
    updated[index] = value
    setDrugs(updated)
  }

  const handleSelectSuggestion = (index, text) => {
    const updated = [...drugs]
    updated[index] = text
    setDrugs(updated)
  }

  const handleAddDrugField = () => setDrugs([...drugs, ""])

  const handleRemoveDrugField = (index) => {
    if (drugs.length > 2) setDrugs(drugs.filter((_, i) => i !== index))
    else showMessage("At least two drug fields are required.", "error")
  }

  const generateDrugPairs = () => {
    const valid = drugs.map((d) => d.trim()).filter(Boolean)
    if (valid.length < 2) {
      showMessage("Please enter at least two valid drugs.", "error")
      return
    }
    // de-dup names (case-insensitive)
    const uniq = Array.from(new Map(valid.map((v) => [v.toLowerCase(), v])).values())

    if (uniq.length < 2) {
      showMessage("Please enter at least two distinct drugs.", "error")
      return
    }

    const combos = []
    for (let i = 0; i < uniq.length; i++) {
      for (let j = i + 1; j < uniq.length; j++) combos.push(`${uniq[i]}, ${uniq[j]}`)
    }
    setPairs(combos)
    setSelectedPair("")
    setInteractionResult(null)
  }

  const handleCheckInteraction = async () => {
    if (!selectedPair) {
      showMessage("Please select a drug pair to check.", "error")
      return
    }
    setLoadingInteraction(true)
    setInteractionResult(null)
    try {
      const res = await API.post("/ddi/check/", { selected_pair: selectedPair })
      setInteractionResult({
        drugs: selectedPair,
        severity: res?.data?.severity || "Unknown",
        description: res?.data?.description || "No description provided.",
        explanation: res?.data?.extended_explanation || "No explanation available.",
        recommendation: res?.data?.recommendation || "No recommendation provided.",
      })
      showMessage("Interaction checked successfully!", "success")
    } catch (err) {
      console.error("Interaction check failed:", err)
      setInteractionResult({ error: "Failed to check DDI." })
      showMessage("Failed to check interaction", "error")
    } finally {
      setLoadingInteraction(false)
    }
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

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-inter overflow-x-hidden max-w-full">
      <div
        id="messageBox"
        className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-transform transform translate-y-full opacity-0 duration-300"
      />

      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-gray-900">MedMate</span>
            </div>
            <nav className="flex items-center gap-6">
              <button
                onClick={() => navigate("/")}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => navigate("/login")}
                className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors font-medium"
              >
                Login
              </button>
            </nav>
          </div>
        </div>
      </header>

      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
              Clinical AI-Powered Analysis
            </div>
            <h2 className="text-4xl sm:text-6xl font-bold mb-6 text-white">Drug Interaction Checker</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Advanced pharmaceutical analysis powered by clinical databases and AI algorithms. Identify potential drug
              interactions with medical-grade precision.
            </p>
          </div>
        </div>
      </section>

      <section className="flex-1 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-2 gap-12">
          {/* Enhanced input panel */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                <h3 className="text-white font-semibold flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  DRUG INTERACTION ANALYSIS
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {drugs.map((drug, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <label htmlFor={`drug-${index}`} className="sr-only">
                        Drug {index + 1}
                      </label>

                      <div className="flex-1">
                        <SuggestInput
                          id={`drug-${index}`}
                          value={drug}
                          onChange={(text) => handleDrugChange(index, text)}
                          onSelect={(text) => handleSelectSuggestion(index, text)}
                          placeholder={`Enter drug ${index + 1} name`}
                        />
                      </div>

                      {drugs.length > 2 && (
                        <button
                          onClick={() => handleRemoveDrugField(index)}
                          className="h-12 w-12 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-200 flex items-center justify-center"
                          aria-label={`Remove Drug ${index + 1}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={handleAddDrugField}
                    className="px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-all duration-200 font-medium"
                  >
                    + Add Drug
                  </button>
                  <button
                    onClick={generateDrugPairs}
                    className="px-6 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200 font-medium"
                  >
                    Generate Pairs
                  </button>
                </div>

                {pairs.length > 0 && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Drug Pair for Analysis
                    </label>
                    <select
                      value={selectedPair}
                      onChange={(e) => setSelectedPair(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">— Choose pair for analysis —</option>
                      {pairs.map((pair, idx) => (
                        <option key={idx} value={pair}>
                          {pair}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={handleCheckInteraction}
                  disabled={loadingInteraction}
                  className={`mt-6 w-full py-4 text-white rounded-lg text-lg font-semibold transition-all duration-200 ${
                    loadingInteraction
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg hover:shadow-emerald-500/25"
                  }`}
                >
                  {loadingInteraction ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                      Analyzing Interactions...
                    </span>
                  ) : (
                    "Analyze Drug Interactions"
                  )}
                </button>

                <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-xs text-gray-600 mb-1">
                    <span className="text-emerald-600 font-semibold">💡 Pro Tip:</span> Start typing to see PubChem
                    database suggestions
                  </p>
                  <p className="text-xs text-gray-600">
                    Supports 2-5 drugs • Real-time autocomplete • Clinical-grade accuracy
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></span>
                Clinical Features
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mt-0.5">
                    <span className="text-emerald-600 text-sm">🧬</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">AI-Powered Analysis</h4>
                    <p className="text-gray-600 text-sm">
                      Advanced algorithms analyze molecular interactions and clinical data
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mt-0.5">
                    <span className="text-emerald-600 text-sm">⚡</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Real-time Results</h4>
                    <p className="text-gray-600 text-sm">Instant analysis with detailed severity classifications</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mt-0.5">
                    <span className="text-emerald-600 text-sm">🛡️</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Safety First</h4>
                    <p className="text-gray-600 text-sm">Clinical recommendations and safety protocols included</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mt-0.5">
                    <span className="text-emerald-600 text-sm">📊</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Comprehensive Database</h4>
                    <p className="text-gray-600 text-sm">Access to 50,000+ drug compounds and interactions</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Healthcare Provider Access</h3>
              <p className="text-gray-700 text-sm mb-4">
                For healthcare providers: Login to access patient drug profiles, detailed clinical reports, and advanced
                analysis tools for comprehensive patient care.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-all duration-200"
              >
                Provider Login
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></span>
              Analysis Results
            </h3>
          </div>

          <div className="p-6">
            {!interactionResult && !loadingInteraction && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-2xl">🔬</span>
                </div>
                <p className="text-gray-500">No analysis results yet. Add drugs, generate pairs, and run analysis.</p>
              </div>
            )}

            {loadingInteraction && (
              <div className="py-12">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            )}

            {interactionResult &&
              (interactionResult.error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <span className="font-semibold">Analysis Error:</span> {interactionResult.error}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-gray-600">Drug Pair:</div>
                    <div className="font-semibold text-gray-900">{interactionResult.drugs}</div>
                    {severityBadge(interactionResult.severity)}
                  </div>

                  <div className="grid gap-6">
                    <div className="bg-emerald-50 rounded-lg p-4 border-l-4 border-emerald-500">
                      <h4 className="font-semibold text-gray-900 mb-2">Interaction Description</h4>
                      <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                        {interactionResult.description}
                      </p>
                    </div>

                    <div className="bg-emerald-50 rounded-lg p-4 border-l-4 border-emerald-500">
                      <h4 className="font-semibold text-gray-900 mb-2">Extended Description</h4>
                      <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                        {interactionResult.explanation}
                      </p>
                    </div>

                    <div className="bg-emerald-50 rounded-lg p-4 border-l-4 border-emerald-500">
                      <h4 className="font-semibold text-gray-900 mb-2">Recommendations and Sources</h4>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                        {interactionResult.recommendation &&
                          (() => {
                            const raw = interactionResult.recommendation
                            const [recommendationsPart] = raw.split("**Best combination:**")
                            const bestComboMatch = raw.match(/\*\*Best combination:\*\*(.*?)\*\*Sources:\*\*/s)
                            const sourcesMatch = raw.match(/\*\*Sources:\*\*(.*)/s)

                            const bestCombination = bestComboMatch?.[1]?.trim() || ""
                            const sources = sourcesMatch?.[1]?.trim().split("\n") || []

                            const recommendationItems = recommendationsPart
                              .split(/\n(?=\d+\.\sname:)/)
                              .filter(Boolean)
                              .map((item) => item.trim())

                            return (
                              <div>
                                {recommendationItems.map((item, idx) => (
                                  <div key={idx} className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0">
                                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">{item}</p>
                                  </div>
                                ))}

                                {bestCombination && (
                                  <>
                                    <hr className="my-4 border-gray-200" />
                                    <div className="space-y-2">
                                      <p className="font-semibold text-emerald-600">Optimal Combination:</p>
                                      <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                                        {bestCombination}
                                      </p>
                                    </div>
                                  </>
                                )}

                                {sources.length > 0 && (
                                  <>
                                    <hr className="my-4 border-gray-200" />
                                    <div className="space-y-2">
                                      <p className="font-semibold text-emerald-600">Clinical Sources:</p>
                                      <div className="text-gray-700 space-y-1">
                                        {sources.map((line, i) => (
                                          <p key={i} className="text-sm">
                                            {line.trim()}
                                          </p>
                                        ))}
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
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm">!</span>
            </div>
            <div>
              <h4 className="font-semibold text-red-700 mb-2">Medical Disclaimer</h4>
              <p className="text-red-600 text-sm leading-relaxed">
                This tool provides educational information only. Absence of detected interactions does not guarantee
                safety. Always consult healthcare professionals before making medication decisions. Not a substitute for
                professional medical advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 space-y-12 bg-gray-50">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Clinical Education Center</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Understanding drug interactions is crucial for safe medication management. Learn about the science behind
            pharmaceutical interactions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-emerald-600 text-xl">📋</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">What are Drug Interactions?</h4>
            <p className="text-gray-600 leading-relaxed">
              Drug interactions occur when one medication affects the activity of another, potentially altering
              effectiveness or increasing side effects through pharmacokinetic or pharmacodynamic mechanisms.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-emerald-600 text-xl">⚗️</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">Interaction Mechanisms</h4>
            <div className="space-y-2 text-gray-600">
              <p>
                <span className="text-emerald-600 font-semibold">Pharmacokinetic:</span> Absorption, distribution,
                metabolism, excretion changes
              </p>
              <p>
                <span className="text-emerald-600 font-semibold">Pharmacodynamic:</span> Additive, synergistic, or
                antagonistic effects
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-emerald-600 text-xl">🎯</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">Clinical Management</h4>
            <p className="text-gray-600 leading-relaxed">
              Management strategies include dose adjustments, timing modifications, therapeutic monitoring, or
              alternative medication selection based on interaction severity and patient factors.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h4 className="text-2xl font-bold text-gray-900 mb-6">Severity Classifications</h4>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold">
                MINOR
              </span>
              <span className="text-gray-600">Monitoring may be required</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-semibold">
                MODERATE
              </span>
              <span className="text-gray-600">Caution and adjustments advised</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
                MAJOR
              </span>
              <span className="text-gray-600">Avoid or substitute when possible</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 border-t border-slate-700 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-slate-400">© {new Date().getFullYear()} MedMate. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => navigate("/")} className="text-slate-400 hover:text-white transition-colors">
                Home
              </button>
              <span className="text-slate-600">•</span>
              <button onClick={() => navigate("/login")} className="text-slate-400 hover:text-white transition-colors">
                Login
              </button>
              <span className="text-slate-600">•</span>
              <span className="text-slate-500 text-sm">Clinical Grade Analysis</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
