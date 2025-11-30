const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const Dotenv = require('dotenv-webpack');

// Collect environment variables that should be exposed to the bundle
function getEnvVars() {
  const envVars = {};
  // Load from .env file if it exists
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available or .env doesn't exist, continue
  }
  
  // Expose all EXPO_PUBLIC_* and REACT_APP_* variables
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('EXPO_PUBLIC_') || key.startsWith('REACT_APP_')) {
      envVars[key] = JSON.stringify(process.env[key]);
    }
  });
  
  return envVars;
}

module.exports = {
  mode: 'production',
  target: 'web',
  entry: './src/bundle-entry.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'folio.bundle.js',
    library: {
      name: 'Folio',
      type: 'umd',
    },
    globalObject: 'typeof self !== "undefined" ? self : this',
    umdNamedDefine: true,
  },
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.web.jsx', '.js', '.jsx', '.json'],
    alias: {
      'react-native$': 'react-native-web',
      'expo-router$': path.resolve(__dirname, 'src/shims/expo-router.web.tsx'),
      'expo-status-bar$': path.resolve(__dirname, 'src/shims/expo-status-bar.web.tsx'),
      '@/user/profile': path.resolve(__dirname, 'user/profile.ts'),
      '@/user/projects': path.resolve(__dirname, 'user/projects.ts'),
      '@/user': path.resolve(__dirname, 'user'),
      '@': path.resolve(__dirname, 'src'),
    },
    // Fix ESM module resolution for @react-navigation
    extensionAlias: {
      '.js': ['.js', '.ts', '.tsx'],
      '.jsx': ['.jsx', '.tsx'],
    },
  },
  module: {
    rules: [
      // Transpile all JS/TS files including EVERYTHING from node_modules
      {
        test: /\.(tsx?|jsx?|mjs)$/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            configFile: false,
            presets: [
              ['@babel/preset-env', { 
                loose: true,
                modules: false, // Let webpack handle modules
                targets: { browsers: ['last 2 versions', 'safari >= 7'] }
              }],
              ['@babel/preset-react', { runtime: 'automatic' }],
              ['@babel/preset-typescript', { 
                allowDeclareFields: true,
                onlyRemoveTypeImports: true,
              }],
            ],
            plugins: [
              ['@babel/plugin-transform-class-properties', { loose: true }],
              ['@babel/plugin-transform-private-methods', { loose: true }],
              ['@babel/plugin-transform-private-property-in-object', { loose: true }],
            ],
          },
        },
      },
      // Handle ESM module resolution
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new Dotenv({
      path: './.env',
      safe: false,
      systemvars: true,
      silent: true, // Don't warn if .env is missing
      defaults: false,
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      ...Object.keys(process.env)
        .filter(key => key.startsWith('EXPO_PUBLIC_') || key.startsWith('REACT_APP_'))
        .reduce((acc, key) => {
          acc[`process.env.${key}`] = JSON.stringify(process.env[key]);
          return acc;
        }, {}),
      'process.platform': JSON.stringify('browser'),
      'process.version': JSON.stringify(''),
      __DEV__: false,
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.BannerPlugin({
      banner: () => {
        const timestamp = new Date().toISOString();
        return `/*! Folio bundle build timestamp: ${timestamp} */`;
      },
      raw: true,
      entryOnly: true,
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          format: {
            comments: /Folio bundle build timestamp/,
          },
        },
      }),
    ],
  },
};
