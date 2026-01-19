# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User's Browser                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Next.js Frontend (Port 3000)                 │  │
│  │                                                      │  │
│  │  • Home Page (Login Options)                        │  │
│  │  • Auth Callback Handler                            │  │
│  │  • Dashboard with Custom Org Switcher               │  │
│  │  • API Client (fetch to Django)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          │ HTTP/JSON                        │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Django Backend (Port 8000)                   │  │
│  │                                                      │  │
│  │  • REST API Endpoints                               │  │
│  │  • Session Management                               │  │
│  │  • Scalekit SDK Integration                         │  │
│  │  • Token Refresh Middleware                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          │ OAuth 2.0/OIDC                   │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Scalekit Platform                            │  │
│  │                                                      │  │
│  │  • Authentication Service                            │  │
│  │  • Organization Management                           │  │
│  │  • SSO Integration                                   │  │
│  │  • Token Issuance                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Organization Switching Flow

### Method 1: Out-of-the-box Switcher (Login)

```
User                 Frontend              Backend              Scalekit
 │                      │                     │                     │
 │ Click "Login with    │                     │                     │
 │ Org Switcher"        │                     │                     │
 │─────────────────────>│                     │                     │
 │                      │                     │                     │
 │                      │ POST /api/auth/url  │                     │
 │                      │ {prompt: 'select_   │                     │
 │                      │  account'}          │                     │
 │                      │────────────────────>│                     │
 │                      │                     │                     │
 │                      │                     │ Generate auth URL   │
 │                      │                     │ with prompt param   │
 │                      │                     │                     │
 │                      │ {auth_url, state}   │                     │
 │                      │<────────────────────│                     │
 │                      │                     │                     │
 │ Redirect to          │                     │                     │
 │ Scalekit             │                     │                     │
 │──────────────────────────────────────────────────────────────>│
 │                      │                     │                     │
 │                      │                     │                     │
 │ [Scalekit shows organization selector UI]                       │
 │                      │                     │                     │
 │ Select org &         │                     │                     │
 │ authenticate         │                     │                     │
 │──────────────────────────────────────────────────────────────>│
 │                      │                     │                     │
 │                      │                     │                     │
 │ Callback with code   │                     │                     │
 │<─────────────────────────────────────────────────────────────────│
 │                      │                     │                     │
 │ Redirect to          │                     │                     │
 │ /auth/callback       │                     │                     │
 │─────────────────────>│                     │                     │
 │                      │                     │                     │
 │                      │ POST /api/auth/     │                     │
 │                      │ callback            │                     │
 │                      │ {code, state}       │                     │
 │                      │────────────────────>│                     │
 │                      │                     │                     │
 │                      │                     │ Exchange code for   │
 │                      │                     │ tokens              │
 │                      │                     │────────────────────>│
 │                      │                     │                     │
 │                      │                     │ Tokens with org     │
 │                      │                     │ context             │
 │                      │                     │<────────────────────│
 │                      │                     │                     │
 │                      │                     │ Store in session    │
 │                      │                     │                     │
 │                      │ {success, user,     │                     │
 │                      │  organizations}     │                     │
 │                      │<────────────────────│                     │
 │                      │                     │                     │
 │ Redirect to          │                     │                     │
 │ /dashboard           │                     │                     │
 │─────────────────────>│                     │                     │
```

### Method 2: Custom Switcher (Dashboard)

