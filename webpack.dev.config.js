const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  target: 'web',
  entry: './src/dev-entry.tsx',
  output: {
    path: path.resolve(__dirname, 'dev-build'),
    filename: 'folio.js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js', '.json'],
    alias: {
      'react-native$': 'react-native-web',
      'expo-router$': path.resolve(__dirname, 'src/shims/expo-router.web.tsx'),
      'expo-status-bar$': path.resolve(__dirname, 'src/shims/expo-status-bar.web.tsx'),
      '@/user/profile': path.resolve(__dirname, 'user/profile.ts'),
      '@/user/projects': path.resolve(__dirname, 'user/projects.ts'),
      '@/user': path.resolve(__dirname, 'user'),
      '@': path.resolve(__dirname, 'src'),
    },
    fullySpecified: false,
  },
  module: {
    rules: [
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
                modules: false,
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
      path: './.env', // Path to .env file (default)
      safe: false, // Load .env.example to verify required variables
      systemvars: true, // Load system environment variables as well
      silent: false, // Show warnings if .env file is missing
      defaults: false, // Load .env.defaults if exists
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      ...Object.keys(process.env)
        .filter(key => key.startsWith('EXPO_PUBLIC_') || key.startsWith('REACT_APP_'))
        .reduce((acc, key) => {
          acc[`process.env.${key}`] = JSON.stringify(process.env[key]);
          return acc;
        }, {}),
      'process.platform': JSON.stringify('browser'),
      'process.version': JSON.stringify(''),
      __DEV__: true,
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/dev-template.html'),
      inject: 'body',
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dev-build'),
    },
    compress: true,
    port: 8090,
    hot: true,
    open: true,
    historyApiFallback: true,
  },
};

