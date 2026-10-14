import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_admin_project.settings')
django.setup()

from django.core.management import call_command
from django.contrib.auth import get_user_model

def setup_django():
    print("Running Django migrations...")
    call_command('migrate', interactive=False)
    
    User = get_user_model()
    username = 'admin'
    email = 'admin@hrms.com'
    password = 'admin123'
    
    if not User.objects.filter(username=username).exists():
        print(f"Creating Django superuser: {username} ...")
        User.objects.create_superuser(username=username, email=email, password=password)
        print("Django superuser created successfully!")
    else:
        user.email = email
        user.set_password(password)
        user.save()
        print("Django superuser updated to admin@hrms.com / admin123.")

if __name__ == '__main__':
    setup_django()
