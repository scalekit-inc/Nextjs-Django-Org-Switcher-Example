"""
ASGI config for org_switcher project.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'org_switcher.settings')

application = get_asgi_application()
