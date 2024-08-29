module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    '@jetbrains',
    '@jetbrains/eslint-config/react',
    '@jetbrains/eslint-config/browser',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'max-len': [
      'error',
      {
        code: 120,
        ignoreComments: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
        ignorePattern: '"(?=([^"]|"){40,}")|\'(?=([^\']|\'){40,}\')',
      },
    ],
  },
}
