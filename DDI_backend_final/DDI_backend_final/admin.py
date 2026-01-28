from django.contrib import admin

# Customize the admin site
admin.site.site_header = "MedMate Admin"
admin.site.site_title = "MedMate Admin"
admin.site.index_title = "Welcome to MedMate Admin"

# Add custom CSS for green and white theme
class MedMateAdminSite(admin.AdminSite):
    site_header = "MedMate Admin"
    site_title = "MedMate Admin"
    index_title = "Welcome to MedMate Admin"

    def each_context(self, request):
        context = super().each_context(request)
        context['custom_css'] = """
        <style>
        /* Green and White Theme for Django Admin */

        /* Header */
        #site-name a {
            color: #ffffff !important;
            text-decoration: none;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
        }

        #site-name a::before {
            content: "";
            background-image: url("/static/admin/Medmate%20logo.jpg");
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            width: 40px;
            height: 40px;
            display: inline-block;
        }

        #site-name {
            background: #16a34a !important;
            padding: 10px 15px;
            margin: 0;
        }

        #user-tools {
            background: #16a34a !important;
        }

        /* Navigation */
        #nav-sidebar .current-model {
            background: #dcfce7 !important;
        }

        #nav-sidebar .current-model a {
            color: #166534 !important;
        }

        #nav-sidebar a {
            color: #374151 !important;
        }

        #nav-sidebar a:hover {
            background: #f0fdf4 !important;
            color: #166534 !important;
        }

        /* Buttons */
        .button, input[type="submit"], input[type="button"], .submit-row input {
            background: #16a34a !important;
            color: #ffffff !important;
            border: 1px solid #16a34a !important;
        }

        .button:hover, input[type="submit"]:hover, input[type="button"]:hover, .submit-row input:hover {
            background: #15803d !important;
            border-color: #15803d !important;
        }

        /* Links */
        a:link, a:visited {
            color: #16a34a !important;
        }

        a:hover, a:focus, a:active {
            color: #15803d !important;
        }

        /* Table headers */
        th {
            background: #f0fdf4 !important;
            color: #166534 !important;
        }

        /* Form elements */
        input[type="text"], input[type="password"], input[type="email"], input[type="url"],
        input[type="number"], input[type="search"], input[type="tel"], textarea, select {
            border: 1px solid #d1d5db !important;
        }

        input[type="text"]:focus, input[type="password"]:focus, input[type="email"]:focus,
        input[type="url"]:focus, input[type="number"]:focus, input[type="search"]:focus,
        input[type="tel"]:focus, textarea:focus, select:focus {
            border-color: #16a34a !important;
            box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1) !important;
        }

        /* Success messages */
        .success {
            background: #dcfce7 !important;
            border-color: #bbf7d0 !important;
            color: #166534 !important;
        }

        /* Error messages */
        .error, .errornote {
            background: #fef2f2 !important;
            border-color: #fecaca !important;
            color: #dc2626 !important;
        }

        /* Module headers */
        .module h2, .module caption, .inline-group h2 {
            background: #f0fdf4 !important;
            color: #166534 !important;
            border-bottom: 1px solid #bbf7d0 !important;
        }

        /* Welcome message */
        #content-main .module h2:first-child {
            background: #16a34a !important;
            color: #ffffff !important;
            border-bottom: none !important;
        }
        </style>
        """
        return context

# Create the custom admin site
admin_site = MedMateAdminSite()

# Register existing models with the custom admin site
from accounts.admin import *
from patients.admin import *
from drugs.admin import *
from prescriptions.admin import *
from interactions.admin import *
from notifications.admin import *

# Re-register all models with the custom admin site
admin_site.register(Hospital, HospitalAdmin)
admin_site.register(Invitation, InvitationAdmin)
admin_site.register(User, UserAdmin)
admin_site.register(AdminProfile, AdminProfileAdmin)
admin_site.register(ProfessionalProfile, ProfessionalProfileAdmin)
admin_site.register(PasskeyCredential)