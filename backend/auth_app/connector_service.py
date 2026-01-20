"""
Scalekit Agent Auth Connector Service.
Handles connected accounts for GitHub, Slack, and Google Ads integrations.
"""
import logging
from django.conf import settings
from scalekit import ScalekitClient

logger = logging.getLogger(__name__)

# Supported connectors
# Note: The 'name' field must match the connection name in your Scalekit dashboard
SUPPORTED_CONNECTORS = {
    'github': {
        'name': 'github-WZZtcfBc',  # Scalekit connection name
        'display_name': 'GitHub',
        'description': 'Connect to GitHub to manage repositories, issues, and pull requests',
        'icon': 'github',
    },
    'slack': {
        'name': 'slack',
        'display_name': 'Slack',
        'description': 'Connect to Slack to send messages and manage channels',
        'icon': 'slack',
    },
    'google_ads': {
        'name': 'google_ads',
        'display_name': 'Google Ads',
        'description': 'Connect to Google Ads to manage advertising campaigns',
        'icon': 'google_ads',
    },
}


class ConnectorService:
    """
    Service for managing Scalekit Agent Auth connected accounts.

    This service handles:
    - Creating/retrieving connected accounts for users
    - Generating authorization links for OAuth connections
    - Checking connection status
    - Disconnecting accounts
    """

    def __init__(self):
        """Initialize the Scalekit client for Agent Actions."""
        self.client = ScalekitClient(
            env_url=settings.SCALEKIT_ENV_URL,
            client_id=settings.SCALEKIT_CLIENT_ID,
            client_secret=settings.SCALEKIT_CLIENT_SECRET,
        )
        self.actions = self.client.actions

    def get_or_create_connected_account(self, connector_name: str, user_identifier: str):
        """
        Get or create a connected account for a user.

        Args:
            connector_name: Name of the connector (github, slack, google_ads)
            user_identifier: Unique identifier for the user (e.g., user ID or email)

        Returns:
            dict: Connected account information including id and status
        """
        if connector_name not in SUPPORTED_CONNECTORS:
            raise ValueError(f"Unsupported connector: {connector_name}")

        # Use the actual Scalekit connection name from config
        scalekit_connection_name = SUPPORTED_CONNECTORS[connector_name]['name']

        try:
            response = self.actions.get_or_create_connected_account(
                connection_name=scalekit_connection_name,
                identifier=user_identifier
            )

            connected_account = response.connected_account
            logger.info(f"Connected account for {connector_name}: id={connected_account.id}, status={connected_account.status}")

            return {
                'id': connected_account.id,
                'status': connected_account.status,
                'connector': connector_name,
            }
        except Exception as e:
            logger.error(f"Failed to get/create connected account for {connector_name}: {e}")
            raise

    def get_authorization_link(self, connector_name: str, user_identifier: str, redirect_url: str = None):
        """
        Generate an authorization link for a user to connect their account.

        Args:
            connector_name: Name of the connector (github, slack, google_ads)
            user_identifier: Unique identifier for the user
            redirect_url: Optional URL to redirect after authorization

        Returns:
            str: Authorization URL for the user to complete OAuth
        """
        if connector_name not in SUPPORTED_CONNECTORS:
            raise ValueError(f"Unsupported connector: {connector_name}")

        # Use the actual Scalekit connection name from config
        scalekit_connection_name = SUPPORTED_CONNECTORS[connector_name]['name']

        try:
            response = self.actions.get_authorization_link(
                connection_name=scalekit_connection_name,
                identifier=user_identifier,
                redirect_url=redirect_url
            )

            logger.info(f"Generated authorization link for {connector_name}")
            return response.link
        except Exception as e:
            logger.error(f"Failed to generate authorization link for {connector_name}: {e}")
            raise

    def get_connection_status(self, connector_name: str, user_identifier: str):
        """
        Check the connection status for a specific connector.

        Args:
            connector_name: Name of the connector
            user_identifier: Unique identifier for the user

        Returns:
            dict: Connection status information
        """
        try:
            account = self.get_or_create_connected_account(connector_name, user_identifier)

            return {
                'connector': connector_name,
                'display_name': SUPPORTED_CONNECTORS[connector_name]['display_name'],
                'description': SUPPORTED_CONNECTORS[connector_name]['description'],
                'connected': account['status'] == 'ACTIVE',
                'status': account['status'],
                'account_id': account['id'],
            }
        except Exception as e:
            logger.error(f"Failed to get connection status for {connector_name}: {e}")
            return {
                'connector': connector_name,
                'display_name': SUPPORTED_CONNECTORS[connector_name]['display_name'],
                'description': SUPPORTED_CONNECTORS[connector_name]['description'],
                'connected': False,
                'status': 'ERROR',
                'error': str(e),
            }

    def get_all_connection_statuses(self, user_identifier: str):
        """
        Get connection status for all supported connectors.

        Args:
            user_identifier: Unique identifier for the user

        Returns:
            list: List of connection status objects for all connectors
        """
        statuses = []
        for connector_name in SUPPORTED_CONNECTORS:
            status = self.get_connection_status(connector_name, user_identifier)
            statuses.append(status)
        return statuses

    def disconnect_account(self, connector_name: str, user_identifier: str):
        """
        Disconnect a connected account.

        Args:
            connector_name: Name of the connector
            user_identifier: Unique identifier for the user

        Returns:
            dict: Result of the disconnection
        """
        if connector_name not in SUPPORTED_CONNECTORS:
            raise ValueError(f"Unsupported connector: {connector_name}")

        # Use the actual Scalekit connection name from config
        scalekit_connection_name = SUPPORTED_CONNECTORS[connector_name]['name']

        try:
            # Get the connected account first
            account = self.get_or_create_connected_account(connector_name, user_identifier)

            # Delete the connected account
            self.actions.delete_connected_account(
                connection_name=scalekit_connection_name,
                identifier=user_identifier
            )

            logger.info(f"Disconnected {connector_name} for user {user_identifier}")
            return {
                'success': True,
                'connector': connector_name,
                'message': f'{SUPPORTED_CONNECTORS[connector_name]["display_name"]} disconnected successfully',
            }
        except Exception as e:
            logger.error(f"Failed to disconnect {connector_name}: {e}")
            raise


# Module-level singleton instance
_connector_service_instance = None


def get_connector_service():
    """
    Get the shared ConnectorService instance.
    Creates it on first access (lazy initialization).

    Returns:
        ConnectorService: The shared service instance
    """
    global _connector_service_instance
    if _connector_service_instance is None:
        _connector_service_instance = ConnectorService()
    return _connector_service_instance
