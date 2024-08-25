import globals from 'globals';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  files: ['src/**/*.ts', 'lib/**/*.ts'],
  extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
  plugins: {},

  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.jest,
    },

    ecmaVersion: 2023,
    sourceType: 'module',
  },

  rules: {
    'one-var': [2, 'never'],
    camelcase: 2,
    'new-cap': 0,
    'no-unreachable': 2,
    'no-extra-boolean-cast': 2,
    'valid-jsdoc': 0,
    'no-lonely-if': 2,
    'no-bitwise': 2,
    'no-div-regex': 2,
    curly: 0,
    eqeqeq: 2,
    yoda: 2,
    'no-caller': 2,
    'no-dupe-args': 2,
    'no-debugger': 2,
    'no-console': 0,
    'no-shadow-restricted-names': 2,
    'no-label-var': 2,
    'no-delete-var': 2,
    'no-use-before-define': 'off',
    'no-undef': 2,
    'no-unused-vars': 'off',
    'no-undef-init': 2,
    'handle-callback-err': 2,
    'no-prototype-builtins': 'off',
    '@typescript-eslint/no-require-imports': ['error', {allow: ['/package\\.json$', '/index$']}],
    '@typescript-eslint/no-use-before-define': ['error', 'nofunc'],
  },
});
