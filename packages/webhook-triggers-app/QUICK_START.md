# Quick Start Guide - Secure Webhooks

### Step 1: Generate Secret (30 seconds)

```bash
openssl rand -hex 32
```

Copy the output. Example: `a1b2c3d4e5f6...` (64 characters)

### Step 2: Configure n8n (2 minutes)

1. Open your n8n workflow
2. Add/Edit "YouTrack Trigger" node
3. Create new "YouTrack Webhook Auth API" credential:
   - **Authentication Method**: `Header Auth`
   - **Header Name**: `X-YouTrack-Signature`
   - **Secret Key**: Paste your secret from Step 1
4. Save credential
5. Select event (e.g., "Issue Created")
6. Activate workflow
7. **Copy the webhook URL** (e.g., `http://localhost:5678/webhook-test/...`)

### Step 3: Configure YouTrack (2 minutes)

1. Go to your YouTrack project
2. Settings > Apps > Webhook Triggers
3. Enter:
   - **Webhook Signature**: Paste same secret from Step 1
   - **Issue Created**: Paste webhook URL from Step 2
4. Save

### Step 4: Test

1. Create a new issue in YouTrack
2. Check if n8n workflow was triggered
3. Success!


## Important Notes

**Critical for Production**: Use HTTPS webhook URL (not HTTP)  
**Warning**: Simple auth over HTTP exposes your secret - always use HTTPS  
**Best Practice**: Rotate secret every 90-180 days  

