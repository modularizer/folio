import { Platform } from 'react-native';

/**
 * Set the document title (web only)
 */
export function setDocumentTitle(title: string): void {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.title = title;
  }
}

/**
 * Set the favicon from an image URL
 * Creates a data URI with the image embedded in an SVG
 */
export async function setFaviconFromImage(imageUrl: string): Promise<void> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }

  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn('Failed to fetch image for favicon:', imageUrl);
      return;
    }

    // Convert to blob
    const blob = await response.blob();
    
    // Convert blob to base64 data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      
      // Create SVG favicon with embedded image and circular crop
      // Using SVG allows us to embed the image as base64 and apply circular clipping
      // Using 64x64 for better quality (browsers will scale down as needed)
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="64" height="64">
        <defs>
          <clipPath id="circle">
            <circle cx="32" cy="32" r="32"/>
          </clipPath>
        </defs>
        <image x="0" y="0" width="64" height="64" xlink:href="${base64data}" clip-path="url(#circle)"/>
      </svg>`;
      
      // Encode SVG for data URI (URL encode to handle special characters)
      const encodedSvg = encodeURIComponent(svg);
      const svgDataUri = `data:image/svg+xml,${encodedSvg}`;
      
      // Find existing favicon link or create new one
      let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
      }
      
      // Set the href to our SVG data URI
      faviconLink.href = svgDataUri;
    };
    
    reader.onerror = () => {
      console.warn('Error reading image blob for favicon');
    };
    
    reader.readAsDataURL(blob);
  } catch (error) {
    console.warn('Error setting favicon from image:', error);
  }
}

/**
 * Reset favicon to default
 */
export function resetFavicon(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }

  const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (faviconLink) {
    // Reset to default favicon path
    faviconLink.href = '/favicon.png';
  }
}

