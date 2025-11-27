# YouTrack Webhook Triggers App

Trigger external webhooks from YouTrack events such as issue creation, updates, deletion, comments, work items, and attachments. Supports secure HMAC-SHA256 authentication compatible with n8n and other webhook receivers.

## Features

- **Multiple Event Types**: Issue (create/update/delete), Comments (add/update/delete), Work Items (add/update/delete), Attachments (add/delete)
- **Secure Authentication**: HMAC-SHA256 signature with timestamp validation
- **Flexible Configuration**: Per-event webhook URLs or catch-all webhooks
- **Multiple Webhooks**: Send to multiple URLs per event (comma or newline separated)
- **Detailed Logging**: Debug-friendly logging for troubleshooting

## Installation

1. Download the app package (`webhook-triggers-app.zip`)
2. In YouTrack, go to **Administration** > **Apps**
3. Click **Upload App** and select the zip file
4. The app will be installed and available in all projects

## Configuration

### Step 1: Generate a Secure Secret

The webhook signature is required for security. Generate a strong random secret:

```bash
# Generate a 64-character hex secret (recommended)
openssl rand -hex 32
```

Example output: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`

**Important**: 
- Minimum 32 characters required
- Keep this secret secure - treat it like a password
- Use the same secret in your webhook receiver (e.g., n8n)

### Step 2: Configure Project Settings

1. Navigate to your project in YouTrack
2. Go to **Settings** > **Apps** > **Webhook Triggers**
3. Configure the following:

#### Required Settings

**Webhook Signature** (Required)
- Paste the secret generated in Step 1
- This must match the secret configured in your webhook receiver
- Minimum 32 characters

#### Event-Specific Webhooks

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

#### Catch-All Webhooks

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
   - **Header Name**: `X-YouTrack-Signature`
   - **Secret Key**: Paste the same secret from Step 1

4. Select events to listen for
5. Activate the workflow
6. Copy the webhook URL and paste it into YouTrack app settings

## Webhook Payload Format

The app sends JSON payloads with the following structure:

### Issue Events

```json
{
  "event": "issueCreated",
  "issue": {
    "id": "2-123",
    "idReadable": "PROJECT-123",
    "summary": "Issue title",
    "description": "Issue description",
    "created": 1732708800000,
    "updated": 1732708800000,
    "reporter": {
      "id": "user-id",
      "login": "username",
      "fullName": "User Name",
      "email": "user@example.com"
    },
    "project": {
      "id": "project-id",
      "shortName": "PROJECT",
      "name": "Project Name"
    }
  },
  "project": {
    "id": "project-id",
    "shortName": "PROJECT",
    "name": "Project Name"
  }
}
```

Event types:
- `issueCreated`
- `issueUpdated`
- `issueDeleted`

### Comment Events

```json
{
  "event": "commentAdded",
  "issue": { ... },
  "comment": {
    "id": "comment-id",
    "text": "Comment text",
    "author": { ... },
    "created": 1732708800000
  }
}
```

Event types:
- `commentAdded`
- `commentUpdated`
- `commentDeleted`

### Work Item Events

```json
{
  "event": "workItemAdded",
  "issue": { ... },
  "workItem": {
    "id": "work-item-id",
    "duration": 3600000,
    "date": 1732708800000,
    "author": { ... },
    "description": "Work description"
  }
}
```

Event types:
- `workItemAdded`
- `workItemUpdated`
- `workItemDeleted`

### Attachment Events

```json
{
  "event": "issueAttachmentAdded",
  "issue": { ... },
  "attachment": {
    "id": "attachment-id",
    "name": "file.pdf",
    "mimeType": "application/pdf",
    "size": 12345,
    "url": "https://youtrack.example.com/api/files/..."
  }
}
```

Event types:
- `issueAttachmentAdded`
- `issueAttachmentDeleted`

## Security

### HTTP Headers

Each webhook includes the following headers:

```
Content-Type: application/json
X-YouTrack-Signature: <your-secret-token>
```

The `X-YouTrack-Signature` header contains your configured secret token for authentication.


## Compatibility

- **YouTrack**: 2024.3.0 or later
- **Node.js**: 14+ (for development)
- **Webhook Receivers**: Any system supporting HMAC-SHA256 validation
  - n8n (with n8n-nodes-youtrack package)
  - Custom webhook receivers
  - Zapier, Make.com, etc. (with custom HMAC validation)

## Support

- **Issues**: TBU
- **Documentation**: TBU
- **n8n Integration**: TBU

## License

TBU

## Credits

Developed for use with [n8n workflow automation](https://n8n.io/) and YouTrack issue tracking.
