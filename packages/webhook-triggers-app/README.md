# YouTrack Webhook Triggers App

[![official JetBrains project](https://jb.gg/badges/official-flat-square.svg)](https://github.com/JetBrains#jetbrains-on-github)

Trigger external webhooks from YouTrack events such as issue creation, updates, deletion, comments, work items, and attachments.

## Features

- **Multiple Event Types**: Issue (create/update/delete), Comments (add/update/delete), Work Items (add/update/delete), Attachments (add/delete)
- **Multiple Webhooks**: Send to multiple URLs per event (comma or newline separated)


## Configuration

### Step 1: Generate a Secure Secret

The webhook token is required for security. Generate a strong random secret:

```bash
# Generate a 64-character hex secret (recommended)
openssl rand -hex 32
```

**Important**: 
- Minimum 32 characters required
- Keep this secret secure - treat it like a password
- Use the same secret in your webhook receiver (e.g., n8n)

### Step 2: Configure Project Settings

1. Navigate to your project in YouTrack
2. Go to **Settings** > **Apps** > **Webhook Triggers**
3. Configure the following:

#### 2.1. Webhook Token (Required)
- Paste the secret generated in Step 1
- This must match the secret configured in your webhook receiver
- Minimum 32 characters

#### 2.2. Event-Specific Webhooks

Configure webhook URLs for specific events:

- **Issue Created**: Triggered when a new issue is created
- **Issue Updated**: Triggered when an issue is modified
- **Issue Deleted**: Triggered when an issue is deleted
- **Comment Added**: Triggered when a comment is added
- **Comment Updated**: Triggered when a comment is edited
- **Comment Deleted**: Triggered when a comment is removed
- **Work Item Added**: Triggered when time is logged
- **Work Item Updated**: Triggered when a work item is modified
- **Work Item Deleted**: Triggered when a work item is removed
- **Attachment Added**: Triggered when a file is attached
- **Attachment Deleted**: Triggered when an attachment is removed

**Format**: Enter one or more webhook URLs:
- Multiple URLs: Separate with commas or newlines
- Example: `https://n8n.example.com/webhook/abc123/webhook`

#### 2.3. Catch-All Webhooks

**All Events**: URLs that receive all events regardless of type

This is useful for:
- Centralized logging
- Backup webhooks
- Analytics systems

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
  "reporter": { "id": "...", "login": "...", "fullName": "...", "email": "..." }
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
      "id": "attachment-id",
      "name": "file.pdf",
      "mimeType": "application/pdf",
      "size": 12345,
      "created": 1732708800000,
      "author": { "id": "...", "login": "...", "fullName": "...", "email": "..." },
      "url": "https://youtrack.example.com/api/files/..."
    }
  ]
}
```

Event types: `issueAttachmentAdded`, `issueAttachmentDeleted`

> **Note**: The `id` and `url` fields in attachments may not always be available depending on the YouTrack configuration.

## Security

### HTTP Headers

Each webhook includes the following headers:

```
Content-Type: application/json
<Header-Name>: <your-secret-token>
```

The header name is configurable (defaults to `X-YouTrack-Token`) and contains your configured secret token for authentication.

## Limitations

### No Connection Timeout Control
If a webhook endpoint is slow or unresponsive, the workflow will block until
YouTrack's internal timeout (platform-controlled) is reached.

**Recommendation:** Ensure your webhook endpoints respond within 2 seconds,
or use a fast intermediary service that acknowledges immediately and processes
asynchronously.

### Synchronous Webhook Delivery

YouTrack workflows execute synchronously, meaning each webhook is sent
sequentially and blocks until the endpoint responds. 

**Best practice:** limit the number of webhook URLs per event.

## Credits

Developed for use with [n8n workflow automation](https://n8n.io/) and YouTrack issue tracking.
