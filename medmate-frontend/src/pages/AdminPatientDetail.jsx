"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import API from "../services/api"

const AdminPatientDetail = () => {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()

  // ------- helpers -------
  const meds = useMemo(() => {
    if (!patient) return []
    return patient.medications || patient.drugs || []
  }, [patient])

  const medDisplayName = (m) => (m.drug_name || m.drug?.name || m.drug || "").trim()

  // ------- data loaders -------
  const fetchPatient = useCallback(async () => {
    setLoading(true)
    try {
      const res = await API.get(`/patients/${id}/`)
      setPatient(res.data)
    } catch (err) {
      console.error("❌ Failed to fetch patient:", err)
      setPatient(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchPatient()
  }, [fetchPatient])

  const handleDeletePatient = async () => {
    setDeleting(true)
    try {
      await API.delete(`/patients/${id}/`)
      navigate("/admin/patients")
    } catch (error) {
      console.error("Failed to delete patient:", error)
      alert("Failed to delete patient. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600">Loading patient details...</span>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Not Found</h3>
          <p className="text-gray-600 mb-4">The requested patient could not be found.</p>
          <button
            onClick={() => navigate("/admin/patients")}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Patients
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/admin/patients")}
              className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {(patient.full_name || "U").charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{patient.full_name}</h2>
              <p className="text-gray-600">Patient ID: {patient.patient_id || "Not assigned"}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/admin/patient/${id}/edit`)}
              className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Patient
            </button>
            <button
              onClick={() => setDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete Patient
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                <p className="text-gray-900 font-semibold">{patient.full_name || "—"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Gender</label>
                <p className="text-gray-900">{patient.gender || "—"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                <p className="text-gray-900">{patient.dob ? new Date(patient.dob).toLocaleDateString() : "—"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Blood Type</label>
                <p className="text-gray-900">{patient.blood_type || "—"}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                <p className="text-gray-900">{patient.phone || "—"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                <p className="text-gray-900">{patient.email || "—"}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Emergency Contact</label>
                <p className="text-gray-900">{patient.emergency_contact || "—"}</p>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Allergies</label>
                <p className="text-gray-900">{patient.allergies || "No known allergies"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Past Adverse Reactions</label>
                <p className="text-gray-900">{patient.past_adverse_reactions || "No known adverse reactions"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Medical Conditions</label>
                <p className="text-gray-900">{patient.medical_conditions || "No known medical conditions"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Genetic Information</label>
                <p className="text-gray-900">{patient.genetic_info || "No genetic information available"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Physical Measurements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Measurements</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Weight</span>
                <span className="font-semibold text-gray-900">
                  {patient.weight_kg ? `${patient.weight_kg} kg` : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Height</span>
                <span className="font-semibold text-gray-900">
                  {patient.height_cm ? `${patient.height_cm} cm` : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">BMI</span>
                <span className="font-semibold text-gray-900">
                  {patient.weight_kg && patient.height_cm
                    ? (patient.weight_kg / Math.pow(patient.height_cm / 100, 2)).toFixed(1)
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Current Medications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Current Medications</h3>
            </div>

            {meds.length > 0 ? (
              <div className="space-y-4">
                {meds.map((med) => (
                  <div key={med.id} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">{medDisplayName(med)}</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Dosage:</strong> {med.dosage || "—"}
                      </p>
                      <p>
                        <strong>Frequency:</strong> {med.frequency || "—"}
                      </p>
                      <p>
                        <strong>Duration:</strong> {med.start_date || "—"} → {med.end_date || "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="w-12 h-12 text-gray-300 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
                <p>No medications recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Patient</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{patient.full_name}</strong>? This action cannot be undone and
                will remove all associated medical records.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePatient}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete Patient"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPatientDetail
