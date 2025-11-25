import React, { useRef } from 'react';
import { View, StyleSheet, ViewStyle, ActivityIndicator, Text } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * HTML WebView component for rendering HTML content.
 * 
 * This component wraps react-native-webview to provide a simple
 * interface for displaying HTML content with theme support.
 * 
 * Usage:
 * <HtmlWebView html="<h1>Hello</h1><p>World</p>" />
 * <HtmlWebView uri="https://example.com" />
 */
interface HtmlWebViewProps {
  /**
   * HTML content to render (mutually exclusive with uri)
   */
  html?: string;
  
  /**
   * URI to load (mutually exclusive with html)
   */
  uri?: string;
  
  /**
   * Custom styles for the container
   */
  style?: ViewStyle;
  
  /**
   * Whether to show loading indicator (default: true)
   */
  showLoading?: boolean;
  
  /**
   * Whether to inject theme styles into HTML (default: true)
   * Only works when using html prop, not uri
   */
  injectTheme?: boolean;
  
  /**
   * Callback when page loads
   */
  onLoadEnd?: () => void;
  
  /**
   * Callback when page starts loading
   */
  onLoadStart?: () => void;
  
  /**
   * Callback for messages from the webview
   */
  onMessage?: (event: WebViewMessageEvent) => void;
  
  /**
   * Additional JavaScript to inject
   */
  injectedJavaScript?: string;
  
  /**
   * Whether JavaScript is enabled (default: true)
   */
  javaScriptEnabled?: boolean;
  
  /**
   * Whether to allow file access (default: false)
   */
  allowFileAccess?: boolean;
  
  /**
   * Whether to allow universal access from file URLs (default: false)
   */
  allowUniversalAccessFromFileURLs?: boolean;
}

export const HtmlWebView: React.FC<HtmlWebViewProps> = ({
  html,
  uri,
  style,
  showLoading = true,
  injectTheme = true,
  onLoadEnd,
  onLoadStart,
  onMessage,
  injectedJavaScript,
  javaScriptEnabled = true,
  allowFileAccess = false,
  allowUniversalAccessFromFileURLs = false,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = React.useState(true);
  const webViewRef = useRef<WebView>(null);
  
  // Generate theme-injected HTML
  const getInjectedHtml = (): string => {
    if (!html) return '';
    
    if (!injectTheme) return html;
    
    const themeStyles = `
      <style>
        body {
          background-color: ${theme.colors.background};
          color: ${theme.colors.text};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          padding: 16px;
          margin: 0;
          line-height: 1.6;
        }
        h1, h2, h3, h4, h5, h6 {
          color: ${theme.colors.text};
          margin-top: 24px;
          margin-bottom: 12px;
        }
        h1 { font-size: 2em; }
        h2 { font-size: 1.5em; }
        h3 { font-size: 1.25em; }
        a {
          color: ${theme.colors.primary};
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        code {
          background-color: ${theme.colors.surface};
          color: ${theme.colors.text};
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
        }
        pre {
          background-color: ${theme.colors.surface};
          color: ${theme.colors.text};
          padding: 12px;
          border-radius: 8px;
          overflow-x: auto;
        }
        blockquote {
          border-left: 4px solid ${theme.colors.primary};
          padding-left: 16px;
          margin-left: 0;
          color: ${theme.colors.textSecondary};
        }
        img {
          max-width: 100%;
          height: auto;
        }
      </style>
    `;
    
    // Try to inject into existing <head> or create one
    if (html.includes('<head>')) {
      return html.replace('<head>', `<head>${themeStyles}`);
    } else if (html.includes('<html>')) {
      return html.replace('<html>', `<html><head>${themeStyles}</head>`);
    } else {
      return `<html><head>${themeStyles}</head><body>${html}</body></html>`;
    }
  };
  
  const handleLoadStart = () => {
    setLoading(true);
    onLoadStart?.();
  };
  
  const handleLoadEnd = () => {
    setLoading(false);
    onLoadEnd?.();
  };
  
  // Combine injected JavaScript with theme injection if needed
  const getInjectedJavaScript = (): string => {
    const scripts: string[] = [];
    
    if (injectTheme && html) {
      scripts.push(`
        (function() {
          // Ensure theme is applied
          document.body.style.backgroundColor = '${theme.colors.background}';
          document.body.style.color = '${theme.colors.text}';
        })();
      `);
    }
    
    if (injectedJavaScript) {
      scripts.push(injectedJavaScript);
    }
    
    return scripts.join('\n');
  };
  
  if (!html && !uri) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={{ color: theme.colors.error }}>
          Either 'html' or 'uri' prop must be provided
        </Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, style]}>
      {loading && showLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={html ? { html: getInjectedHtml() } : { uri: uri! }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onMessage={onMessage}
        injectedJavaScript={getInjectedJavaScript()}
        javaScriptEnabled={javaScriptEnabled}
        allowFileAccess={allowFileAccess}
        allowUniversalAccessFromFileURLs={allowUniversalAccessFromFileURLs}
        // Web-specific props
        originWhitelist={['*']}
        // iOS specific
        scalesPageToFit={true}
        // Android specific
        domStorageEnabled={true}
        startInLoadingState={showLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default HtmlWebView;

