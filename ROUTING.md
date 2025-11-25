# Routing Architecture

This document explains how routing works in both development and production bundle modes.

## Overview

The project uses **expo-router** for development (Metro bundler) and **shimmed expo-router** for webpack bundles. The same `app/` directory is used for both modes - **no code duplication**.

## Architecture

### 1. Development Mode (Metro + Expo Router)
- Uses native expo-router with Metro bundler
- File-based routing from `app/` directory
- Full expo-router API available

### 2. Production Bundle Mode (Webpack + Shimmed Expo Router)
- Uses webpack to bundle for standalone HTML deployment
- `expo-router` is aliased to `/src/shims/expo-router.web.tsx`
- Custom path-based router (`/src/utils/router.tsx`) powers the shims
- **Same `app/` files** are imported and rendered by `BundleApp`

## Routes

All routes are defined by the `app/` directory structure:

| Route Pattern | File | Description |
|--------------|------|-------------|
| `/` | `app/index.tsx` | Home page (default GitHub user) |
| `/:project` | `app/[project]/index.tsx` | Project detail page |
| `/github/:username` | `app/github/[username].tsx` | GitHub user profile |
| `/@:username` | Mapped to `/github/:username` | Shorthand for GitHub user |
| `/@:username/:project` | `app/[project]/index.tsx` | Specific user's project |

## URL Patterns

### Clean Path-Based URLs (NO HASH)
- ✅ `/folio` - Project detail
- ✅ `/github/octocat` - GitHub user
- ✅ `/@octocat` - Shorthand GitHub user
- ✅ `/@octocat/repo-name` - Specific user's project
- ✅ `/?filter=typescript` - Search params work
- ❌ `/#/folio` - Hash-based routing is NOT used

## How It Works

### Bundle Mode Flow

1. **Webpack Config** (`webpack.config.js`, `webpack.dev.config.js`)
   - Aliases `expo-router` to shim: `/src/shims/expo-router.web.tsx`
   - Aliases `expo-status-bar` to no-op shim: `/src/shims/expo-status-bar.web.tsx`

2. **Expo Router Shim** (`/src/shims/expo-router.web.tsx`)
   - Implements expo-router API (`useRouter`, `useLocalSearchParams`, `Stack`, etc.)
   - Delegates to custom path-based router (`/src/utils/router.tsx`)
   - Provides same API as real expo-router but works in webpack

3. **Custom Router** (`/src/utils/router.tsx`)
   - Uses History API for clean URLs (no hash)
   - Parses pathname and search params
   - Matches dynamic route patterns
   - Fires `popstate` events for browser back/forward

4. **BundleApp** (`/src/bundle/BundleApp.tsx`)
   - Sets environment variables (`EXPO_PUBLIC_GITHUB_USERNAME`, etc.)
   - Renders appropriate `app/` screen based on current route
   - Uses same providers as `app/_layout.tsx`
   - **Imports directly from `app/`** - no code duplication

5. **App Screens** (`app/*.tsx`)
   - Use expo-router hooks (`useRouter`, `useLocalSearchParams`)
   - Work identically in both dev and bundle modes
   - No awareness of shim vs real expo-router

## File Structure

```
folio/
├── app/                              # Expo router file-based routing
│   ├── _layout.tsx                   # Root layout with providers
│   ├── index.tsx                     # Home screen (/)
│   ├── [project]/
│   │   └── index.tsx                 # Project detail (/:project)
│   └── github/
│       └── [username].tsx            # GitHub user (/github/:username)
│
├── src/
│   ├── bundle/
│   │   └── BundleApp.tsx             # Bundle entry - renders app/ screens
│   ├── shims/
│   │   ├── expo-router.web.tsx       # Expo router shim for webpack
│   │   └── expo-status-bar.web.tsx   # Status bar shim (no-op on web)
│   ├── utils/
│   │   └── router.tsx                # Custom path-based router
│   └── components/
│       └── ProjectCard.tsx           # Uses router.navigate()
│
├── webpack.config.js                 # Aliases expo-router to shim
└── webpack.dev.config.js             # Same aliases for dev bundle
```

## Navigation

### From Code

```typescript
import { useRouter } from 'expo-router'; // Works in both modes!

function MyComponent() {
  const router = useRouter();
  
  // Navigate to project
  router.push('/folio');
  
  // Navigate with params
  router.push('/github/octocat');
  
  // Go back
  router.back();
  
  // Replace current route
  router.replace('/');
}
```

### From Project Cards

Project cards use the router's `navigate()` function:

```typescript
const { navigate } = useRouter();
const handlePress = () => navigate(`/${slug}`);
```

### Browser Navigation
- Back/forward buttons work correctly
- Direct URL access works (e.g., visiting `/folio` directly)
- Refresh preserves current route

## Search Parameters

URL search params are fully supported:

```typescript
import { useLocalSearchParams } from 'expo-router';

function MyScreen() {
  const { filter, sort } = useLocalSearchParams<{ 
    filter?: string; 
    sort?: string;
  }>();
  
  // URL: /projects?filter=typescript&sort=stars
  // filter = "typescript"
  // sort = "stars"
}
```

## Development

### Dev Mode (Expo + Metro)
```bash
npm run start
# or: npm start
```
Uses real expo-router with Metro bundler. No shims needed - native expo-router experience.

### Bundle Dev Mode (Webpack Dev Server)
```bash
npm run dev
```
Uses expo-router shims with webpack dev server. Same app/ files, hot reload enabled.

### Production Bundle
```bash
npm run build
```
Creates `dist/folio.bundle.js` that can be used in any HTML page:

```html
<!DOCTYPE html>
<html lang="en">
<body>
  <script src="dist/folio.bundle.js?username=modularizer&init=true"></script>
</body>
</html>
```

## Key Benefits

1. **Single Source of Truth**: All routing logic lives in `app/` directory
2. **No Code Duplication**: Both modes use the exact same components
3. **Clean URLs**: Path-based routing, no hash symbols
4. **Search Params**: Fully parsed and available via `useLocalSearchParams()`
5. **Browser Navigation**: Back/forward buttons work correctly
6. **Direct URL Access**: Can navigate directly to any route via URL
7. **Expo Router API**: Identical API in both dev and bundle modes

## Troubleshooting

### Route not matching
Check `/src/utils/router.tsx` - the `parseRoute()` function defines all route patterns.

### expo-router import errors
Ensure webpack config has the alias:
```javascript
'expo-router$': path.resolve(__dirname, 'src/shims/expo-router.web.tsx')
```

### Search params not working
Make sure you're using `useLocalSearchParams()` from `expo-router`, not reading `window.location.search` directly.

### Navigation doesn't update page
The router dispatches `popstate` events - make sure components are using `useRouter()` or `useLocalSearchParams()` hooks to react to route changes.

