import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  ViewStyle,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface LiveUrlPreviewProps {
  url: string;
  imageUrl?: string;
  style: ViewStyle;
}

export const LiveUrlPreview: React.FC<LiveUrlPreviewProps> = ({ 
  url, 
  imageUrl,
  style 
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const wrapperRef = useRef<View>(null);
  const iframeContainerRef = useRef<View>(null);

  const numericWidthFromStyle = typeof style.width === 'number' ? style.width : undefined;
  const numericHeightFromStyle = typeof style.height === 'number' ? style.height : undefined;
  const [availableSize, setAvailableSize] = useState<{
    width?: number;
    height?: number;
  }>({
    width: numericWidthFromStyle,
    height: numericHeightFromStyle,
  });

  const updateAvailableSize = useCallback((width?: number, height?: number) => {
    setAvailableSize(prev => {
      const nextWidth = typeof width === 'number' && width > 0 ? width : prev.width;
      const nextHeight = typeof height === 'number' && height > 0 ? height : prev.height;
      if (prev.width === nextWidth && prev.height === nextHeight) {
        return prev;
      }
      return { width: nextWidth, height: nextHeight };
    });
  }, []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    console.warn("layout", width, height);
    updateAvailableSize(width, height);
  }, [updateAvailableSize]);

  useEffect(() => {
    if (!wrapperRef.current) {
      return;
    }

    updateAvailableSize(numericWidthFromStyle, numericHeightFromStyle);

    let observer: ResizeObserver | undefined;
    if (Platform.OS === 'web' && typeof ResizeObserver !== 'undefined') {
      const node = wrapperRef.current as any;
      const domNode = node?._internalFiberInstanceHandleDEV?.stateNode ?? node;
      if (domNode) {
        observer = new ResizeObserver(entries => {
          const entry = entries[0];
          if (entry) {
            updateAvailableSize(entry.contentRect.width, entry.contentRect.height);
          }
        });
        observer.observe(domNode);
      }
    }

    return () => {
      observer?.disconnect?.();
    };
  }, [numericHeightFromStyle, numericWidthFromStyle, updateAvailableSize]);

  // Handle data URLs and blob URLs - don't modify them
  const fullUrl = url.startsWith('data:') || url.startsWith('blob:')
    ? url
    : url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`;

  const fallbackWidth = numericWidthFromStyle ?? 300;
  const fallbackHeight = numericHeightFromStyle ?? 150;
  const cardWidth = availableSize.width && availableSize.width > 0 ? availableSize.width : fallbackWidth;
  const cardHeight = availableSize.height && availableSize.height > 0 ? availableSize.height : fallbackHeight;
  const DESKTOP_WIDTH = 1200;
  const DESKTOP_HEIGHT = DESKTOP_WIDTH * (cardHeight / cardWidth);
  const scale = Math.min(cardWidth / DESKTOP_WIDTH, cardHeight / DESKTOP_HEIGHT);

  const handleLoadEnd = () => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const initialUrlRef = useRef(fullUrl);
  
  useEffect(() => {
    initialUrlRef.current = fullUrl;
  }, [fullUrl]);
  
  const handleShouldStartLoadWithRequest = (request: any) => {
    // Allow data URLs and blob URLs
    if (request.url.startsWith('data:') || request.url.startsWith('blob:')) {
      return true;
    }
    try {
      const requestUrl = new URL(request.url);
      const initialUrl = new URL(initialUrlRef.current);
      return requestUrl.origin === initialUrl.origin;
    } catch (e) {
      // If URL parsing fails, allow it (might be a data/blob URL)
      return true;
    }
  };

  const injectedJavaScript = `
    (function() {
      let meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'viewport');
        document.head.insertBefore(meta, document.head.firstChild);
      }
      meta.setAttribute('content', 'width=${DESKTOP_WIDTH}, initial-scale=1, maximum-scale=1, user-scalable=no');
      
      Object.defineProperty(window, 'innerWidth', { get: () => ${DESKTOP_WIDTH}, configurable: true });
      Object.defineProperty(window, 'innerHeight', { get: () => ${DESKTOP_HEIGHT}, configurable: true });
      Object.defineProperty(window, 'outerWidth', { get: () => ${DESKTOP_WIDTH}, configurable: true });
      Object.defineProperty(window, 'outerHeight', { get: () => ${DESKTOP_HEIGHT}, configurable: true });
      Object.defineProperty(screen, 'width', { get: () => ${DESKTOP_WIDTH}, configurable: true });
      Object.defineProperty(screen, 'height', { get: () => ${DESKTOP_HEIGHT}, configurable: true });
      
      window.alert = function() { return; };
      window.confirm = function() { return false; };
      window.prompt = function() { return 'demo'; };
      window.open = function() { return null; };
      window.location.replace = function() {};
      window.location.assign = function() {};
      Object.defineProperty(window.location, 'href', {
        set: function() {},
        get: function() { return window.location.href; },
        configurable: true
      });
      
      true;
    })();
  `;

  useEffect(() => {
    if (Platform.OS === 'web' && iframeContainerRef.current) {
      const containerElement = iframeContainerRef.current as any;
      if (containerElement && typeof document !== 'undefined') {
        const existingIframe = containerElement.querySelector?.('iframe');
        if (existingIframe) {
          existingIframe.remove();
        }

        const iframe = document.createElement('iframe');
        // Use srcdoc for data URLs (better compatibility), src for regular URLs
        if (fullUrl.startsWith('data:')) {
          // Extract HTML from data URL: data:text/html;charset=utf-8,<encoded-html>
          const match = fullUrl.match(/data:text\/html[^,]*,?(.+)$/);
          if (match && match[1]) {
            try {
              const html = decodeURIComponent(match[1]);
              iframe.srcdoc = html;
            } catch (e) {
              console.warn('[LiveUrlPreview] Failed to decode data URL, using src:', e);
              iframe.src = fullUrl;
            }
          } else {
            iframe.src = fullUrl;
          }
        } else {
          iframe.src = fullUrl;
        }
        iframe.style.width = `${DESKTOP_WIDTH}px`;
        iframe.style.height = `${DESKTOP_HEIGHT}px`;
        iframe.style.border = 'none';
        iframe.style.pointerEvents = 'none';
        iframe.style.transform = `scale(${scale})`;
        iframe.style.transformOrigin = 'top left';
        iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-modals');
        iframe.onload = () => {
          // Inject script to override prompt function
          try {
            const iframeWindow = iframe.contentWindow;
            const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeWindow && iframeDocument) {
              const script = iframeDocument.createElement('script');
              script.textContent = `
                (function() {
                  window.prompt = function() { return 'demo'; };
                  window.alert = function() { return; };
                  window.confirm = function() { return false; };
                })();
              `;
              iframeDocument.head.appendChild(script);
            }
          } catch (e) {
            // Cross-origin restrictions may prevent access
            console.warn('[LiveUrlPreview] Could not inject script into iframe:', e);
          }
          handleLoadEnd();
        };
        iframe.onerror = handleError;

        if (containerElement._internalFiberInstanceHandleDEV) {
          const domNode = containerElement._internalFiberInstanceHandleDEV?.stateNode;
          if (domNode) {
            domNode.appendChild(iframe);
          }
        } else if (containerElement.appendChild) {
          containerElement.appendChild(iframe);
        }

        return () => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        };
      }
    }
  }, [fullUrl, cardWidth, cardHeight, scale]);

  // Update iframe pointer events on hover
  useEffect(() => {
    if (Platform.OS === 'web' && iframeContainerRef.current) {
      const containerElement = iframeContainerRef.current as any;
      if (containerElement) {
        const iframe = containerElement.querySelector?.('iframe');
        if (iframe) {
          iframe.style.pointerEvents = isHovered ? 'auto' : 'none';
        }
      }
    }
  }, [isHovered]);

  const borderRadius = typeof style.borderRadius === 'number' ? style.borderRadius : 0;

  return (
    <View ref={wrapperRef}
          style={style}
          onLayout={handleLayout}>
      <View
        style={{
          width: cardWidth,
          height: cardHeight,
          overflow: 'hidden',
          borderRadius,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={[StyleSheet.absoluteFill, { opacity: loading ? 1 : 0 }]}
          resizeMode="cover"
        />
      )}
      
      {loading && !error && (
        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}
      
      {error && (
        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
          <Ionicons name="globe-outline" size={24} color={theme.colors.textSecondary} />
        </View>
      )}
      
        {Platform.OS === 'web' ? (
          <View ref={iframeContainerRef}
                style={{ width: cardWidth,
                    // height: 2000,
                    // overflow: 'hidden',
                    backgroundColor: 'white' }} />
        ) : (
          <View style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: DESKTOP_WIDTH, 
            height: DESKTOP_HEIGHT, 
            transform: [{ scale }],
            backgroundColor: 'white',
          }}>
            <WebView
              source={{ uri: fullUrl }}
              style={{ width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT, backgroundColor: 'white' }}
              scrollEnabled={isHovered}
              pointerEvents={isHovered ? 'auto' : 'none'}
              javaScriptEnabled={true}
              scalesPageToFit={false}
              userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              onLoadEnd={handleLoadEnd}
              onError={handleError}
              onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
              injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});

export default LiveUrlPreview;
