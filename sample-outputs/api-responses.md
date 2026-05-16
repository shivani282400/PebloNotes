# Peblo Notes — Sample API Responses

## POST /auth/signup
```json
{
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Shivani Sharma",
    "email": "shivani@example.com",
    "createdAt": "2026-05-15T10:00:00.000Z"
  }
}
```

## POST /auth/login
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Shivani Sharma",
    "email": "shivani@example.com",
    "createdAt": "2026-05-15T10:00:00.000Z"
  }
}
```

## GET /notes
```json
{
  "notes": [
    {
      "id": "note-uuid-001",
      "title": "Sprint Planning — Week 20",
      "content": "## Goals\n- Ship auth module\n- Review PR #42\n\n## Blockers\nWaiting on design feedback...",
      "isArchived": false,
      "isPinned": true,
      "isPublic": false,
      "shareId": null,
      "color": "#ffffff",
      "wordCount": 47,
      "tags": [
        { "id": "tag-001", "name": "work", "color": "#6366f1" },
        { "id": "tag-002", "name": "meeting", "color": "#10b981" }
      ],
      "aiSummary": {
        "summary": "Sprint planning session focusing on shipping authentication and reviewing open PRs.",
        "suggestedTitle": "Sprint Planning Week 20",
        "updatedAt": "2026-05-15T11:30:00.000Z"
      },
      "createdAt": "2026-05-14T09:00:00.000Z",
      "updatedAt": "2026-05-15T11:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

## POST /notes/:id/generate-summary
```json
{
  "summary": {
    "id": "summary-uuid-001",
    "noteId": "note-uuid-001",
    "summary": "This note covers weekly sprint planning, including shipping the authentication module and reviewing PR #42. A design blocker is noted awaiting feedback.",
    "actionItems": [
      "Ship auth module",
      "Review PR #42",
      "Follow up on design feedback"
    ],
    "suggestedTitle": "Sprint Planning Week 20",
    "keyTopics": ["sprint planning", "authentication", "code review", "design feedback"],
    "sentiment": "neutral",
    "provider": "gemini",
    "modelUsed": "gemini-1.5-flash",
    "createdAt": "2026-05-15T11:30:00.000Z",
    "updatedAt": "2026-05-15T11:30:00.000Z"
  }
}
```

## POST /notes/:id/share
```json
{
  "shareId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "shareUrl": "http://localhost:3000/shared/f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

## GET /shared/:shareId
```json
{
  "note": {
    "id": "note-uuid-001",
    "title": "Sprint Planning — Week 20",
    "content": "## Goals\n- Ship auth module\n...",
    "color": "#ffffff",
    "wordCount": 47,
    "tags": [
      { "id": "tag-001", "name": "work", "color": "#6366f1" }
    ],
    "aiSummary": {
      "summary": "Sprint planning session focusing on shipping authentication...",
      "actionItems": ["Ship auth module", "Review PR #42"],
      "keyTopics": ["sprint", "auth", "PR review"],
      "sentiment": "neutral",
      "provider": "gemini",
      "modelUsed": "gemini-1.5-flash"
    },
    "author": "Shivani Sharma",
    "createdAt": "2026-05-14T09:00:00.000Z",
    "updatedAt": "2026-05-15T11:30:00.000Z"
  }
}
```

## GET /dashboard/insights
```json
{
  "insights": {
    "totalNotes": 14,
    "archivedNotes": 3,
    "totalWords": 4820,
    "recentNotes": [
      { "id": "note-001", "title": "Sprint Planning", "updatedAt": "2026-05-15T11:30:00Z", "wordCount": 47, "color": "#ffffff" }
    ],
    "ai": {
      "totalUsage": 9,
      "usageThisWeek": 4,
      "byProvider": [
        { "provider": "gemini", "count": 7 },
        { "provider": "groq", "count": 2 }
      ]
    },
    "topTags": [
      { "id": "tag-001", "name": "work", "color": "#6366f1", "count": 8 },
      { "id": "tag-002", "name": "ideas", "color": "#10b981", "count": 5 },
      { "id": "tag-003", "name": "meeting", "color": "#f59e0b", "count": 3 }
    ],
    "weeklyActivity": [
      { "date": "2026-05-09", "count": 0 },
      { "date": "2026-05-10", "count": 2 },
      { "date": "2026-05-11", "count": 1 },
      { "date": "2026-05-12", "count": 3 },
      { "date": "2026-05-13", "count": 0 },
      { "date": "2026-05-14", "count": 4 },
      { "date": "2026-05-15", "count": 2 }
    ]
  }
}
```
