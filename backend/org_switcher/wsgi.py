"""
WSGI config for org_switcher project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'org_switcher.settings')

application = get_wsgi_application()
