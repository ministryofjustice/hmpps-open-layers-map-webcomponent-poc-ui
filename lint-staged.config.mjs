export default {
  '*.{ts,tsx,js,jsx,css,scss}': ['prettier --write', 'eslint --fix'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
}
