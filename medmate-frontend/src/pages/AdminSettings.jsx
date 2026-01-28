import PasskeysPanel from "../components/PasskeysPanel"

const AdminSettings = () => {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}")
    } catch {
      return {}
    }
  })()

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Settings</h1>
          <p className="text-gray-600">
            Manage your account security, system preferences, and administrative configurations.
          </p>
          {user?.email && (
            <div className="mt-3 inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Signed in as {user.email}
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Account Security */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="border-l-4 border-emerald-500 pl-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Account Security</h3>
              <p className="text-gray-600 text-sm">Manage your authentication methods and security settings</p>
            </div>
            <PasskeysPanel />
          </div>

          {/* System Preferences */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="border-l-4 border-blue-500 pl-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-900">System Preferences</h3>
              <p className="text-gray-600 text-sm">Configure your system-wide preferences and display settings</p>
            </div>

            <div className="space-y-6">
              {/* Theme Settings */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Theme & Appearance</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-emerald-300 cursor-pointer transition-colors">
                    <div className="flex items-center mb-2">
                      <svg
                        className="w-5 h-5 text-yellow-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      <span className="font-medium">Light Mode</span>
                    </div>
                    <p className="text-sm text-gray-600">Clean white interface with dark text</p>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg hover:border-emerald-300 cursor-pointer transition-colors">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-gray-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                        />
                      </svg>
                      <span className="font-medium">Dark Mode</span>
                    </div>
                    <p className="text-sm text-gray-600">Dark interface with light text</p>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg hover:border-emerald-300 cursor-pointer transition-colors">
                    <div className="flex items-center mb-2">
                      <svg
                        className="w-5 h-5 text-emerald-600 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-medium">System</span>
                    </div>
                    <p className="text-sm text-gray-600">Follow system preference</p>
                  </div>
                </div>
              </div>

              {/* Language & Region */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Language & Region</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Time Zone</label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time</option>
                      <option value="PST">Pacific Time</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="border-l-4 border-purple-500 pl-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Notification Settings</h3>
              <p className="text-gray-600 text-sm">Configure how and when you receive notifications</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">System Alerts</h4>
                  <p className="text-sm text-gray-600">Important system notifications and alerts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">Patient Updates</h4>
                  <p className="text-sm text-gray-600">Notifications about patient registrations and updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Data & Privacy */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="border-l-4 border-red-500 pl-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Data & Privacy</h3>
              <p className="text-gray-600 text-sm">Manage your data retention and privacy settings</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-red-800 mb-1">Data Export & Deletion</h4>
                    <p className="text-sm text-red-700 mb-3">
                      Export your data or permanently delete your account and all associated data.
                    </p>
                    <div className="flex space-x-3">
                      <button className="px-4 py-2 bg-white text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors font-medium">
                        Export Data
                      </button>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Changes */}
          <div className="flex items-center justify-end pt-6">
            <button className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold shadow-lg">
              Save All Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
