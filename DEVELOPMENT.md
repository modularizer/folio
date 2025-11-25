# Folio Development Guide

## ✅ Clean Architecture

- **No `app/` folder** - Removed legacy Expo Router file-based routing
- **No expo-router** - Using native browser APIs instead
- **Single source of truth** - All components in `src/`
- **No duplicate code** - Dev and production use the same components

## 🚀 Development Workflow

### Start Development Server

```bash
npm run dev
```

This will:
- Start webpack-dev-server on `http://localhost:3000`
- Open your browser automatically
- Enable **hot module reloading** (changes appear instantly)
- Use the configuration in `src/dev-entry.tsx`

### Configure Development

Create a `.env` file in the project root:

```bash
# .env
EXPO_PUBLIC_GITHUB_USERNAME=your-username
EXPO_PUBLIC_GITHUB_TOKEN=your-github-token-optional

# Optional theme customization
EXPO_PUBLIC_THEME_PRIMARY_COLOR=#007AFF
EXPO_PUBLIC_THEME_BACKGROUND_COLOR=#FFFFFF
```

The dev server will automatically load these variables. Restart the dev server after changing `.env`:

```bash
# Stop the server (Ctrl+C)
npm run dev
```

## 📦 Build for Production

### Build the Bundle

```bash
npm run build
```

This creates `dist/folio.bundle.js` that can be embedded anywhere:

```html
<script src="folio.bundle.js?username=modularizer&init=true"></script>
```

### Watch Mode (Auto-rebuild on changes)

```bash
npm run build:watch
```

## 📁 Project Structure

```
folio/
├── src/
│   ├── bundle/
│   │   └── BundleApp.tsx          # Main app component
│   ├── components/                 # All React components
│   ├── contexts/                   # React contexts
│   ├── utils/                      # Utilities
│   ├── bundle-entry.tsx           # Bundle entry (with auto-init)
│   └── dev-entry.tsx              # Dev entry (hot reload)
├── user/
│   ├── profile.ts                 # Your profile data
│   └── projects.ts                # Your projects (if any)
├── webpack.config.js              # Production bundle config
├── webpack.dev.config.js          # Development server config
└── dist/                          # Built bundles
```

## 🔧 Configuration Files

### `webpack.dev.config.js`
- Development server with hot reload
- Source maps for debugging
- Uses `src/dev-entry.tsx`

### `webpack.config.js`
- Production bundle build
- Minified and optimized
- UMD format for easy embedding
- Uses `src/bundle-entry.tsx`

## 🎯 Key Features

### ✅ No Duplication
- Dev and production use the same `BundleApp.tsx`
- All components in `src/` are shared
- No legacy code

### ✅ Hot Reloading
- Changes appear instantly in dev
- No manual refresh needed
- Fast development cycle

### ✅ Native Browser APIs
- No expo-router dependency
- Hash-based routing
- Standard browser history API

### ✅ Production Ready
- Single-file bundle
- Easy embedding with script tag
- Auto-initialization options

## 📝 Common Tasks

### Add a New Component
1. Create in `src/components/YourComponent.tsx`
2. Import in `BundleApp.tsx` or wherever needed
3. Hot reload will pick it up automatically

### Update Styling
1. Edit the component's StyleSheet
2. Changes appear instantly in dev

### Test Production Bundle
1. Run `npm run build`
2. Open `dist/` folder
3. Create test HTML file:
```html
<!DOCTYPE html>
<html>
<body>
  <script src="folio.bundle.js?username=YOUR_USERNAME&init=true"></script>
</body>
</html>
```

## 🚫 What Was Removed

- ❌ `app/` folder (Expo Router structure)
- ❌ expo-router dependency from components
- ❌ File-based routing
- ❌ All Expo-specific development scripts
- ❌ Duplicate/legacy code

## ✅ What Was Kept

- ✅ All original components
- ✅ React Native Web
- ✅ Original styling
- ✅ GitHub API integration
- ✅ All features and functionality

