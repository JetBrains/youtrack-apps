---
to: package.json
---
{
  "name": "<%= appName %>",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build:frontend": "vite build",
    "build:backend": "vite -c vite.config.backend.ts build && sed -i '' 's/export export/export/g' src/api/api.zod.ts",
    "build": "npm run clean && npm run build:backend && npm run lint && npm run build:frontend && youtrack-app validate dist",
    "build:nolint": "npm run clean && npm run build:backend && npm run build:frontend && youtrack-app validate dist",
    "clean": "rm -f src/api/api.d.ts src/api/api.zod.ts",
    "preview": "vite preview",
    "lint": "eslint --report-unused-disable-directives --max-warnings 0",
    "test": "echo 'no tests'",
    "pack": "rm -rf <%= appName %>.zip && npx --yes bestzip <%= appName %>.zip dist/*",
    "upload": "youtrack-app upload dist",

    "upload-local": "youtrack-app upload dist --host http://localhost:8088/youtrack --token $YOUTRACK_TOKEN",
    "update": "npm run build && npm run upload-local",
    "watch:build": "nodemon --watch src --ext ts,tsx,css,json,js --ignore 'src/api/api.d.ts' --ignore 'src/api/api.zod.ts' --exec 'npm run build:nolint && npm run upload-local'",
    "watch-update": "npm run watch:build"
  },
  "dependencies": {
    "@jetbrains/ring-ui-built": "^7.0.8",
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
    "@types/fs-extra": "^11.0.4",
    "@types/node": "^24.0.14",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.4",
    "eslint": "^9.13.0",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "eslint-plugin-react": "^7.34.1",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.6",
    "fast-glob": "^3.3.3",
    "fs-extra": "^11.3.0",
    "globals": "^15.11.0",
    "nodemon": "^3.1.4",
    "ts-morph": "^26.0.0",
    "ts-to-zod": "^3.15.0",
    "typescript": "^5.7.2",
    "typescript-eslint": "^8.0.1",
    "vite": "^6.0.1",
    "vite-plugin-static-copy": "^2.2.0",
    "vite-tsconfig-paths": "^5.1.4"
  }
}
