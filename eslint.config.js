export default [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
      },
    },
    ignores: [
      'coverage/
    ],
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
    },
  },
]