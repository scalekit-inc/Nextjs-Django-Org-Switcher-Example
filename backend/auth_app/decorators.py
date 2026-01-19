"""
Custom decorators for authentication and authorization.
"""
from functools import wraps
from django.http import JsonResponse


def api_login_required(view_func):
    """
    Decorator that checks if user is authenticated via Scalekit session.
    Returns JSON error if not authenticated (for API endpoints).
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.session.get('scalekit_user'):
            return JsonResponse({
                'error': 'Authentication required',
                'authenticated': False
            }, status=401)
        return view_func(request, *args, **kwargs)
    return _wrapped_view
