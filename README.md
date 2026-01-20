# Organization Switcher Demo

A full-stack application demonstrating Scalekit's organization switching capabilities with a Django backend and Next.js frontend.

## Features

- **Scalekit's Built-in Organization Switcher**: Uses `prompt: 'select_account'` to show Scalekit's native organization selection UI
- **Custom Organization Switcher**: Custom dropdown component for switching between organizations
- **Current Organization Display**: Visual indicators showing which organization the user is currently in
- **Agent Auth Connectors**: Connect external services (GitHub, Slack, Google Ads) using Scalekit's Agent Auth
- **Django REST API Backend**: Session-based authentication with Scalekit SDK
- **Next.js 14 Frontend**: Modern React with TypeScript and Tailwind CSS

## Prerequisites

- Python 3.10 or later (required for Scalekit SDK)
- Node.js 16 or later
- npm or yarn
- A Scalekit account ([Sign up](https://app.scalekit.com/))

## Setup

### 1. Scalekit Configuration

1. Visit [Scalekit Dashboard](https://app.scalekit.com)
2. Navigate to Settings and copy:
   - **Environment URL** (e.g., `https://your-env.scalekit.com`)
   - **Client ID**
   - **Client Secret**
3. Under Authentication > Redirect URLs, add:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000` (post-logout redirect)

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your Scalekit credentials:

```
SCALEKIT_ENV_URL=https://your-env.scalekit.com
SCALEKIT_CLIENT_ID=your_client_id
SCALEKIT_CLIENT_SECRET=your_client_secret
SCALEKIT_REDIRECT_URI=http://localhost:3000/auth/callback
```

### 3. Run the Application

Choose one of the following methods:

**Option A: Shell Script (Mac/Linux)**
```bash
./start.sh
```

**Option B: Batch Script (Windows)**
```cmd
start.bat
```

**Option C: npm (Cross-platform)**
```bash
npm install
npm run setup
npm run dev
```

**Option D: Manual (Two Terminals)**

Terminal 1 - Backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Terminal 2 - Frontend:
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

## Organization Switching Methods

This demo showcases **two** ways to switch organizations:

> **Note:** If a user belongs to multiple organizations and logs in *without* the `prompt: 'select_account'` parameter, Scalekit will automatically log them into their default or most recently used organization—no selection UI is shown. The user would then need to switch organizations from within the app.

### Method 1: Scalekit's Built-in Switcher

Scalekit provides a native organization selection UI that can be triggered using the `prompt: 'select_account'` parameter.

**When to use:**
- During initial login (shows all available orgs)
- When you want Scalekit's polished, hosted UI
- For a consistent experience across apps

**How it works:**
```python
# Backend generates auth URL with prompt parameter
auth_url = client.get_authorization_url(
    state=state,
    prompt='select_account'  # Triggers Scalekit's org selector
)
```

**Can it be triggered inside the app?** Yes! You can add a button in your dashboard that redirects to Scalekit's auth URL with `prompt: 'select_account'`. This will show Scalekit's native org picker and redirect back after selection.

```typescript
// Frontend - trigger Scalekit's built-in switcher from dashboard
const showScalekitOrgPicker = async () => {
  const { auth_url } = await getAuthUrl({ prompt: 'select_account' });
  window.location.href = auth_url;
};
```

### Method 2: Custom Organization Switcher

A custom dropdown component built into the dashboard that shows all organizations and allows switching.

**When to use:**
- When you want full control over the UI
- For a seamless in-app experience without redirects to Scalekit
- When you need custom styling/branding

**How it works:**
```typescript
// Frontend - custom switcher calls API with specific org ID
const { auth_url } = await switchOrganization(organizationId);
window.location.href = auth_url;
```

```python
# Backend - generates auth URL targeting specific org
auth_url = client.get_authorization_url(
    state=state,
    organization_id=organization_id,  # Direct switch to this org
    prompt='select_account'
)
```

## Agent Auth (Connected Services)

The dashboard includes a **Connected Services** panel that allows users to connect their external accounts using Scalekit's Agent Auth feature.

### Supported Connectors

| Connector | Description |
|-----------|-------------|
| **GitHub** | Connect to manage repositories, issues, and pull requests |
| **Slack** | Connect to send messages and manage channels |
| **Google Ads** | Connect to manage advertising campaigns |

### How It Works

Agent Auth builds on top of the organization switcher authentication:

1. User logs in via Scalekit (org switcher) and gets a session
2. User visits the dashboard and sees the Connected Services panel
3. User clicks "Connect" on any service (GitHub, Slack, Google Ads)
4. Backend generates an OAuth authorization URL via Scalekit Agent Auth
5. User completes OAuth with the external provider in a new tab
6. Connection status updates to "Connected"

### Key Points

- **Requires authentication first**: User must be logged in via Scalekit before connecting services
- **Tied to user, not organization**: Connected accounts persist across organization switches (tied to user's email)
- **Secure token storage**: Scalekit handles OAuth tokens, refresh, and secure storage

### Implementation Details

The connector service uses Scalekit's Agent Actions API via `client.actions`:

```python
# Backend - connector_service.py
from scalekit import ScalekitClient

client = ScalekitClient(
    env_url=settings.SCALEKIT_ENV_URL,
    client_id=settings.SCALEKIT_CLIENT_ID,
    client_secret=settings.SCALEKIT_CLIENT_SECRET,
)

# Get or create a connected account
response = client.actions.get_or_create_connected_account(
    connection_name="github-abc123",  # Must match name in Scalekit dashboard
    identifier=user_email
)

# Generate authorization link for OAuth
response = client.actions.get_authorization_link(
    connection_name="github-abc123",
    identifier=user_email,
    redirect_url="http://localhost:3000/dashboard"
)
auth_url = response.link

# Disconnect an account
client.actions.delete_connected_account(
    connection_name="github-abc123",
    identifier=user_email
)
```

### Connector Configuration

**Important:** The `connection_name` must match exactly what you configured in your Scalekit dashboard. This is typically the connector name with a unique suffix (e.g., `github-WZZtcfBc`).

Configure your connectors in `backend/auth_app/connector_service.py`:

```python
SUPPORTED_CONNECTORS = {
    'github': {
        'name': 'github-WZZtcfBc',  # Your Scalekit connection name
        'display_name': 'GitHub',
        'description': 'Connect to GitHub to manage repositories...',
    },
    'slack': {
        'name': 'slack',  # Your Scalekit connection name
        'display_name': 'Slack',
        'description': 'Connect to Slack to send messages...',
    },
    'google_ads': {
        'name': 'google_ads',  # Your Scalekit connection name
        'display_name': 'Google Ads',
        'description': 'Connect to Google Ads to manage campaigns...',
    },
}
```

### Setting Up Connectors in Scalekit

#### GitHub Connector Setup

**Step 1: Create a GitHub OAuth App**

1. Go to [GitHub Developer Settings](https://github.com/settings/developers) (or for organizations: Settings > Developer settings > OAuth Apps)
2. Click **New OAuth App** (or **Register a new application**)
3. Fill in the application details:
   - **Application name**: Your app name (e.g., "My App - GitHub Integration")
   - **Homepage URL**: Your application's homepage (e.g., `http://localhost:3000`)
   - **Authorization callback URL**: Get this from your Scalekit dashboard (see Step 2)
4. Click **Register application**
5. On the next page, you'll see your **Client ID**
6. Click **Generate a new client secret** and copy the **Client Secret**

> For detailed instructions, see: [Creating an OAuth App on GitHub](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)

**Step 2: Configure GitHub in Scalekit**

1. Go to your [Scalekit Dashboard](https://app.scalekit.com)
2. Navigate to **Agent Auth → Connections**
3. Click **Create Connection** → Choose **GitHub** → Click **Create**
4. Copy the **Redirect URI** shown in the Scalekit dashboard
5. Go back to your GitHub OAuth App settings and paste this as the **Authorization callback URL**
6. In Scalekit, paste the **Client ID** and **Client Secret** from GitHub
7. Save the connection and note the **connection name** (e.g., `github-WZZtcfBc`)

#### Google Ads Connector Setup

**Step 1: Enable Google Ads API**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select or create a project
3. Navigate to **APIs & Services → Library**
4. Search for "Google Ads API" and click **Enable**

**Step 2: Create OAuth Credentials**

1. Go to **APIs & Services → Credentials**
2. Click **Create credentials → OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** (or Internal for Google Workspace)
   - Fill in app name, user support email, and developer contact
   - Add scopes as needed for Google Ads
   - Add test users if in testing mode
4. Back in Credentials, create OAuth client ID:
   - **Application type**: Web application
   - **Name**: Your app name (e.g., "My App - Google Ads")
   - **Authorized redirect URIs**: Get this from your Scalekit dashboard (see Step 3)
5. Click **Create** and copy the **Client ID** and **Client Secret**

**Step 3: Configure Google Ads in Scalekit**

1. Go to your [Scalekit Dashboard](https://app.scalekit.com)
2. Navigate to **Agent Auth → Connections**
3. Click **Create Connection** → Choose **Google Ads** → Click **Create**
4. Copy the **Redirect URI** shown in the Scalekit dashboard
5. Go back to Google Cloud Console and add this URI to **Authorized redirect URIs**
6. In Scalekit, paste the **Client ID** and **Client Secret** from Google
7. Save the connection and note the **connection name**

> **Note:** This is a one-time setup - you do not create connections per user. The connection is shared, and each user authorizes their own account through the OAuth flow.

#### Slack Connector Setup

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Click **Create New App** → **From scratch**
3. Enter your app name and select a workspace
4. Navigate to **OAuth & Permissions**
5. Add the required scopes under **User Token Scopes**
6. Copy the **Redirect URL** from your Scalekit dashboard and add it under **Redirect URLs**
7. Copy the **Client ID** and **Client Secret** from Slack
8. In Scalekit, create a Slack connection and paste the credentials

### API Endpoints for Connectors

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/connectors` | GET | List all connectors with connection status |
| `/api/connectors/connect` | POST | Get authorization URL to connect a service |
| `/api/connectors/{name}/status` | GET | Get status of a specific connector |
| `/api/connectors/{name}/disconnect` | POST | Disconnect a connected service |

### Example: Connect GitHub

```bash
# Get authorization link
POST /api/connectors/connect
Content-Type: application/json

{
  "connector": "github",
  "redirect_url": "http://localhost:3000/dashboard"
}

# Response
{
  "auth_url": "https://github.com/login/oauth/authorize?...",
  "connector": "github"
}
```

## Architecture

```
org-switcher-app/
├── backend/                  # Django REST API
│   ├── auth_app/
│   │   ├── scalekit_client.py   # Scalekit SDK wrapper
│   │   ├── connector_service.py # Agent Auth connector service
│   │   ├── views.py             # API endpoints
│   │   ├── middleware.py        # Token refresh middleware
│   │   └── decorators.py        # Auth decorators
│   └── org_switcher/
│       └── settings.py          # Django configuration
└── frontend/                 # Next.js application
    └── src/
        ├── app/
        │   ├── page.tsx                  # Home/login page
        │   ├── auth/callback/page.tsx    # OAuth callback
        │   └── dashboard/page.tsx        # Dashboard with org switcher
        ├── components/
        │   ├── CustomOrgSwitcher.tsx     # Custom org switcher
        │   └── ConnectorsPanel.tsx       # Connected services panel
        └── lib/
            └── api.ts                    # API client
```

## API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/url` | POST | Get authorization URL for login |
| `/api/auth/callback` | POST | Handle OAuth callback |
| `/api/auth/user` | GET | Get current user info and organizations |
| `/api/auth/switch-org` | POST | Switch to different organization |
| `/api/auth/logout` | POST | Logout user |
| `/api/health` | GET | Health check |

### Connectors (Agent Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/connectors` | GET | List all connectors with status |
| `/api/connectors/connect` | POST | Get auth URL to connect a service |
| `/api/connectors/{name}/status` | GET | Get specific connector status |
| `/api/connectors/{name}/disconnect` | POST | Disconnect a service |

### Request Examples

**Get Auth URL (with Scalekit's org picker):**
```bash
POST /api/auth/url
Content-Type: application/json

{
  "prompt": "select_account"
}
```

**Switch Organization (direct):**
```bash
POST /api/auth/switch-org
Content-Type: application/json

{
  "organization_id": "org_123"
}
```

## Scalekit SDK Methods Used

This application uses the following Scalekit SDK methods:

| Method | Purpose |
|--------|---------|
| `get_authorization_url()` | Generates OAuth 2.0 authorization URL with scopes, state, `organization_id`, and `prompt` parameters |
| `authenticate_with_code()` | Exchanges authorization code for tokens (access_token, refresh_token, id_token) |
| `validate_access_token_and_get_claims()` | Validates access token and extracts user claims (org ID, roles, permissions) |
| `refresh_access_token()` | Refreshes expired access tokens using refresh token |
| `get_logout_url()` | Generates OIDC-compliant logout URL with `id_token_hint` |

### Direct Scalekit REST API Calls

In addition to SDK methods, the backend makes direct REST API calls:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/oauth/token` | POST | Client credentials flow for API access token |
| `/api/v1/users/{user_id}/sessions` | GET | Get user's authenticated organization sessions |
| `/api/v1/users/{user_id}` | GET | Get user details with organization memberships |
| `/api/v1/organizations/{org_id}` | GET | Fetch specific organization details |

## Frontend-Backend Communication

The Next.js frontend communicates with the Django backend using fetch with credentials (`credentials: 'include'` for session cookies).

**Base URL:** `http://localhost:8000/api` (configurable via `NEXT_PUBLIC_API_URL`)

### Authentication Flow

1. Frontend calls `/api/auth/url` to get Scalekit authorization URL
2. Backend generates auth URL via SDK, stores state in session
3. Frontend redirects user to Scalekit login
4. Scalekit redirects back to `/auth/callback` with `code` & `state`
5. Frontend calls `/api/auth/callback` with code & state
6. Backend exchanges code for tokens, stores in session, returns user & organizations
7. Frontend accesses protected endpoints with session cookies

### Organization Switch Flow

1. Frontend calls `/api/auth/switch-org` with target `organization_id`
2. Backend generates new auth URL with `organization_id` and `prompt: 'select_account'`
3. Frontend redirects to re-authenticate with new organization context
4. After callback, session updates with new `current_organization_id`

## Troubleshooting

**Python version error with Scalekit SDK:**
```
TypeError: unsupported operand type(s) for |: 'type' and 'type'
```
Solution: Upgrade to Python 3.10 or later. The Scalekit SDK uses union type syntax (`A | B`) which requires Python 3.10+.

**CORS Issues:**
- Ensure `CORS_ALLOWED_ORIGINS` in Django settings includes `http://localhost:3000`
- Check that cookies are being sent with `credentials: 'include'`

**Organizations not showing:**
- Verify user belongs to multiple organizations in Scalekit dashboard
- Check the backend logs for API responses
- Ensure the user ID is being passed correctly to the memberships API

**Current organization not updating after switch:**
- Check that the `oid` claim is present in the JWT token
- Verify the callback is extracting the org ID correctly

**Connector errors (RESOURCE_NOT_FOUND or INTERNAL_ERROR):**
- Verify the connector is configured in your Scalekit dashboard
- Check that the `connection_name` in your code matches exactly what's in the Scalekit dashboard
- The connection name often includes a unique suffix (e.g., `github-WZZtcfBc` instead of just `github`)
- Ensure the OAuth app credentials are correctly configured in Scalekit

**OAuth callback processed twice (invalid_grant error):**
- This can happen with React Strict Mode in development
- The fix uses `useRef` to prevent duplicate processing in the callback page

## Technologies

**Backend:**
- Django 4.2+
- scalekit-sdk-python
- django-cors-headers

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

## Learn More

- [Scalekit Documentation](https://docs.scalekit.com)
- [Organization Switching Guide](https://docs.scalekit.com/authenticate/manage-users-orgs/organization-switching)
- [Agent Auth Quickstart](https://docs.scalekit.com/agent-auth/quickstart/)
- [GitHub Connector Reference](https://docs.scalekit.com/reference/agent-connectors/github/)
- [Slack Connector Reference](https://docs.scalekit.com/reference/agent-connectors/slack/)
- [Google Ads Connector Reference](https://docs.scalekit.com/reference/agent-connectors/google_ads/)
