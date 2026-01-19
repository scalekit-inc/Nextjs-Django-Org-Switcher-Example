"""
URL configuration for org_switcher project.
"""
from django.urls import path, include

urlpatterns = [
    path('api/', include('auth_app.urls')),
]
