# Set up the CLI (youtrack-apps)

## Step 1. Clone the repos:

Go to non-project folder.

```bash
git clone https://github.com/JetBrains/youtrack-apps.git
cd youtrack-apps
```
## Step 2. Build the tool package (required — the scaffolded app links against it)

```bash
cd packages/apps-tools
npm install 
npm run build
```

## Step 3. Link both packages globally so they can be resolved:
Register the tool package in your local npm registry

```bash
npm link
cd ../..
```

Register the CLI

```bash
cd packages/create-youtrack-app
npm install
npm link
```

CLI is ready to use