```
User                 Frontend              Backend              Scalekit
 │                      │                     │                     │
 │ Click org dropdown   │                     │                     │
 │ & select different   │                     │                     │
 │ organization         │                     │                     │
 │─────────────────────>│                     │                     │
 │                      │                     │                     │
 │                      │ POST /api/auth/     │                     │
 │                      │ switch-org          │                     │
 │                      │ {organization_id}   │                     │
 │                      │────────────────────>│                     │
 │                      │                     │                     │
 │                      │                     │ Generate auth URL   │
 │                      │                     │ with org_id +       │
 │                      │                     │ prompt params       │
 │                      │                     │                     │
 │                      │ {auth_url, state}   │                     │
 │                      │<────────────────────│                     │
 │                      │                     │                     │
 │ Redirect to          │                     │                     │
 │ Scalekit             │                     │                     │
 │──────────────────────────────────────────────────────────────>│
 │                      │                     │                     │
 │                      │                     │                     │
 │ [Scalekit switches organization context & authenticates]        │
 │                      │                     │                     │
 │                      │                     │                     │
 │ Callback with code   │                     │                     │
 │<─────────────────────────────────────────────────────────────────│
 │                      │                     │                     │
 │ [Same callback flow as Method 1...]                             │
 │                      │                     │                     │
 │ Back to dashboard    │                     │                     │
 │ with new org         │                     │                     │
 │─────────────────────>│                     │                     │
```

## Data Flow

### Authentication State

```
┌─────────────────────────────────────────────┐
│          Django Session Store               │
│                                             │
│  scalekit_user: {                          │
│    id: "user_123"                          │
│    email: "user@example.com"               │
│    name: "John Doe"                        │
│    current_organization_id: "org_abc"      │
│  }                                         │
│                                             │
│  scalekit_tokens: {                        │
│    access_token: "eyJ..."                  │
│    refresh_token: "eyJ..."                 │
│    id_token: "eyJ..."                      │
│    expires_at: "2024-01-01T12:00:00Z"     │
│  }                                         │
└─────────────────────────────────────────────┘
```

### Token Claims Structure

```json
{
  "sub": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "org_id": "org_abc",
  "organizations": [
    {
      "id": "org_abc",
      "display_name": "Acme Corp"
    },
    {
      "id": "org_xyz",
      "display_name": "Tech Startup"
    }
  ],
  "roles": ["admin"],
  "permissions": ["organization:settings"],
  "exp": 1704110400,
  "iat": 1704106800
}
```

## API Endpoints Details

### Backend API

| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/api/auth/url` | POST | Get authorization URL | `{prompt?, organization_id?}` |
| `/api/auth/callback` | POST | Handle OAuth callback | `{code, state}` |
| `/api/auth/user` | GET | Get current user info | None (uses session) |
| `/api/auth/switch-org` | POST | Switch organization | `{organization_id}` |
| `/api/auth/logout` | POST | Logout user | None |
| `/api/health` | GET | Health check | None |

## Component Hierarchy

### Frontend Components

```
App (layout.tsx)
│
├── Home Page (page.tsx)
│   ├── Login Button (Out-of-box switcher)
│   └── Login Button (Standard)
│
├── Auth Callback (auth/callback/page.tsx)
│   └── Loading / Error Display
│
└── Dashboard (dashboard/page.tsx)
    ├── Header
    │   ├── CustomOrgSwitcher
    │   │   ├── Dropdown Button
    │   │   └── Organization List
    │   └── Logout Button
    │
    ├── Welcome Card
    ├── User Info Card
    ├── Organizations Card
    └── Implementation Details Card
```

## Key Technologies

### Backend Stack
- **Django 4.2**: Web framework
- **Scalekit SDK**: Authentication integration
- **django-cors-headers**: CORS support
- **SQLite**: Session storage

### Frontend Stack
- **Next.js 14**: React framework (App Router)
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Fetch API**: HTTP client

## Security Features

1. **CSRF Protection**: State parameter validation
2. **Session Security**: HttpOnly cookies, SameSite policy
3. **Token Refresh**: Automatic token refresh via middleware
4. **CORS**: Configured for specific origins
5. **HTTPS Ready**: Production-ready configuration

## Scalability Considerations

- Session-based auth works for moderate traffic
- For high scale, consider:
  - Redis for session storage
  - JWT validation on frontend
  - CDN for static assets
  - Database connection pooling
