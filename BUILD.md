# Build Guide

## Quick Start

### Build the Bundle
```bash
npm run build
```

This creates `dist/folio.bundle.js` which can be embedded in any HTML page.

### Test the Bundle Locally
```bash
npm run dev
```

This runs webpack dev server at http://localhost:8090 with hot reload.

## Bundle Architecture

### Entry Flow
```
bundle-entry.tsx
  └─> BundleApp (src/bundle/BundleApp.tsx)
       └─> Imports from app/ directory:
            ├─> app/index.tsx (Home)
            ├─> app/[project]/index.tsx (Project Detail)
            └─> app/github/[username].tsx (GitHub User)
```

### No Code Duplication ✅
- **Single source of truth**: All pages are in `app/` directory
- **Used by both**:
  - `npm start` → Metro bundler → Real expo-router
  - `npm run build` → Webpack → Shimmed expo-router
- **Same components, same code**

### How It Works
1. Webpack aliases `expo-router` → `/src/shims/expo-router.web.tsx`
2. Shim provides expo-router API powered by custom router
3. `BundleApp` imports screens from `app/` directory
4. Renders appropriate screen based on URL route

## Usage

### Simple Embed
```html
<!DOCTYPE html>
<html lang="en">
<body>
  <script src="dist/folio.bundle.js?username=modularizer&init=true"></script>
</body>
</html>
```

### With Container
```html
<!DOCTYPE html>
<html lang="en">
<body>
  <div id="portfolio"></div>
  <script src="dist/folio.bundle.js?username=modularizer&init=portfolio"></script>
</body>
</html>
```

### Manual Initialization
```html
<!DOCTYPE html>
<html lang="en">
<body>
  <div id="app"></div>
  <script src="dist/folio.bundle.js"></script>
  <script>
    Folio.init({
      container: '#app',
      githubUsername: 'modularizer',
      githubToken: 'ghp_xxxxx' // Optional
    });
  </script>
</body>
</html>
```

## Configuration Options

### Script Tag Query Params
| Param | Description | Example |
|-------|-------------|---------|
| `username` or `github` | GitHub username | `?username=octocat` |
| `token` | GitHub API token | `?token=ghp_xxxxx` |
| `init` | Auto-initialize | `?init=true` or `?init=containerId` |
| `theme` | Theme name | `?theme=dark` |
| `primary` | Primary color | `?primary=%23ff0000` |
| `bg` | Background color | `?bg=%23000000` |

### Data Attributes
```html
<script 
  src="dist/folio.bundle.js"
  data-github-username="modularizer"
  data-github-token="ghp_xxxxx"
  data-theme="dark"
></script>
```

### Manual Init API
```javascript
Folio.init({
  container: '#app',           // Required
  githubUsername: 'modularizer', // Required
  githubToken: 'ghp_xxxxx',    // Optional
  theme: {                     // Optional
    colors: {
      primary: '#ff0000'
    }
  }
});
```

## Build Output

After running `npm run build`, you'll find:

```
dist/
├── folio.bundle.js           # Main bundle (~2-3MB)
└── folio.bundle.js.LICENSE.txt # License info
```

### Bundle Contents
- React & React DOM
- React Native Web
- All your components from `app/`
- Expo router shims
- Custom router
- Storage manager
- GitHub API utilities
- All dependencies

## Development Workflow

### 1. Develop with Expo (Recommended)
```bash
npm start
```
- Uses Metro bundler
- Real expo-router with fast refresh
- Best development experience
- Access at http://localhost:8081

### 2. Test Bundle Locally
```bash
npm run dev
```
- Uses webpack dev server
- Shimmed expo-router
- Tests bundle behavior
- Access at http://localhost:8090

### 3. Build for Production
```bash
npm run build
```
- Creates optimized bundle
- Minified and production-ready
- Output in `dist/folio.bundle.js`

### 4. Watch Mode (Optional)
```bash
npm run build:watch
```
- Rebuilds on file changes
- Useful for testing build issues

## Routing in Bundle

The bundle uses **path-based routing** (no hash):

| URL | Screen |
|-----|--------|
| `/` | Home (your GitHub profile) |
| `/folio` | Project detail for "folio" |
| `/github/octocat` | GitHub user "octocat" |
| `/@octocat` | Shorthand for `/github/octocat` |
| `/@octocat/repo` | User's specific project |

All routes work with:
- Direct URL access
- Browser back/forward buttons
- URL search params (e.g., `?filter=typescript`)

## Deployment

### Static Hosting (GitHub Pages, Netlify, etc.)

1. Build the bundle:
   ```bash
   npm run build
   ```

2. Create `index.html`:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>My Portfolio</title>
   </head>
   <body>
     <script src="folio.bundle.js?username=YOUR_GITHUB_USERNAME&init=true"></script>
   </body>
   </html>
   ```

3. Deploy `dist/` directory

### CDN Hosting

Upload `dist/folio.bundle.js` to your CDN, then use it:

```html
<script src="https://cdn.example.com/folio.bundle.js?username=modularizer&init=true"></script>
```

## Troubleshooting

### Bundle is too large
The bundle includes React, React Native Web, and all dependencies. This is expected (~2-3MB).

To reduce size:
- Ensure production build: `npm run build` (not `npm run dev`)
- Enable gzip compression on your server
- Consider code splitting (advanced)

### Routes don't work after page refresh
Make sure your server is configured to serve `index.html` for all routes:

**Netlify**: Create `_redirects`:
```
/*    /index.html   200
```

**Apache**: Add to `.htaccess`:
```
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

**Nginx**: Add to config:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### expo-router errors
The bundle shims expo-router. If you see errors, check:
1. Webpack config has expo-router alias
2. Shim file exists: `src/shims/expo-router.web.tsx`
3. Clear webpack cache: `rm -rf node_modules/.cache`

### Environment variables not working
In bundle mode, set them via:
1. Bundle config: `githubUsername`, `githubToken`
2. Query params: `?username=x&token=y`
3. Data attributes: `data-github-username="x"`

`.env` files only work with `npm start` (Metro bundler).

## Files Overview

### Core Bundle Files
- `src/bundle-entry.tsx` - Bundle entry point (production)
- `src/dev-entry.tsx` - Dev entry point (webpack dev server)
- `src/bundle/BundleApp.tsx` - Main app component (imports from `app/`)

### Routing
- `app/` - All screens and routes (single source of truth)
- `src/utils/router.tsx` - Custom path-based router
- `src/shims/expo-router.web.tsx` - Expo router shim for webpack

### Build Config
- `webpack.config.js` - Production bundle config
- `webpack.dev.config.js` - Dev server config
- `package.json` - Build scripts

## Clean Architecture

✅ **Single source of truth**: `app/` directory  
✅ **No code duplication**: Same files for both modes  
✅ **Clean URLs**: Path-based routing (no hash)  
✅ **Type safe**: Full TypeScript support  
✅ **Extensible**: Easy to add new routes in `app/`  

## Summary

```bash
# Development (recommended)
npm start              # Expo + Metro + Real expo-router

# Bundle testing
npm run dev           # Webpack dev server + Shimmed expo-router

# Production bundle
npm run build         # Creates dist/folio.bundle.js

# Deploy
# Upload dist/ folder to any static host
```

**Everything originates from `app/` - zero duplication!** 🎉

