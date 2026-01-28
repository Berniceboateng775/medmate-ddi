#!/usr/bin/env python
import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'DDI_backend_final.settings')
django.setup()

from django.core.mail import send_mail

try:
    result = send_mail(
        'MedMate SendGrid Test - Success!',
        'This email confirms that SendGrid is working properly and can deliver to real email addresses.',
        'medmateorg@outlook.com',
        ['fredaacquah2003@gmail.com'],
        fail_silently=False
    )
    print(f'Email sent successfully! Result: {result}')
    print('Check your email at fredaacquah2003@gmail.com')
    print('SendGrid is now configured and working!')
except Exception as e:
    print(f'Error sending email: {e}')
    if '401' in str(e) or '403' in str(e):
        print('API key appears to be invalid. Please check your SendGrid API key in .env file.')
    import traceback
    traceback.print_exc()