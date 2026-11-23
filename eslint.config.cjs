module.exports = [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
      },
    },
    ignores: ['coverage/'],
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
    },
  },
]
