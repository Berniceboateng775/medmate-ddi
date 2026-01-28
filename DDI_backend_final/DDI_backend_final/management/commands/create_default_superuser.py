from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Roles

class Command(BaseCommand):
    help = 'Create default superuser if none exists'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Superuser email')
        parser.add_argument('--password', type=str, help='Superuser password')

    def handle(self, *args, **options):
        User = get_user_model()

        # Check if any superuser exists
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write('Superuser already exists. Skipping creation.')
            return

        # Default credentials (can be overridden by arguments)
        email = options.get('email') or 'admin@medmate.local'
        password = options.get('password') or 'Admin123!'

        try:
            # Create superuser
            user = User.objects.create_superuser(
                email=email,
                password=password
            )

            # Set role to admin
            user.role = Roles.ADMIN
            user.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created superuser: {email}\n'
                    f'Password: {password}\n'
                    f'Please change the password after first login!'
                )
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to create superuser: {e}')
            )