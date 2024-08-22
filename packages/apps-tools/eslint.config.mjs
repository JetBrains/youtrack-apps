import globals from 'globals';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import js from '@eslint/js';
import {FlatCompat} from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends('prettier'),
  {
    files: ['*.ts'],
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
      'no-use-before-define': [2, 'nofunc'],
      'no-undef': 2,
      'no-unused-vars': 2,
      'no-undef-init': 2,
      'handle-callback-err': 2,
    },
  },
];
