# YouTrack Webhook Triggers App

[![official JetBrains project](https://jb.gg/badges/official-flat-square.svg)](https://github.com/JetBrains#jetbrains-on-github)

Trigger external webhooks from YouTrack events such as issue creation, updates, deletion, comments, work items, and attachments.

## Features

- **Multiple Event Types**: Issue (create/update/delete), Comments (add/update/delete), Work Items (add/update/delete), Attachments (add/delete)
- **Per-endpoint triggers**: One row per endpoint — pick the event, enter the URL, set that endpoint's own token. A compromised endpoint never exposes the others.


## Configuration

### Step 1: Generate a Secure Secret

Each trigger carries its own token. Generate a strong random secret per endpoint:

```bash
# Generate a 64-character hex secret (recommended)
openssl rand -hex 32
```

**Important**:
- Minimum 32 characters required
- Keep each secret secure - treat it like a password
- Use the same secret in the matching webhook receiver (e.g., n8n)

### Step 2: Configure Project Settings

1. Navigate to your project in YouTrack
2. Go to **Settings** > **Apps** > **Webhook Triggers**
3. Set the shared **Header name** (default `X-YouTrack-Token`) — the HTTP header each token is sent in.
4. Add one **Trigger** row per endpoint.

#### 2.1. Triggers

Each row is one endpoint with three fields:

- **Event**: which YouTrack event fires this webhook. One of:
  - **Issue Created / Updated / Deleted**
  - **Comment Added / Updated / Deleted**
  - **Work Item Added / Updated / Deleted**
  - **Attachment Added / Deleted**
  - **All events** — fires on every event type (useful for centralized logging, backups, analytics)
- **URL**: the endpoint that receives the event payload. HTTPS strongly recommended — the token is sent with every request. Example: `https://n8n.example.com/webhook/abc123/webhook`
- **Token**: the shared secret sent to *this* endpoint in the configured header. Minimum 32 characters. A row with no token is skipped (never sent unauthenticated).

Add multiple rows to fan out to several endpoints, including several rows for the same event with different URLs and tokens. Duplicate URLs are de-duplicated per event, and the row that wins is the first one in the list that matches — so put a row for a specific event above any **All events** row that names the same URL. At most 10 endpoints are called for any one event.

### Step 3: Configure Your Webhook Receiver

Your webhook receiver (e.g., n8n) must be configured to validate the signatures.

#### For n8n

1. Install the `n8n-nodes-youtrack` package
2. Add "YouTrack Trigger" node to your workflow
3. Configure **YouTrack Webhook Auth API** credential:
   - **Authentication Method**: `Header Auth`
   - **Header Name**: e.g. `X-YouTrack-Token`
   - **Secret Key**: Paste the same secret from Step 1

4. Select events to listen for
5. Activate the workflow
6. Copy the webhook URL and paste it into YouTrack app settings

## Webhook Payload Format

All payloads share a common base structure with event-specific fields added.

### Base Payload Structure

Every webhook payload includes these fields:

```json
{
  "event": "eventType",
  "timestamp": "2024-12-10T12:00:00.000Z",
  "id": "2-123",
  "numberInProject": 123,
  "summary": "Issue title",
  "project": {
    "id": "project-id",
    "name": "Project Name",
    "shortName": "PROJECT"
  }
}
```

### User Object Structure

When a user is included in the payload:

```json
{
  "login": "username",
  "fullName": "User Name",
  "email": "user@example.com"
}
```

### Issue Created

```json
{
  "event": "issueCreated",
  "timestamp": "2024-12-10T12:00:00.000Z",
  "id": "2-123",
  "numberInProject": 123,
  "summary": "Issue title",
  "project": { "id": "...", "name": "...", "shortName": "..." },
  "description": "Issue description text",
  "created": 1732708800000,
  "reporter": { "login": "...", "fullName": "...", "email": "..." }
}
```

### Issue Updated
**Important**: you will see one 'field change' item in changedFields array per webhook request if issue was amended manually via UI.
```json
{
  "event": "issueUpdated",
  "timestamp": "2024-12-10T12:00:00.000Z",
  "id": "2-123",
  "numberInProject": 123,
  "summary": "Issue title",
  "project": { "id": "...", "name": "...", "shortName": "..." },
  "description": "Issue description text",
  "updated": 1732708800000,
  "updatedBy": { "id": "...", "login": "...", "fullName": "...", "email": "..." },
  "changedFields": [
    {
      "name": "summary",
      "oldValue": "Old title",
      "value": "New title"
    }
  ]
}
```

### Issue Deleted

```json
{
  "event": "issueDeleted",
  "timestamp": "2024-12-10T12:00:00.000Z",
  "id": "2-123",
  "numberInProject": 123,
  "summary": "Issue title",
  "project": { "id": "...", "name": "...", "shortName": "..." },
  "description": "Issue description text"
}
```

### Comment Added / Updated / Deleted

```json
{
  "event": "commentAdded",
  "timestamp": "2024-12-10T12:00:00.000Z",
  "id": "2-123",
  "numberInProject": 123,
  "summary": "Issue title",
  "project": { "id": "...", "name": "...", "shortName": "..." },
  "comments": [
    {
      "id": "comment-id",
      "text": "Full comment text",
      "textPreview": "Comment preview...",
      "created": 1732708800000,
      "updated": 1732708800000,
      "author": { "id": "...", "login": "...", "fullName": "...", "email": "..." }
    }
  ]
}
```

Event types: `commentAdded`, `commentUpdated`, `commentDeleted`

### Work Item Added / Updated / Deleted

```json
{
  "event": "workItemAdded",
  "timestamp": "2024-12-10T12:00:00.000Z",
  "id": "2-123",
  "numberInProject": 123,
  "summary": "Issue title",
  "project": { "id": "...", "name": "...", "shortName": "..." },
  "workItems": [
    {
      "id": "work-item-id",
      "date": 1732708800000,
      "duration": 3600000,
      "description": "Work description",
      "created": 1732708800000,
      "updated": 1732708800000,
      "author": { "id": "...", "login": "...", "fullName": "...", "email": "..." },
      "type": { "id": "type-id", "name": "Development" }
    }
  ]
}
```

Event types: `workItemAdded`, `workItemUpdated`, `workItemDeleted`

### Attachment Added / Deleted

```json
{
  "event": "issueAttachmentAdded",
  "timestamp": "2024-12-10T12:00:00.000Z",
  "id": "2-123",
  "numberInProject": 123,
  "summary": "Issue title",
  "project": { "id": "...", "name": "...", "shortName": "..." },
  "attachments": [
    {
      "name": "file.pdf",
      "mimeType": "application/pdf",
      "size": 12345,
      "created": 1732708800000,
      "author": { "id": "...", "login": "...", "fullName": "...", "email": "..." }
    }
  ]
}
```

Event types: `issueAttachmentAdded`, `issueAttachmentDeleted`

## Security

### HTTP Headers

Each webhook includes the following headers:

```
Content-Type: application/json
<Header-Name>: <your-secret-token>
```

The header name is configurable (defaults to `X-YouTrack-Token`) and contains your configured secret token for authentication.

## Limitations

### At most 10 endpoints per event

Delivery runs as an async function chain: the rule dispatches the first URL, and each response
handler dispatches the next. Every URL costs one async hop, and the server's `maxChainLength` is 10
by default — so **at most 10 endpoints are called for any single event**. If more rows match one
event (its own rows plus any **All events** rows), the extras are skipped and a warning is logged:

```
[webhooks] 12 valid triggers configured for Issue Created but max is 10 per event
(async chain limit). Extra triggers dropped.
```

The cap is per event, not per app: one row for each of the 11 event types stays well inside it, and
the number of rows overall is not limited.

### 5 second timeout per request

Each request is given 5 seconds. A slower endpoint gets no status code, which is logged as a
timeout, and the chain moves on to the next URL — one slow receiver does not stop the others.

**Recommendation:** have endpoints acknowledge immediately and do their work asynchronously.

### Delivery is not retried

A failed or timed-out webhook is logged and dropped; nothing re-sends it. Endpoints that need
guaranteed delivery should sit behind a queue that owns the retrying.

### One request per endpoint per event

Duplicate URLs are de-duplicated per event, so an endpoint listed twice for one event is called
once. The token it is called with comes from **the first matching row in the list** — which is a
question of row order, not of how specific the row is: an **All events** row placed above an
event-specific row for the same URL is the one whose token is used. Keep the specific row first.

### A row without a token is skipped

Rather than send an unauthenticated request, a row whose token is empty is skipped with a warning.
The same applies to the whole chain if **Header name** is cleared while it is running.

## Credits

Developed for use with [n8n workflow automation](https://n8n.io/) and YouTrack issue tracking.
