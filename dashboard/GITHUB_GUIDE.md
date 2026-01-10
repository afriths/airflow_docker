# GitHub Repository Guide

## ✅ What TO push to GitHub:

### Source Code
- `src/` - All your React components, hooks, services, types, utils
- `public/` - Static assets like icons, images
- `index.html` - Main HTML template

### Configuration Files
- `package.json` - Dependencies and scripts
- `package-lock.json` - Exact dependency versions (important for reproducible builds)
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `eslint.config.js` - ESLint rules
- `.prettierrc`, `.prettierignore` - Code formatting rules
- `.env.example` - Template for environment variables (without actual values)

### Documentation
- `README.md` - Project documentation
- This `GITHUB_GUIDE.md` file

### Git Configuration
- `.gitignore` - Files to ignore

## ❌ What NOT to push to GitHub:

### Dependencies
- `node_modules/` - All installed packages (can be recreated with `npm install`)

### Build Outputs
- `dist/` - Production build files
- `build/` - Alternative build directory
- `.vite/` - Vite cache files

### Environment Variables
- `.env` - Contains actual API keys, secrets, URLs
- `.env.local`, `.env.development.local`, etc. - Local environment overrides

### Cache & Temporary Files
- `.eslintcache` - ESLint cache
- `.prettiercache` - Prettier cache
- `*.tsbuildinfo` - TypeScript build cache
- `.tmp/` - Temporary files

### Logs & Debug Files
- `*.log` - All log files
- `coverage/` - Test coverage reports

### Editor/OS Files
- `.vscode/` settings (except shared ones)
- `.idea/` - JetBrains IDE files
- `.DS_Store` - macOS system files
- `Thumbs.db` - Windows thumbnail cache

## 🔄 Setting up a new environment:

When someone clones your repository, they need to:

1. `npm install` - Install all dependencies
2. Copy `.env.example` to `.env` and fill in actual values
3. `npm run dev` - Start development server

## 📝 Best Practices:

- Always commit `package-lock.json` - ensures everyone has the same dependency versions
- Never commit `.env` files with real secrets
- Use `.env.example` to document required environment variables
- Keep `.gitignore` updated as the project grows