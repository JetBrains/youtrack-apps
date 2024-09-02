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
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "pack": "rm -rf <%= appName %>.zip && cd dist && zip -r ../<%= appName %>.zip .",
    "upload": "youtrack-app upload dist"
  },
  "dependencies": {
    "@jetbrains/ring-ui-built": "^6.0.56",
    "core-js": "3.38.0",
    "date-fns": "^3.6.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@jetbrains/eslint-config": "^5.4.2",
    "@jetbrains/youtrack-apps-tools": "^0.0.1-alpha.5",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^7.2.0",
    "@typescript-eslint/parser": "^7.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.57.0",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "eslint-plugin-react": "^7.34.1",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.6",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.0.1",
    "vite": "^5.4.1",
    "vite-plugin-static-copy": "^1.0.6"
  }
}
