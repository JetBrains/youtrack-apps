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
    "build": "tsc -p tsconfig.app.json && vite build && youtrack-app validate dist",
    "lint": "eslint --report-unused-disable-directives --max-warnings 0",
    "test": "echo 'no tests'",
    "pack": "rm -rf <%= appName %>.zip && npx --yes bestzip <%= appName %>.zip dist/*",
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
    "@eslint/compat": "^1.2.1",
    "@eslint/eslintrc": "^3.1.0",
    "@eslint/js": "^9.13.0",
    "@jetbrains/eslint-config": "^6.0.2",
    "@jetbrains/youtrack-apps-tools": "^0.0.1",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.4",
    "eslint": "^9.13.0",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "eslint-plugin-react": "^7.34.1",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.6",
    "globals": "^15.11.0",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.0.1",
    "vite": "^6.0.1",
    "vite-plugin-static-copy": "^2.2.0"
  }
}
