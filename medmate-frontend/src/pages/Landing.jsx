"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"

const colors = {
  primaryGreen: "#10B981", // Modern emerald green
  darkGreen: "#059669",
  lightGreen: "#D1FAE5",
  accentRed: "#EF4444", // Small red accents
  darkBg: "#0F172A", // Dark slate
  mediumBg: "#1E293B",
  lightBg: "#F8FAFC",
  white: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textLight: "#94A3B8",
}

const showMessage = (message, type = "info") => {
  const messageBox = document.getElementById("messageBox")
  if (messageBox) {
    messageBox.textContent = message
    messageBox.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-transform transform ${
      type === "error"
        ? "bg-red-500 text-white"
        : type === "success"
          ? "bg-green-500 text-white"
          : "bg-blue-500 text-white"
    } translate-y-0 opacity-100`
    setTimeout(() => {
      messageBox.classList.add("translate-y-full", "opacity-0")
    }, 3000)
  }
}

const Landing = () => {
  const navigate = useNavigate()
  const [stats] = useState([
    { value: "99.7%", label: "Accuracy Rate", description: "AI-powered drug interaction detection" },
    { value: "2.3M+", label: "Interactions Checked", description: "Trusted by healthcare professionals" },
    { value: "<0.5s", label: "Response Time", description: "Real-time safety analysis" },
    { value: "15K+", label: "Drug Database", description: "Comprehensive medication coverage" },
  ])

  const [features] = useState([
    {
      icon: "🧬",
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms analyze complex drug interactions with clinical precision.",
      highlight: "Clinical Grade",
    },
    {
      icon: "⚡",
      title: "Real-Time Checking",
      description: "Instant drug interaction analysis with comprehensive safety recommendations.",
      highlight: "Sub-second",
    },
    {
      icon: "🛡️",
      title: "Safety First",
      description: "Evidence-based recommendations with severity levels and alternative suggestions.",
      highlight: "FDA Compliant",
    },
    {
      icon: "📊",
      title: "Clinical Insights",
      description: "Detailed interaction mechanisms, contraindications, and monitoring requirements.",
      highlight: "Evidence-Based",
    },
    {
      icon: "🔄",
      title: "Smart Alternatives",
      description: "AI-driven suggestions for safer medication alternatives when interactions are detected.",
      highlight: "Intelligent",
    },
    {
      icon: "👥",
      title: "Multi-User Support",
      description: "Designed for doctors, pharmacists, and patients with role-based access controls.",
      highlight: "Professional",
    },
  ])

  return (
    <div className="min-h-screen bg-white font-inter overflow-x-hidden max-w-full">
      <div
        id="messageBox"
        className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-transform transform translate-y-full opacity-0 duration-300"
      ></div>

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">MedMate</h1>
            <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
              Clinical AI
            </span>
          </div>
          <nav className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 text-gray-700 hover:text-emerald-600 font-medium transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => navigate("/anonymous-checker")}
              className="px-4 py-2 text-gray-700 hover:text-emerald-600 font-medium transition-colors"
            >
              Try Free
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
            >
              Login
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, ${colors.primaryGreen} 2px, transparent 2px), radial-gradient(circle at 75% 75%, ${colors.primaryGreen} 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
              Clinical-Grade Drug Interaction Checker
            </div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              The AI Platform for
              <span className="block bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                Medication Safety
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
              Advanced AI-powered drug interaction analysis trusted by healthcare professionals. Detect interactions,
              find alternatives, and ensure patient safety with clinical precision.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button
                onClick={() => navigate("/anonymous-checker")}
                className="px-8 py-4 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-400 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Check Interactions Free
              </button>
              <button
                onClick={() => navigate("/login")}
                className="px-8 py-4 bg-transparent border border-gray-600 text-white rounded-xl font-semibold hover:border-gray-400 transition-colors"
              >
                Professional Access
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-emerald-400 mb-2">{stat.value}</div>
                  <div className="text-white font-semibold mb-1">{stat.label}</div>
                  <div className="text-gray-400 text-sm">{stat.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Clinical-Grade Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything healthcare professionals need to ensure medication safety and optimize patient care.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-white border border-gray-200 rounded-2xl hover:border-emerald-200 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="text-4xl">{feature.icon}</div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                    {feature.highlight}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-emerald-50 to-emerald-100">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Enhance Patient Safety?</h2>
          <p className="text-xl text-gray-700 mb-12">
            Join thousands of healthcare professionals using MedMate for safer medication management.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/anonymous-checker")}
              className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg"
            >
              Check Interactions Now
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Professional Login
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-300 overflow-x-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300" />

        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid gap-12 md:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold">M</span>
                </div>
                <h4 className="text-white text-xl font-bold">MedMate</h4>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                Clinical-grade AI for medication safety. Trusted by healthcare professionals worldwide.
              </p>

              <div className="flex items-center gap-3">
                <button
                  className="p-2 rounded-lg border border-gray-700 hover:border-gray-500 hover:bg-gray-800 transition"
                  onClick={() => window.open("https://github.com", "_blank")}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.85 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05.8-.23 1.66-.35 2.52-.35.86 0 1.72.12 2.52.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.64 1.03 2.76 0 3.94-2.34 4.8-4.57 5.06.36.32.68.95.68 1.92 0 1.39-.01 2.5-.01 2.84 0 .27.18.6.69.49A10.06 10.06 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  className="p-2 rounded-lg border border-gray-700 hover:border-gray-500 hover:bg-gray-800 transition"
                  onClick={() => (window.location.href = "mailto:support@medmate.app")}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Product */}
            <div>
              <h5 className="text-white font-semibold mb-4">Product</h5>
              <ul className="space-y-3 text-sm">
                <li>
                  <button onClick={() => navigate("/anonymous-checker")} className="hover:text-white transition-colors">
                    Free Checker
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/login")} className="hover:text-white transition-colors">
                    For Doctors
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/login")} className="hover:text-white transition-colors">
                    For Pharmacists
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/login")} className="hover:text-white transition-colors">
                    Admin Portal
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h5 className="text-white font-semibold mb-4">Resources</h5>
              <ul className="space-y-3 text-sm">
                <li>
                  <button
                    onClick={() => showMessage("Documentation coming soon")}
                    className="hover:text-white transition-colors"
                  >
                    API Docs
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => showMessage("Clinical guides coming soon")}
                    className="hover:text-white transition-colors"
                  >
                    Clinical Guides
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => showMessage("Research coming soon")}
                    className="hover:text-white transition-colors"
                  >
                    Research
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => showMessage("Support coming soon")}
                    className="hover:text-white transition-colors"
                  >
                    Support
                  </button>
                </li>
              </ul>
            </div>

            {/* Stay Updated */}
            <div>
              <h5 className="text-white font-semibold mb-4">Stay Updated</h5>
              <p className="text-gray-400 text-sm mb-4">Clinical updates and safety alerts.</p>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  const email = e.currentTarget.elements.namedItem("email")?.value || ""
                  if (!String(email).includes("@")) return showMessage("Enter a valid email", "error")
                  showMessage("Subscribed successfully!", "success")
                  e.currentTarget.reset()
                }}
              >
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <span>© {new Date().getFullYear()} MedMate</span>
              <button
                onClick={() => showMessage("Terms coming soon")}
                className="hover:text-gray-200 transition-colors"
              >
                Terms
              </button>
              <button
                onClick={() => showMessage("Privacy coming soon")}
                className="hover:text-gray-200 transition-colors"
              >
                Privacy
              </button>
            </div>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-700 hover:border-gray-500 hover:bg-gray-800 transition"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M12 4l-7 7h4v9h6v-9h4l-7-7z" />
              </svg>
              Back to top
            </button>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  )
}

export default Landing
