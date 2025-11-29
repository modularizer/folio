import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { parseGitHubUrl } from '@/utils/github';
import { buildReadmeBranchCandidates, fetchReadmeMarkdown } from '@/utils/readmeCache';
import { marked } from 'marked';
import { LiveUrlPreview } from './LiveUrlPreview';

interface ReadmePreviewProps {
  githubUrl: string;
  defaultBranch?: string;
  imageUrl?: string;
  style: ViewStyle;
}

export const ReadmePreview: React.FC<ReadmePreviewProps> = ({ 
  githubUrl, 
  defaultBranch,
  imageUrl,
  style 
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dataUrl, setDataUrl] = useState<string>('');

  const repoPath = useMemo(() => parseGitHubUrl(githubUrl), [githubUrl]);

  const extractBranchFromUrl = (): string | null => {
    const branchMatch = githubUrl.match(/\/tree\/([^\/]+)/);
    if (branchMatch) {
      return branchMatch[1];
    }
    return null;
  };

  // Fetch README markdown
  useEffect(() => {
    const fetchReadme = async () => {
      setLoading(true);
      setError(false);
      setDataUrl(''); // Clear previous dataUrl to prevent showing old HTML with wrong theme

      if (!repoPath) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        const branchHint = defaultBranch || extractBranchFromUrl();
        const branchCandidates = buildReadmeBranchCandidates(branchHint);
        const branch = branchCandidates[0];
        const markdown = await fetchReadmeMarkdown(
          repoPath,
          branch,
          branchCandidates.slice(1)
        );
        
        // Build base URL for resolving relative links
        // Format: https://raw.githubusercontent.com/owner/repo/refs/heads/branch/
        const [owner, repo] = repoPath.split('/');
        const baseUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@latest/`;
        
        // Process markdown to resolve relative links and images
        // Find links and images that don't start with http://, https://, or ./
        // Pattern matches: ![alt](url) and [text](url)
        const processedMarkdown = markdown.replace(
          /(!?\[([^\]]*)\]\(([^)]+)\))/g,
          (match, fullMatch, altOrText, url) => {
            const trimmedUrl = url.trim();
            
            // Skip if URL already starts with http://, https://, ./, or ../
            if (/^(https?:\/\/|\.\/|\.\.\/|\/)/.test(trimmedUrl)) {
              return fullMatch;
            }
            
            // Prepend ./ to make it explicitly relative, then resolve to absolute URL
            const relativePath = `./${trimmedUrl}`;
            const resolvedUrl = new URL(relativePath, baseUrl).href;
            
            // Return the match with resolved URL
            return fullMatch.replace(url, resolvedUrl);
          }
        );
        
        // Convert markdown to HTML using marked
        const html = marked(processedMarkdown, {
          breaks: true,
          gfm: true, // GitHub Flavored Markdown
        });
        
        // Wrap in styled HTML with light mode colors and 80% opacity white background
        // Use a wrapper div for the background so the body/html can be transparent
        const styledHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                html, body {
                  margin: 0;
                  padding: 0;
                  background-color: transparent !important;
                  width: 100%;
                  height: 100%;
                }
                .content-wrapper {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  font-size: 24px;
                  line-height: 1.6;
                  color: #1a1a1a;
                  background-color: rgba(255, 255, 255, 0.5);
                  padding: 32px;
                  overflow-x: hidden;
                  min-height: 100vh;
                }
                h1 {
                  font-size: 36px;
                  font-weight: bold;
                  margin: 24px 0 16px 0;
                  color: #000000;
                }
                h2 {
                  font-size: 32px;
                  font-weight: bold;
                  margin: 20px 0 12px 0;
                  color: #000000;
                }
                h3 {
                  font-size: 28px;
                  font-weight: 600;
                  margin: 16px 0 8px 0;
                  color: #1a1a1a;
                }
                h4, h5, h6 {
                  font-size: 26px;
                  font-weight: 600;
                  margin: 12px 0 8px 0;
                  color: #1a1a1a;
                }
                p {
                  margin: 16px 0;
                  color: #1a1a1a;
                  font-size: 28px;
                }
                ul, ol {
                  margin: 16px 0;
                  padding-left: 48px;
                  color: #1a1a1a;
                }
                li {
                  margin: 8px 0;
                  font-size: 28px;
                }
                code {
                  background-color: rgba(246, 248, 250, 0.8);
                  color: #000000;
                  padding: 4px 12px;
                  border-radius: 8px;
                  font-family: 'Courier New', monospace;
                  font-size: 22px;
                }
                pre {
                  background-color: rgba(246, 248, 250, 0.8);
                  color: #000000;
                  padding: 24px;
                  border-radius: 12px;
                  overflow-x: auto;
                  margin: 16px 0;
                  font-size: 22px;
                }
                pre code {
                  background: none;
                  padding: 0;
                }
                blockquote {
                  border-left: 8px solid #0366d6;
                  padding-left: 32px;
                  margin: 16px 0;
                  color: #1a1a1a;
                  font-style: italic;
                  font-size: 28px;
                }
                a {
                  color: #0366d6;
                  text-decoration: none;
                }
                a:hover {
                  text-decoration: underline;
                }
                img {
                  max-width: 100%;
                  height: auto;
                  border-radius: 8px;
                  margin: 16px 0;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 16px 0;
                  font-size: 22px;
                }
                th, td {
                  border: 1px solid #e1e4e8;
                  padding: 12px;
                  text-align: left;
                }
                th {
                  background-color: rgba(246, 248, 250, 0.9);
                  font-weight: 600;
                }
                hr {
                  border: none;
                  border-top: 1px solid #e1e4e8;
                  margin: 32px 0;
                }
              </style>
            </head>
            <body>
              <div class="content-wrapper">
                ${html}
              </div>
            </body>
          </html>
        `;
        
        // Create a data URL from the HTML (more compatible than blob URLs)
        // Note: Data URLs can be very long, so we use encodeURIComponent
        const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(styledHtml)}`;
        console.log('[ReadmePreview] Created data URL, length:', dataUrl.length);
        console.log('[ReadmePreview] HTML preview:', styledHtml.substring(0, 200));
        setDataUrl(dataUrl);
        setLoading(false);
      } catch (err) {
        console.error('[ReadmePreview] Error fetching README:', err);
        setError(true);
        setLoading(false);
      }
    };

    fetchReadme();
  }, [githubUrl, defaultBranch, repoPath]);


  // If we have data, render LiveUrlPreview directly (it handles its own hover)
  if (!loading && !error && dataUrl) {
    return (
      <>
        {console.log('[ReadmePreview] Rendering LiveUrlPreview with dataUrl length:', dataUrl.length)}
        <LiveUrlPreview
          url={dataUrl}
          imageUrl={imageUrl}
          style={style}
        />
      </>
    );
  }

  // Otherwise show loading/error states
  return (
    <View style={style}>
      {/* Show image fallback while loading or on error */}
      {imageUrl && (loading || error) && (
        <Image
          source={{ uri: imageUrl }}
          style={[StyleSheet.absoluteFill, { opacity: loading ? 1 : 0.5 }]}
          resizeMode="cover"
        />
      )}

      {/* Loading indicator */}
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      {/* Error indicator */}
      {error && (
        <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
          <Ionicons name="alert-circle" size={24} color="#ff4444" />
          <View style={{ marginTop: 8 }}>
            <Ionicons name="document-text-outline" size={16} color={theme.colors.textSecondary} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
});

