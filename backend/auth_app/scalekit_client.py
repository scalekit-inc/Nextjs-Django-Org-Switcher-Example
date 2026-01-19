"""
Scalekit OAuth 2.0 / OIDC client implementation using official Scalekit SDK.
Handles authentication flows, token management, user info retrieval, and organization switching.
"""
import logging
import requests
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from scalekit import ScalekitClient as SDKClient
from scalekit.common.scalekit import (
    AuthorizationUrlOptions,
    CodeAuthenticationOptions,
    TokenValidationOptions,
)

logger = logging.getLogger(__name__)


class ScalekitClient:
    """
    Client for interacting with Scalekit OAuth 2.0 / OIDC endpoints.

    This class handles:
    - Authorization URL generation
    - Token exchange
    - Token refresh
    - User info retrieval
    - Token validation
    - Organization switching
    """

    def __init__(self):
        """
        Initialize Scalekit client using official SDK.
        """
        self.domain = settings.SCALEKIT_ENV_URL
        self.client_id = settings.SCALEKIT_CLIENT_ID
        self.client_secret = settings.SCALEKIT_CLIENT_SECRET
        self.redirect_uri = settings.SCALEKIT_REDIRECT_URI
        self.scopes = settings.SCALEKIT_SCOPES.split() if settings.SCALEKIT_SCOPES else ['openid', 'profile', 'email', 'offline_access']

        # Validate required settings
        if not self.domain:
            raise ValueError("SCALEKIT_ENV_URL is not set.")
        if not self.client_id:
            raise ValueError("SCALEKIT_CLIENT_ID is not set.")
        if not self.client_secret:
            raise ValueError("SCALEKIT_CLIENT_SECRET is not set.")
        if not self.redirect_uri:
            raise ValueError("SCALEKIT_REDIRECT_URI is not set.")

        # Initialize official Scalekit SDK client
        self.sdk_client = SDKClient(
            env_url=self.domain,
            client_id=self.client_id,
            client_secret=self.client_secret
        )

    def get_authorization_url(self, state=None, organization_id=None, prompt=None):
        """
        Generate the authorization URL for OAuth 2.0 login flow using Scalekit SDK.

        SDK Method Used: ScalekitClient.get_authorization_url()

        Args:
            state: Optional state parameter for CSRF protection
            organization_id: Optional organization ID to switch to specific org
            prompt: Optional prompt parameter (e.g., 'select_account' for org switcher)

        Returns:
            str: Authorization URL to redirect user to
        """
        options = AuthorizationUrlOptions()
        options.state = state
        options.scopes = self.scopes

        # Add organization_id if provided (for direct org switching)
        if organization_id:
            options.organization_id = organization_id

        # Add prompt parameter if provided (e.g., 'select_account' to show org switcher)
        if prompt:
            options.prompt = prompt

        # Use official SDK method
        auth_url = self.sdk_client.get_authorization_url(
            redirect_uri=self.redirect_uri,
            options=options
        )

        return auth_url

    def exchange_code_for_tokens(self, code):
        """
        Exchange authorization code for access and refresh tokens using Scalekit SDK.

        SDK Method Used: ScalekitClient.authenticate_with_code()

        Args:
            code: Authorization code from OAuth callback

        Returns:
            dict: Token response containing access_token, refresh_token, expires_in, etc.

        Raises:
            Exception: If token exchange fails
        """
        try:
            options = CodeAuthenticationOptions()

            # Use official SDK method (returns dict)
            token_response = self.sdk_client.authenticate_with_code(
                code=code,
                redirect_uri=self.redirect_uri,
                options=options
            )

            # Ensure we have expires_in (default to 3600 if not present)
            if 'expires_in' not in token_response:
                token_response['expires_in'] = 3600

            return token_response

        except Exception as e:
            logger.error(f"Token exchange failed: {e}")
            raise Exception(f"Failed to exchange code for tokens: {str(e)}")

    def refresh_access_token(self, refresh_token):
        """
        Refresh an expired access token using the refresh token via Scalekit SDK.

        SDK Method Used: ScalekitClient.refresh_access_token()

        Args:
            refresh_token: The refresh token from previous authentication

        Returns:
            dict: New token response containing updated access_token, etc.

        Raises:
            Exception: If token refresh fails
        """
        try:
            # Use official SDK method
            token_response = self.sdk_client.refresh_access_token(refresh_token)

            # Ensure we have expires_in (default to 3600 if not present)
            if 'expires_in' not in token_response:
                token_response['expires_in'] = 3600

            # Preserve old refresh_token if new one not provided
            if 'refresh_token' not in token_response or not token_response['refresh_token']:
                token_response['refresh_token'] = refresh_token

            return token_response

        except Exception as e:
            logger.error(f"Token refresh failed: {e}")
            raise Exception(f"Failed to refresh access token: {str(e)}")

    def get_user_info(self, access_token):
        """
        Retrieve user information from access token claims using Scalekit SDK.

        SDK Method Used: ScalekitClient.validate_access_token_and_get_claims()

        Args:
            access_token: Valid OAuth 2.0 access token

        Returns:
            dict: User information including email, name, roles, permissions, organizations, etc.

        Raises:
            Exception: If user info retrieval fails
        """
        try:
            validation_options = TokenValidationOptions()
            claims = self.sdk_client.validate_access_token_and_get_claims(
                token=access_token,
                options=validation_options
            )

            return claims

        except Exception as e:
            logger.error(f"User info retrieval failed: {e}")
            raise Exception(f"Failed to retrieve user info: {str(e)}")

    def get_user_organizations(self, access_token):
        """
        Get list of organizations the user belongs to from access token claims.

        Args:
            access_token: Valid OAuth 2.0 access token

        Returns:
            list: List of organization objects with id, display_name, etc.
        """
        try:
            claims = self.get_user_info(access_token)

            # Organizations can be in different claim locations
            organizations = (
                claims.get('organizations', []) or
                claims.get('https://scalekit.com/organizations', []) or
                claims.get('scalekit:organizations', []) or
                []
            )

            return organizations

        except Exception as e:
            logger.error(f"Failed to get user organizations: {e}")
            return []

    def is_token_expired(self, expires_at):
        """
        Check if a token has expired.

        Args:
            expires_at: DateTime when the token expires

        Returns:
            bool: True if token is expired or expires within 5 minutes
        """
        if not expires_at:
            return True

        # Consider token expired if it expires within 5 minutes
        buffer_time = timedelta(minutes=5)
        return timezone.now() + buffer_time >= expires_at

    def logout(self, access_token, id_token=None):
        """
        Get logout URL using Scalekit SDK.

        SDK Method Used: ScalekitClient.get_logout_url()

        Args:
            access_token: Current access token
            id_token: ID token to send as id_token_hint for proper OIDC logout

        Returns:
            str: Logout URL (caller should redirect user to this URL)
        """
        from scalekit.common.scalekit import LogoutUrlOptions

        options = LogoutUrlOptions()
        options.post_logout_redirect_uri = settings.SCALEKIT_REDIRECT_URI.replace('/auth/callback', '')

        # Set id_token_hint if ID token is provided
        if id_token:
            options.id_token_hint = id_token

        # Use official SDK method to get logout URL
        logout_url = self.sdk_client.get_logout_url(options)
        return logout_url

    def validate_token_and_get_claims(self, access_token):
        """
        Validate access token using Scalekit SDK and get claims including permissions.

        SDK Method Used: ScalekitClient.validate_access_token_and_get_claims()

        Args:
            access_token: OAuth 2.0 access token to validate

        Returns:
            dict: Token claims including permissions, roles, organizations, etc.

        Raises:
            Exception: If token validation fails
        """
        try:
            validation_options = TokenValidationOptions()
            claims = self.sdk_client.validate_access_token_and_get_claims(
                token=access_token,
                options=validation_options
            )

            logger.debug(f"Token validated. Claims keys: {list(claims.keys()) if claims else 'None'}")
            return claims

        except Exception as e:
            logger.error(f"Token validation failed: {e}")
            raise Exception(f"Failed to validate token: {str(e)}")

    def _get_client_credentials_token(self):
        """
        Get an access token using client credentials flow for API calls.

        Returns:
            str: Access token for API calls
        """
        token_url = f"{self.domain}/oauth/token"
        response = requests.post(
            token_url,
            data={
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret,
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        response.raise_for_status()
        return response.json().get('access_token')

    def get_user_sessions(self, user_id):
        """
        Get all sessions for a user including authenticated organizations.

        API Endpoint: GET /api/v1/users/{user_id}/sessions

        Args:
            user_id: User ID (e.g., 'usr_xxx')

        Returns:
            list: List of session objects with authenticated_organizations
        """
        try:
            # Get client credentials token for API access
            api_token = self._get_client_credentials_token()

            # Call the sessions API (get all sessions, not just active)
            sessions_url = f"{self.domain}/api/v1/users/{user_id}/sessions"
            response = requests.get(
                sessions_url,
                headers={
                    'Authorization': f'Bearer {api_token}',
                    'Content-Type': 'application/json'
                }
            )
            response.raise_for_status()
            data = response.json()

            logger.debug(f"User sessions response: {data}")
            return data.get('sessions', [])

        except Exception as e:
            logger.error(f"Failed to get user sessions: {e}")
            return []

    def get_user_organizations(self, user_id):
        """
        Get all organizations the user is a member of.

        API Endpoint: GET /api/v1/users/{user_id}
        The user object includes organization memberships.

        Args:
            user_id: User ID (e.g., 'usr_xxx')

        Returns:
            list: List of organization objects with id, display_name, etc.
        """
        try:
            api_token = self._get_client_credentials_token()

            # Get user details which includes organization memberships
            user_url = f"{self.domain}/api/v1/users/{user_id}"
            response = requests.get(
                user_url,
                headers={
                    'Authorization': f'Bearer {api_token}',
                    'Content-Type': 'application/json'
                }
            )
            response.raise_for_status()
            data = response.json()

            logger.info(f"User details response: {data}")

            # Extract organization memberships from user object
            user_data = data.get('user', data)
            memberships = user_data.get('organization_memberships', []) or user_data.get('memberships', []) or []

            logger.info(f"Found {len(memberships)} organization memberships for user {user_id}")

            # Build organization list from memberships
            organizations = []
            for membership in memberships:
                org_id = membership.get('organization_id') or membership.get('org_id')
                if org_id:
                    # Try to get org details for display name
                    org_details = self._get_organization_details(org_id)
                    if org_details:
                        organizations.append(org_details)
                    else:
                        organizations.append({
                            'id': org_id,
                            'display_name': membership.get('organization_name') or org_id,
                        })

            # If no memberships found in user object, try the organizations field directly
            if not organizations:
                orgs = user_data.get('organizations', [])
                for org in orgs:
                    if isinstance(org, dict):
                        org_id = org.get('id') or org.get('organization_id')
                        organizations.append({
                            'id': org_id,
                            'display_name': org.get('display_name') or org.get('name') or org_id,
                        })
                    elif isinstance(org, str):
                        # org is just an ID string
                        org_details = self._get_organization_details(org)
                        if org_details:
                            organizations.append(org_details)
                        else:
                            organizations.append({'id': org, 'display_name': org})

            logger.info(f"Final organizations list: {organizations}")
            return organizations

        except Exception as e:
            logger.error(f"Failed to get user organizations: {e}")
            return []

    def get_authenticated_organizations(self, user_id):
        """
        Get all organizations the user is a member of.
        This is an alias for get_user_organizations for backward compatibility.
        """
        return self.get_user_organizations(user_id)

    def _get_organization_details(self, org_id):
        """
        Get organization details by ID.

        Args:
            org_id: Organization ID (e.g., 'org_xxx')

        Returns:
            dict: Organization details with id, display_name, etc.
        """
        try:
            api_token = self._get_client_credentials_token()
            org_url = f"{self.domain}/api/v1/organizations/{org_id}"
            response = requests.get(
                org_url,
                headers={
                    'Authorization': f'Bearer {api_token}',
                    'Content-Type': 'application/json'
                }
            )
            response.raise_for_status()
            data = response.json()

            # Extract org from response (may be nested under 'organization')
            org = data.get('organization', data)
            return {
                'id': org.get('id') or org_id,
                'display_name': org.get('display_name') or org.get('name') or org_id,
            }

        except Exception as e:
            logger.error(f"Failed to get organization details for {org_id}: {e}")
            return None


# Module-level singleton instance
_client_instance = None


def scalekit_client():
    """
    Get the shared ScalekitClient instance.
    Creates it on first access (lazy initialization).

    Returns:
        ScalekitClient: The shared client instance
    """
    global _client_instance
    if _client_instance is None:
        _client_instance = ScalekitClient()
    return _client_instance
