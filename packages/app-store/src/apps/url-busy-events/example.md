# URL Busy Events App - Example Response

This diagram shows how the URL Busy Events app works:

```
┌─────────────────┐    HTTP GET     ┌──────────────────┐
│   Hacado App     │ ──────────────► │  External API    │
│                 │                 │                  │
│ - Start: 9:00   │                 │ - Query params:  │
│ - End: 17:00    │                 │   start, end     │
│ - Headers:     │                 │ - Headers:       │
│   Authorization │                 │   Authorization  │
│   X-Custom     │                 │   X-Custom       │
└─────────────────┘                 └──────────────────┘
         ▲                                    │
         │                                    │ JSON Response
         │                                    ▼
         │                          ┌──────────────────┐
         │                          │ Busy Events:     │
         │                          │ [                │
         │                          │   {              │
         │                          │     startAt:     │
         │                          │     endAt:       │
         │                          │     title:       │
         │                          │     uid:         │
         │                          │   }              │
         │                          │ ]                │
         │                          └──────────────────┘
         │
         └── Calendar Integration
```

## Header Configuration

Headers are configured as key-value pairs:

- **Authorization**: `Bearer your-token`
- **X-API-Key**: `your-api-key`
- **Content-Type**: `application/json`
- **Custom-Header**: `custom-value`

## Response Format

The external API should return a JSON array with this structure:

```json
[
  {
    "startAt": "2024-01-15T09:00:00Z",
    "endAt": "2024-01-15T10:00:00Z",
    "title": "Team Meeting",
    "uid": "meeting-123"
  },
  {
    "startAt": "2024-01-15T14:00:00Z",
    "endAt": "2024-01-15T15:30:00Z",
    "title": "Client Call",
    "uid": "client-call-456"
  }
]
```
