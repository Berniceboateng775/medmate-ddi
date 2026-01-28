# accounts/emails.py
from django.conf import settings
from django.core.mail import send_mail

def send_invitation_email(email: str, code: str, invite_type: str):
    # Make sure FRONTEND_ORIGIN is http://localhost:5173 in settings/.env
    base = getattr(settings, "FRONTEND_ORIGIN", "http://localhost:5173").rstrip("/")
    invite_url = f"{base}/invite/{code}"  # ✅ matches your React route

    subject = f"You're invited to join MedMate as {invite_type.title()}"
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #10b981; margin: 0;">MedMate Invitation</h2>
            <p style="margin: 5px 0 0 0; color: #6b7280;">Healthcare Technology Platform</p>
        </div>

        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="color: #111827; margin-top: 0;">You're Invited to Join MedMate</h3>

            <p style="color: #374151; line-height: 1.6;">
                You've been invited to join MedMate as a <strong>{invite_type.title()}</strong>.
                This invitation gives you access to our comprehensive healthcare technology platform.
            </p>

            <div style="background-color: #f3f4f6; border: 2px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <a href="{invite_url}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Accept Invitation
                </a>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
                This invitation link will expire in 36 hours. If you didn't expect this invitation, you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{invite_url}" style="color: #10b981;">{invite_url}</a>
            </p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            © 2025 MedMate. All rights reserved.
        </div>
    </body>
    </html>
    """
    text_message = f"""
    You're invited to join MedMate as {invite_type.title()}

    You've been invited to join MedMate as a {invite_type}.

    Click the secure link to set up your account:
    {invite_url}

    This link will expire in 36 hours. If you didn't expect this invitation, ignore this email.
    """

    send_mail(
        subject,
        text_message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        html_message=html_message,
        fail_silently=False
    )


def send_2fa_code(email: str, code: str):
    subject = "Your MedMate Security Code"
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #10b981; margin: 0;">MedMate Security</h2>
            <p style="margin: 5px 0 0 0; color: #6b7280;">Healthcare Technology</p>
        </div>

        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="color: #111827; margin-top: 0;">Your Two-Factor Authentication Code</h3>

            <p style="color: #374151; line-height: 1.6;">
                For your security, we've sent you a verification code. Please enter this code to complete your login.
            </p>

            <div style="background-color: #f3f4f6; border: 2px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <div style="font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 4px;">{code}</div>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
                This code will expire in 10 minutes. If you didn't request this code, please contact support immediately.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
                If you're having trouble, contact our support team at support@medmate.com
            </p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            © 2025 MedMate. All rights reserved.
        </div>
    </body>
    </html>
    """
    text_message = f"""
    Your MedMate Security Code

    Your two-factor authentication code is: {code}

    This code will expire in 10 minutes.

    If you didn't request this code, please secure your account immediately.
    """

    send_mail(
        subject,
        text_message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        html_message=html_message,
        fail_silently=False
    )
