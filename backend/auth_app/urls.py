"""
URL configuration for auth_app API.
"""
from django.urls import path
from . import views

app_name = 'auth_app'

urlpatterns = [
    # Authentication endpoints
    path('auth/url', views.get_auth_url_view, name='auth_url'),
    path('auth/callback', views.callback_view, name='callback'),
    path('auth/user', views.user_info_view, name='user_info'),
    path('auth/logout', views.logout_view, name='logout'),

    # Organization switching
    path('auth/switch-org', views.switch_organization_view, name='switch_org'),

    # Connector endpoints (Agent Auth)
    path('connectors', views.connectors_list_view, name='connectors_list'),
    path('connectors/connect', views.connector_connect_view, name='connector_connect'),
    path('connectors/<str:connector_name>/status', views.connector_status_view, name='connector_status'),
    path('connectors/<str:connector_name>/disconnect', views.connector_disconnect_view, name='connector_disconnect'),

    # Health check
    path('health', views.health_check_view, name='health'),
]
