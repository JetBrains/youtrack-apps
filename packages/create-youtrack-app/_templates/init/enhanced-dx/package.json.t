---
to: package.json
---
{
  "name": "<%= appName %>",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "enhancedDX": "true",
  "scripts": {
    "build:frontend": "vite build",
    "build:backend": "vite -c vite.config.backend.ts build",
    "build": "npm run clean && npm run build:backend && npm run lint && npm run build:frontend && youtrack-app validate dist",
    "build:nolint": "npm run clean && npm run build:backend && npm run build:frontend && youtrack-app validate dist",
    "clean": "rm -f src/api/api.d.ts src/api/api.zod.ts",
    "preview": "vite preview",
    "lint": "eslint --report-unused-disable-directives --max-warnings 0",
    "test": "echo 'no tests'",
    "pack": "rm -rf <%= appName %>.zip && npx --yes bestzip <%= appName %>.zip dist/*",
    "upload": "youtrack-app upload dist",

    "upload-local": "set -a && source .env && set +a && youtrack-app upload dist --host $YOUTRACK_HOST --token $YOUTRACK_TOKEN",
    "update": "npm run build && npm run upload-local",
    "prepare:watch": "npm run clean && rm -rf dist/widgets/assets && vite -c vite.config.backend.ts build --mode development",
    "watch:backend": "vite -c vite.config.backend.ts build --watch --mode development",
    "watch:frontend": "vite build --watch",
    "watch:frontend:hmr": "DEV_MODE=true vite build --watch",
    "watch:coordinator": "youtrack-upload-coordinator --watch .build-state.json",
    "watch": "npm run prepare:watch && rm -f .backend-changed .build-state.json && (AUTOUPLOAD=true npm run watch:backend & while [ ! -f src/api/api.d.ts ] || [ ! -f src/api/api.zod.ts ]; do sleep 0.5; done && AUTOUPLOAD=true npm run watch:frontend & npm run watch:coordinator)",
    "dev": "npm run prepare:watch && npm run dev:upload && rm -f .backend-changed .build-state.json && (npm run hmr & AUTOUPLOAD=true npm run watch:backend & while [ ! -f src/api/api.d.ts ] || [ ! -f src/api/api.zod.ts ]; do sleep 0.5; done && AUTOUPLOAD=true npm run watch:frontend:hmr & npm run watch:coordinator)",

    "hmr": "vite",
    "dev:build": "npm run clean && npm run build:backend && DEV_MODE=true npm run build:frontend",
    "dev:upload": "npm run dev:build && npm run upload-local",

    "generate": "npx @jetbrains/create-youtrack-app",
    "g": "npm run generate --"
  },
  "dependencies": {
    "@jetbrains/ring-ui-built": "^7.0.8",
    "@jetbrains/youtrack-enhanced-dx-tools": "^0.0.1",
    "core-js": "3.38.0",
    "loglevel": "^1.9.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zod": "^4.0.5"
  },
  "devDependencies": {
    "@eslint/compat": "^1.2.1",
    "@eslint/eslintrc": "^3.1.0",
    "@eslint/js": "^9.13.0",
    "@jetbrains/eslint-config": "^6.0.2",
    "@jetbrains/youtrack-apps-tools": "^0.0.1",
    "@types/node": "^24.0.14",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.4",
    "eslint": "^9.13.0",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "eslint-plugin-react": "^7.34.1",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.6",
    "globals": "^15.11.0",
    "nodemon": "^3.1.4",
    "ts-to-zod": "^3.15.0",
    "typescript": "^5.7.2",
    "typescript-eslint": "^8.0.1",
    "vite": "^6.0.1",
    "vite-plugin-static-copy": "^2.2.0",
    "vite-tsconfig-paths": "^5.1.4"
  }
}
