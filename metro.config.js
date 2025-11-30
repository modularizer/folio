// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure Metro can resolve files from src/ directory
config.resolver.sourceExts = [...config.resolver.sourceExts];

// Configure Metro to serve static files from assets/ folder
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Serve files from assets/ folder at /assets/ path
      if (req.url.startsWith('/assets/')) {
        const filePath = path.join(__dirname, req.url);
        if (fs.existsSync(filePath)) {
          const stat = fs.statSync(filePath);
          const ext = path.extname(filePath).toLowerCase();
          
          // Set appropriate content type
          const contentTypes = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.webp': 'image/webp',
          };
          
          res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
          res.setHeader('Content-Length', stat.size.toString());
          return fs.createReadStream(filePath).pipe(res);
        }
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;

