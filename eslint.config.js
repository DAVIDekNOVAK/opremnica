// ESLint za celoten projekt: backend (Node.js) in frontend (brskalnik).
// Zaženi v korenu repozitorija z: npm ci && npm run lint
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['**/node_modules/', 'backend/data/', '**/coverage/'],
  },

  // priporočena pravila za ves JavaScript v projektu
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // backend, vsi testi in ta datoteka tečejo v Node.js
  {
    files: ['backend/**/*.js', 'test/**/*.js', '*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },

  // frontend teče v brskalniku
  {
    files: ['frontend/**/*.js'],
    languageOptions: {
      globals: globals.browser,
    },
  },
];
