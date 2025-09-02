export default {
  '*.{ts,tsx,js,jsx,css,scss,njk}': ['prettier --write', 'eslint --fix'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
}
