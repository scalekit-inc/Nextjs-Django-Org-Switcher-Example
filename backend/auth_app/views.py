"""
API views for Scalekit authentication and organization switching.
"""
import logging
import secrets
from django.http import JsonResponse
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from datetime import timedelta
from auth_app.scalekit_client import scalekit_client
from auth_app.decorators import api_login_required

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def get_auth_url_view(request):
    """
    Generate authorization URL for login.
    Supports both regular login and organization switching.

    POST /api/auth/url
    Body: {
        "organization_id": "org_123" (optional - for direct org switching),
        "prompt": "select_account" (optional - to show org switcher)
    }

    Returns:
        {
            "auth_url": "https://...",
            "state": "..."
        }
    """
    try:
        import json
        body = json.loads(request.body) if request.body else {}

        organization_id = body.get('organization_id')
        prompt = body.get('prompt')

        # Generate state parameter for CSRF protection
        state = secrets.token_urlsafe(32)
        request.session['oauth_state'] = state
        request.session.save()

        # Get authorization URL from Scalekit
        client = scalekit_client()
        auth_url = client.get_authorization_url(
            state=state,
            organization_id=organization_id,
            prompt=prompt
        )

        logger.debug(f"Generated auth URL with state: {state[:10]}...")
        if organization_id:
            logger.debug(f"Targeting organization: {organization_id}")
        if prompt:
            logger.debug(f"Using prompt: {prompt}")

        return JsonResponse({
            'auth_url': auth_url,
            'state': state
        })

    except Exception as e:
        logger.error(f"Error generating auth URL: {e}")
        return JsonResponse({
            'error': f'Failed to generate auth URL: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def callback_view(request):
    """
    Handle OAuth 2.0 callback from Scalekit.

    POST /api/auth/callback
    Body: {
        "code": "...",
        "state": "..."
    }

    Returns:
        {
            "success": true,
            "user": {...},
            "organizations": [...]
        }
    """
    try:
        import json
        body = json.loads(request.body)

        # Verify state parameter
        state = body.get('state')
        stored_state = request.session.get('oauth_state')

        logger.debug(f"Callback state: {state[:10] if state else 'None'}...")
        logger.debug(f"Stored state: {stored_state[:10] if stored_state else 'None'}...")

        if not state or state != stored_state:
            logger.error(f"State mismatch - received: {state}, stored: {stored_state}")
            return JsonResponse({
                'error': 'Invalid state parameter'
            }, status=400)

        # Clear state from session
        request.session.pop('oauth_state', None)

        # Get authorization code
        code = body.get('code')
        error = body.get('error')

        if error:
            logger.error(f"OAuth error: {error}")
            return JsonResponse({
                'error': f'Authentication failed: {error}'
            }, status=400)

        if not code:
            return JsonResponse({
                'error': 'No authorization code received'
            }, status=400)

        # Exchange code for tokens
        client = scalekit_client()
        token_response = client.exchange_code_for_tokens(code)

        access_token = token_response.get('access_token')
        refresh_token = token_response.get('refresh_token')
        id_token = token_response.get('id_token')
        expires_in = token_response.get('expires_in', 3600)

        # Get user information from access token
        user_obj = token_response.get('user', {})
        user_info = client.get_user_info(access_token)

        # Get organizations
        organizations = client.get_user_organizations(access_token)

        # Extract current organization from claims
        # The 'oid' claim contains the organization ID in JWT tokens
        logger.info(f"Token claims keys: {list(user_info.keys()) if user_info else 'None'}")
        logger.info(f"oid claim: {user_info.get('oid')}")
        current_org_id = (
            user_info.get('oid') or
            user_info.get('org_id') or
            user_info.get('organization_id')
        )
        logger.info(f"Extracted current_org_id: {current_org_id}")

        # Get name
        name = user_obj.get('name') or user_obj.get('username', '')
        if not name:
            given_name = user_obj.get('givenName', '')
            family_name = user_obj.get('familyName', '')
            if given_name or family_name:
                name = f"{given_name} {family_name}".strip()
            else:
                name = user_info.get('name') or user_info.get('preferred_username', '')
        if not name:
            name = user_obj.get('email', '')

        # Store in session
        expires_at = timezone.now() + timedelta(seconds=expires_in)
        request.session['scalekit_user'] = {
            'sub': user_obj.get('id'),
            'email': user_obj.get('email'),
            'name': name,
            'given_name': user_obj.get('givenName'),
            'family_name': user_obj.get('familyName'),
            'preferred_username': user_obj.get('username'),
            'claims': user_info,
            'current_organization_id': current_org_id,
        }
        request.session['scalekit_tokens'] = {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'id_token': id_token,
            'expires_at': expires_at.isoformat(),
            'expires_in': expires_in,
        }

        logger.info(f"User {user_obj.get('email')} authenticated successfully")

        return JsonResponse({
            'success': True,
            'user': {
                'id': user_obj.get('id'),
                'email': user_obj.get('email'),
                'name': name,
                'current_organization_id': current_org_id,
            },
            'organizations': organizations
        })

    except Exception as e:
        logger.error(f"Callback error: {e}")
        return JsonResponse({
            'error': f'Authentication failed: {str(e)}'
        }, status=500)


@api_login_required
@require_http_methods(["GET"])
def user_info_view(request):
    """
    Get current user information.

    GET /api/auth/user

    Returns:
        {
            "user": {...},
            "organizations": [...],
            "current_organization_id": "..."
        }
    """
    try:
        user_data = request.session.get('scalekit_user', {})
        user_id = user_data.get('sub')
        current_org_id = user_data.get('current_organization_id')

        # Get authenticated organizations from user sessions API
        client = scalekit_client()
        organizations = []
        if user_id:
            orgs = client.get_authenticated_organizations(user_id)
            logger.info(f"Current org ID from session: {current_org_id}")
            logger.info(f"Organizations returned: {[o.get('id') for o in orgs]}")
            # Add is_current flag to each organization
            for org in orgs:
                org['is_current'] = (org.get('id') == current_org_id)
                logger.info(f"Org {org.get('id')} is_current: {org['is_current']}")
            organizations = orgs

        return JsonResponse({
            'user': {
                'id': user_id,
                'email': user_data.get('email'),
                'name': user_data.get('name'),
                'current_organization_id': current_org_id,
            },
            'organizations': organizations,
            'authenticated': True
        })

    except Exception as e:
        logger.error(f"Error getting user info: {e}")
        return JsonResponse({
            'error': f'Failed to get user info: {str(e)}'
        }, status=500)


@csrf_exempt
@api_login_required
@require_http_methods(["POST"])
def switch_organization_view(request):
    """
    Switch to a different organization.

    POST /api/auth/switch-org
    Body: {
        "organization_id": "org_123"
    }

    Returns:
        {
            "auth_url": "https://...",
            "state": "..."
        }
    """
    try:
        import json
        body = json.loads(request.body)
        organization_id = body.get('organization_id')

        if not organization_id:
            return JsonResponse({
                'error': 'organization_id is required'
            }, status=400)

        # Generate state parameter
        state = secrets.token_urlsafe(32)
        request.session['oauth_state'] = state
        request.session.save()

        # Get authorization URL with organization_id and prompt=select_account
        client = scalekit_client()
        auth_url = client.get_authorization_url(
            state=state,
            organization_id=organization_id,
            prompt='select_account'
        )

        logger.info(f"Switching to organization: {organization_id}")

        return JsonResponse({
            'auth_url': auth_url,
            'state': state
        })

    except Exception as e:
        logger.error(f"Error switching organization: {e}")
        return JsonResponse({
            'error': f'Failed to switch organization: {str(e)}'
        }, status=500)


@csrf_exempt
@api_login_required
@require_http_methods(["POST"])
def logout_view(request):
    """
    Logout the user.

    POST /api/auth/logout

    Returns:
        {
            "logout_url": "https://..."
        }
    """
    try:
        token_data = request.session.get('scalekit_tokens', {})
        access_token = token_data.get('access_token')
        id_token = token_data.get('id_token')

        # Get logout URL from Scalekit
        logout_url = None
        if access_token:
            try:
                client = scalekit_client()
                logout_url = client.logout(access_token, id_token)
            except Exception as e:
                logger.error(f"Error getting logout URL: {e}")

        # Clear session
        request.session.flush()

        logger.info("User logged out")

        return JsonResponse({
            'success': True,
            'logout_url': logout_url
        })

    except Exception as e:
        logger.error(f"Logout error: {e}")
        return JsonResponse({
            'error': f'Logout failed: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def health_check_view(request):
    """
    Health check endpoint.

    GET /api/health

    Returns:
        {"status": "ok"}
    """
    return JsonResponse({'status': 'ok'})
