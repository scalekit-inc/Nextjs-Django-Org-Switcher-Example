# Organization Switcher Demo

A full-stack application demonstrating Scalekit's organization switching capabilities with a Django backend and Next.js frontend.

## Features

- **Scalekit's Built-in Organization Switcher**: Uses `prompt: 'select_account'` to show Scalekit's native organization selection UI
- **Custom Organization Switcher**: Custom dropdown component for switching between organizations
- **Current Organization Display**: Visual indicators showing which organization the user is currently in
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

## Architecture

```
org-switcher-app/
├── backend/                  # Django REST API
│   ├── auth_app/
│   │   ├── scalekit_client.py   # Scalekit SDK wrapper
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
        │   └── CustomOrgSwitcher.tsx     # Custom org switcher
        └── lib/
            └── api.ts                    # API client
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/url` | POST | Get authorization URL for login |
| `/api/auth/callback` | POST | Handle OAuth callback |
| `/api/auth/user` | GET | Get current user info and organizations |
| `/api/auth/switch-org` | POST | Switch to different organization |
| `/api/auth/logout` | POST | Logout user |
| `/api/health` | GET | Health check |

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
