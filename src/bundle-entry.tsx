/**
 * Bundle Entry Point
 * 
 * Auto-initializes the app when loaded via script tag with init=true parameter or data-init="true" attribute.
 * 
 * Supports configuration via (in priority order, highest first):
 * - URL query params (page-level): ?theme=light&background=assets/image.png
 * - Script tag query parameters: ?username=modularizer&init=true&token=...&theme=dark&background=...
 * - Data attributes: data-username="modularizer" data-init="true" data-token="..." data-theme="dark" data-background="..."
 * - Environment variables: EXPO_PUBLIC_FOLIO_BACKGROUND, EXPO_PUBLIC_FOLIO_THEME, etc.
 * 
 * Theme options:
 * - data-theme="light" or data-theme="dark" (or ?theme=light/dark)
 * - Also checks body[data-theme] attribute
 * 
 * Background options:
 * - data-background="color" or data-background="url(...)" (or ?background=...)
 * - Can be a CSS color (e.g., "#ff0000", "rgba(255,0,0,0.5)") or image URL/path
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BundleApp } from './bundle/BundleApp';

/**
 * Find the script tag that loaded this bundle
 */
function findBundleScript(): HTMLScriptElement | null {
  const scripts = document.getElementsByTagName('script');
  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    const src = script.src;
    if (src && (src.includes('folio.bundle.js') || src.includes('folio.bundle'))) {
      return script;
    }
  }
  return null;
}

/**
 * Get base path from data attribute only (not from script URL)
 */
function getBasePath(script: HTMLScriptElement | null): string {
  if (!script) return '';
  
  // Check for explicit data-base-path attribute only
  const dataBasePath = script.getAttribute('data-base-path');
  if (dataBasePath !== null) {
    return dataBasePath;
  }
  
  // Default: no base path
  return '';
}

/**
 * Process username special keywords
 * - "subdomain": Extract first subdomain from hostname
 * - "domain": Extract domain name from hostname
 * - "route": Extract last path segment from pathname
 */
function processUsername(username: string | undefined): string | undefined {
  if (!username) return username;
  
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  if (username === 'subdomain') {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[0];
    }
  }
  
  if (username === 'domain') {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
  }
  
  if (username === 'route') {
    const parts = pathname.split('/').filter(p => p.length > 0);
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }
  
  return username;
}

/**
 * Custom HTML element for defining portfolio projects
 * 
 * Usage:
 *   <folio-project 
 *     id="my-project"
 *     title="My Project"
 *     description="Project description"
 *     tags="React,TypeScript,Node.js"
 *     image-url="https://example.com/image.png"
 *     live-url="https://example.com"
 *     featured
 *     template="Base"
 *   ></folio-project>
 */
class FolioProjectElement extends HTMLElement {
  private _projectData: any = null;

  static get observedAttributes() {
    return [
      'id', 'title', 'description', 'tags', 'image-url', 'live-url', 
      'github-url', 'featured', 'template', 'start-date', 'end-date',
      'hours-worked', 'contributors', 'rating', 'preferred-index',
      'description-url', 'readme-url'
    ];
  }

  connectedCallback() {
    // Parse project data from attributes when element is connected to DOM
    console.log('[FolioProjectElement] connectedCallback called for element:', this.getAttribute('id'));
    this._parseProjectData();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    // Re-parse when any observed attribute changes
    console.log('[FolioProjectElement] attributeChangedCallback:', name, oldValue, '->', newValue);
    this._parseProjectData();
  }

  private _parseProjectData() {
    const projectData: any = {};

    // Required fields
    const id = this.getAttribute('id');
    const title = this.getAttribute('title');
    const description = this.getAttribute('description');

    console.log('[FolioProjectElement] Parsing attributes:', { id, title, description });

    if (!id || !title || !description) {
      console.warn('[FolioProjectElement] Missing required attributes (id, title, description)', { id, title, description });
      this._projectData = null;
      return;
    }

    projectData.id = id;
    projectData.title = title;
    projectData.description = description;

    // Optional string fields
    const imageUrl = this.getAttribute('image-url');
    if (imageUrl) projectData.imageUrl = imageUrl;

    const liveUrl = this.getAttribute('live-url');
    if (liveUrl) projectData.liveUrl = liveUrl;
    
    const githubUrl = this.getAttribute('github-url');
    if (githubUrl) projectData.githubUrl = githubUrl;
    
    const descriptionUrl = this.getAttribute('description-url');
    if (descriptionUrl) projectData.descriptionUrl = descriptionUrl;
    
    const readmeUrl = this.getAttribute('readme-url');
    if (readmeUrl) projectData.readmeUrl = readmeUrl;

    const template = this.getAttribute('template');
    if (template) projectData.template = template;

    const startDate = this.getAttribute('start-date');
    if (startDate) projectData.startDate = startDate;

    const endDate = this.getAttribute('end-date');
    if (endDate) projectData.endDate = endDate;

    // Tags (comma-separated string -> array)
    const tagsAttr = this.getAttribute('tags');
    if (tagsAttr) {
      projectData.tags = tagsAttr.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } else {
      projectData.tags = [];
    }

    // Boolean fields
    projectData.featured = this.hasAttribute('featured');

    // Number fields
    const hoursWorked = this.getAttribute('hours-worked');
    if (hoursWorked) {
      const num = parseFloat(hoursWorked);
      if (!isNaN(num)) projectData.hoursWorked = num;
    }

    const contributors = this.getAttribute('contributors');
    if (contributors) {
      const num = parseInt(contributors, 10);
      if (!isNaN(num)) projectData.contributors = num;
    }

    const rating = this.getAttribute('rating');
    if (rating) {
      const num = parseFloat(rating);
      if (!isNaN(num)) projectData.rating = num;
    }

    const preferredIndex = this.getAttribute('preferred-index');
    if (preferredIndex) {
      const num = parseInt(preferredIndex, 10);
      if (!isNaN(num)) projectData.preferredIndex = num;
    }

    this._projectData = projectData;
    console.log('[FolioProjectElement] Parsed projectData:', projectData);
  }

  get projectData(): any {
    return this._projectData;
  }
}

/**
 * Register the custom element if not already registered
 */
function registerFolioProjectElement() {
  if (typeof window === 'undefined' || typeof customElements === 'undefined') {
    console.warn('[bundle-entry] Cannot register custom element: window or customElements not available');
    return;
  }

  if (!customElements.get('folio-project')) {
    try {
      customElements.define('folio-project', FolioProjectElement);
      console.log('[bundle-entry] Registered <folio-project> custom element');
    } catch (e) {
      console.error('[bundle-entry] Failed to register custom element:', e);
    }
  } else {
    console.log('[bundle-entry] <folio-project> custom element already registered');
  }
}

/**
 * Parse custom bio stats from HTML
 * Supports JSON in a script tag with id="folio-custom-bio-stats"
 */
function parseCustomBioStats(): any[] | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  
  try {
    const jsonScript = document.getElementById('folio-custom-bio-stats');
    if (jsonScript && jsonScript.textContent) {
      try {
        const parsed = JSON.parse(jsonScript.textContent);
        if (Array.isArray(parsed)) {
          console.log('[bundle-entry] Parsed custom bio stats:', parsed);
          return parsed;
        }
      } catch (e) {
        console.warn('[bundle-entry] Failed to parse custom bio stats JSON:', e);
      }
    }
  } catch (e) {
    console.warn('[bundle-entry] Error accessing custom bio stats script tag:', e);
  }
  
  return undefined;
}

/**
 * Parse custom projects from HTML
 * Supports:
 * 1. JSON as inner content of the bundle script tag
 * 2. Custom HTML elements using <folio-project>
 */
function parseCustomProjects(): any[] {
  console.log('[bundle-entry] parseCustomProjects: Starting');
  const projects: any[] = [];
  
  // Safety check - ensure document is available
  if (typeof document === 'undefined') {
    console.warn('[bundle-entry] parseCustomProjects: document is undefined');
    return projects;
  }

  console.log('[bundle-entry] parseCustomProjects: document is available, proceeding');
  
  // Custom element should already be registered, but register it again if needed
  registerFolioProjectElement();
  
  // Method 1: JSON in bundle script tag inner content
  try {
    // First try to get from captured content (stored before script executed)
    let jsonContent: string | undefined = (window as any).__FOLIO_SCRIPT_CONTENT__;
    
    // Fallback: try to read from script tag directly
    if (!jsonContent) {
      const bundleScript = findBundleScript();
      if (bundleScript) {
        // Try innerHTML first (works even when script has src)
        jsonContent = bundleScript.innerHTML?.trim();
        // Fallback to textContent
        if (!jsonContent) {
          jsonContent = bundleScript.textContent?.trim();
        }
      }
    }
    
    if (jsonContent) {
      console.log('[bundle-entry] Found JSON content in bundle script tag:', jsonContent.substring(0, 100));
      try {
        const parsed = JSON.parse(jsonContent);
        if (Array.isArray(parsed)) {
          projects.push(...parsed);
          console.log('[bundle-entry] Parsed', parsed.length, 'projects from JSON');
        } else if (typeof parsed === 'object' && parsed !== null) {
          projects.push(parsed);
          console.log('[bundle-entry] Parsed 1 project from JSON');
        }
      } catch (e) {
        console.warn('[bundle-entry] Failed to parse JSON from bundle script tag:', e, 'Content:', jsonContent.substring(0, 200));
      }
    } else {
      console.log('[bundle-entry] No JSON content found in bundle script tag');
    }
  } catch (e) {
    console.warn('[bundle-entry] Error accessing bundle script tag:', e);
  }

  // Method 2: Custom <folio-project> elements
  try {
    // Ensure custom element is registered before querying
    registerFolioProjectElement();
    
    // Query for folio-project elements - use both querySelectorAll and getElementsByTagName
    // to ensure we catch them even if custom elements aren't fully upgraded
    const folioProjectElements = document.querySelectorAll('folio-project');
    const folioProjectElementsByTag = document.getElementsByTagName('folio-project');
    
    // Use the longer list to ensure we get all elements
    const allElements = folioProjectElements.length >= folioProjectElementsByTag.length 
      ? Array.from(folioProjectElements)
      : Array.from(folioProjectElementsByTag);
    
    console.log('[bundle-entry] Found', allElements.length, 'folio-project elements');
    
    allElements.forEach((element, index) => {
      let projectData: any = null;
      
      console.log(`[bundle-entry] Processing folio-project element ${index + 1}:`, {
        tagName: element.tagName,
        id: element.getAttribute('id'),
        title: element.getAttribute('title'),
        isInstance: element instanceof FolioProjectElement,
      });
      
      // Try to get from custom element instance first
      if (element instanceof FolioProjectElement) {
        projectData = element.projectData;
        console.log(`[bundle-entry] Got projectData from custom element instance for element ${index + 1}`);
      } else {
        // Fallback: parse from attributes manually
        // This handles cases where the element hasn't been upgraded yet
        const id = element.getAttribute('id');
        const title = element.getAttribute('title');
        const description = element.getAttribute('description');
        
        console.log(`[bundle-entry] Parsing attributes for element ${index + 1}:`, { id, title, description });
        
        if (!id || !title || !description) {
          console.warn(`[bundle-entry] Element ${index + 1} missing required attributes (id, title, description)`);
          return; // Skip if required attributes are missing
        }
        
        projectData = {
          id,
          title,
          description,
          tags: [],
        };
        
        // Optional fields
        const imageUrl = element.getAttribute('image-url');
        if (imageUrl) projectData.imageUrl = imageUrl;
        
        const liveUrl = element.getAttribute('live-url');
        if (liveUrl) projectData.liveUrl = liveUrl;
        
        const githubUrl = element.getAttribute('github-url');
        if (githubUrl) projectData.githubUrl = githubUrl;
        
        const descriptionUrl = element.getAttribute('description-url');
        if (descriptionUrl) projectData.descriptionUrl = descriptionUrl;
        
        const readmeUrl = element.getAttribute('readme-url');
        if (readmeUrl) projectData.readmeUrl = readmeUrl;
        
        const template = element.getAttribute('template');
        if (template) projectData.template = template;
        
        const startDate = element.getAttribute('start-date');
        if (startDate) projectData.startDate = startDate;
        
        const endDate = element.getAttribute('end-date');
        if (endDate) projectData.endDate = endDate;
        
        // Tags
        const tagsAttr = element.getAttribute('tags');
        if (tagsAttr) {
          projectData.tags = tagsAttr.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }
        
        // Boolean
        projectData.featured = element.hasAttribute('featured');
        
        // Numbers
        const hoursWorked = element.getAttribute('hours-worked');
        if (hoursWorked) {
          const num = parseFloat(hoursWorked);
          if (!isNaN(num)) projectData.hoursWorked = num;
        }
        
        const contributors = element.getAttribute('contributors');
        if (contributors) {
          const num = parseInt(contributors, 10);
          if (!isNaN(num)) projectData.contributors = num;
        }
        
        const rating = element.getAttribute('rating');
        if (rating) {
          const num = parseFloat(rating);
          if (!isNaN(num)) projectData.rating = num;
        }
        
        const preferredIndex = element.getAttribute('preferred-index');
        if (preferredIndex) {
          const num = parseInt(preferredIndex, 10);
          if (!isNaN(num)) projectData.preferredIndex = num;
        }
        
        console.log(`[bundle-entry] Parsed projectData from attributes for element ${index + 1}:`, projectData);
      }
      
      if (projectData) {
        projects.push(projectData);
        console.log('[bundle-entry] Added project from folio-project element:', projectData.id, projectData);
      } else {
        console.warn(`[bundle-entry] Failed to get projectData for element ${index + 1}`);
      }
    });
    
    const projectsFromElements = projects.length;
    console.log('[bundle-entry] Total projects from folio-project elements:', projectsFromElements);
  } catch (e) {
    console.error('[bundle-entry] Error querying folio-project elements:', e);
  }
  
  console.log('[bundle-entry] parseCustomProjects: COMPLETE - Total custom projects parsed:', projects.length, projects);
  return projects;
}

/**
 * Parse configuration from script tag
 * Supports both query parameters and data attributes
 */
function parseConfig(): {
  shouldInit: boolean;
  githubUsername?: string;
  githubToken?: string;
  basePath: string;
  theme?: 'light' | 'dark';
  background?: string;
  customProjects?: any[];
  customBioStats?: any[];
} {
  const script = findBundleScript();
  
  // Check for init flag
  let shouldInit = false;
  let githubUsername: string | undefined;
  let githubToken: string | undefined;
  let basePath = '';
  let theme: 'light' | 'dark' | undefined;
  let background: string | undefined;
  
  if (script) {
    // Check data attributes first
    const dataInit = script.getAttribute('data-init');
    shouldInit = dataInit === 'true' || dataInit === '';
    
    const dataUsername = script.getAttribute('data-username');
    const dataToken = script.getAttribute('data-token');
    const dataTheme = script.getAttribute('data-theme');
    const dataBackground = script.getAttribute('data-background');
    basePath = getBasePath(script);
    
    console.log('[bundle-entry] Found script tag with attributes:', {
      dataInit,
      dataUsername,
      dataToken: dataToken ? '***' : undefined,
      dataTheme,
      dataBackground,
    });
    
    // Parse query parameters from script src URL
    const scriptSrc = script.src;
    if (scriptSrc) {
      try {
        const url = new URL(scriptSrc);
        const params = url.searchParams;
        
        // Query params override data attributes
        if (params.has('init')) {
          shouldInit = params.get('init') === 'true';
        }
        if (params.has('username')) {
          githubUsername = params.get('username') || undefined;
        } else if (dataUsername) {
          githubUsername = dataUsername;
        }
        if (params.has('token')) {
          githubToken = params.get('token') || undefined;
        } else if (dataToken) {
          githubToken = dataToken;
        }
        if (params.has('theme')) {
          const themeParam = params.get('theme');
          if (themeParam === 'light' || themeParam === 'dark') {
            theme = themeParam;
          }
        } else if (dataTheme === 'light' || dataTheme === 'dark') {
          theme = dataTheme;
        }
        if (params.has('background')) {
          background = params.get('background') || undefined;
        } else if (dataBackground) {
          background = dataBackground;
        }
      } catch (e) {
        console.warn('[bundle-entry] Failed to parse script URL:', e);
      }
    } else {
      // No src URL, use data attributes only
      if (dataUsername) {
        githubUsername = dataUsername;
      }
      if (dataToken) {
        githubToken = dataToken;
      }
      if (dataTheme === 'light' || dataTheme === 'dark') {
        theme = dataTheme;
      }
      if (dataBackground) {
        background = dataBackground;
      }
    }
  }
  
  // Also check URL query parameters (for page-level overrides)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('theme')) {
      const themeParam = urlParams.get('theme');
      if (themeParam === 'light' || themeParam === 'dark') {
        theme = themeParam;
      }
    }
    if (urlParams.has('background')) {
      background = urlParams.get('background') || background;
    }
  } catch (e) {
    // Ignore errors parsing URL
  }
  
  // Check environment variables (lowest priority, only if not set via other methods)
  // Support both EXPO_PUBLIC_ and REACT_APP_ prefixes for compatibility
  // Note: webpack DefinePlugin replaces process.env.VAR_NAME with the actual string value at build time
  if (theme === undefined) {
    // @ts-ignore - webpack DefinePlugin replaces these at build time
    const envTheme = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_FOLIO_THEME) 
      || (typeof process !== 'undefined' && process.env?.REACT_APP_FOLIO_THEME);
    if (envTheme === 'light' || envTheme === 'dark') {
      theme = envTheme;
    }
  }
  if (background === undefined) {
    // @ts-ignore - webpack DefinePlugin replaces these at build time
    const envBackground = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_FOLIO_BACKGROUND)
      || (typeof process !== 'undefined' && process.env?.REACT_APP_FOLIO_BACKGROUND);
    if (envBackground) {
      background = envBackground;
    }
  }
  if (githubUsername === undefined) {
    // @ts-ignore - webpack DefinePlugin replaces these at build time
    const envUsername = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GITHUB_USERNAME)
      || (typeof process !== 'undefined' && process.env?.REACT_APP_GITHUB_USERNAME);
    if (envUsername) {
      githubUsername = envUsername;
    }
  }
  if (githubToken === undefined) {
    // @ts-ignore - webpack DefinePlugin replaces these at build time
    const envToken = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GITHUB_TOKEN)
      || (typeof process !== 'undefined' && process.env?.REACT_APP_GITHUB_TOKEN);
    if (envToken) {
      githubToken = envToken;
    }
  }
  
  // Process username special keywords
  githubUsername = processUsername(githubUsername);
  
  // Parse custom projects from HTML
  console.log('[bundle-entry] parseConfig: About to parse custom projects');
  const customProjects = parseCustomProjects();
  console.log('[bundle-entry] parseConfig: Parsed custom projects:', {
    count: customProjects.length,
    projects: customProjects,
  });
  
  // Parse custom bio stats from HTML
  const customBioStats = parseCustomBioStats();
  
  return {
    shouldInit,
    githubUsername,
    githubToken,
    basePath,
    theme,
    background,
    customProjects: customProjects.length > 0 ? customProjects : undefined,
    customBioStats,
  };
}

/**
 * Wait for DOM to be ready
 */
function waitForDOM(callback: () => void) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    // DOM is already ready
    callback();
  }
}

/**
 * Apply background to body element
 */
function applyBodyBackground(background: string | undefined) {
  if (!background || typeof window === 'undefined') {
    console.warn('[bundle-entry] applyBodyBackground: no background or window undefined', { background, hasWindow: typeof window !== 'undefined' });
    return;
  }
  
  const body = document.body;
  if (!body) {
    console.warn('[bundle-entry] applyBodyBackground: body not available yet');
    // Try again after a short delay
    setTimeout(() => applyBodyBackground(background), 100);
    return;
  }
  
  console.log('[bundle-entry] applyBodyBackground: applying to body', background);
  
  // Check if it's a URL (starts with http, https, or /) or a relative path
  // If it looks like a color (starts with # or rgb), use backgroundColor instead
  const isColor = background.startsWith('#') || background.startsWith('rgb');
  
  if (isColor) {
    body.style.backgroundColor = background;
    body.style.backgroundImage = 'none';
    console.log('[bundle-entry] Applied background color:', background);
  } else {
    // It's an image URL/path
    body.style.backgroundImage = `url('${background}')`;
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = 'center';
    body.style.backgroundAttachment = 'fixed';
    body.style.backgroundRepeat = 'no-repeat';
    body.style.minHeight = '100vh';
    // Clear backgroundColor if it was set
    body.style.backgroundColor = 'transparent';
    console.log('[bundle-entry] Applied background image:', background);
  }
}

/**
 * Initialize the app
 */
function initializeApp() {
  // Parse configuration
  const config = parseConfig();
  
  console.log('[bundle-entry] Parsed config:', {
    background: config.background,
    theme: config.theme,
    shouldInit: config.shouldInit,
  });
  
  // Apply background to body element if provided (always apply, even if not initializing)
  if (config.background) {
    console.log('[bundle-entry] Applying background to body:', config.background);
    applyBodyBackground(config.background);
  } else {
    console.warn('[bundle-entry] No background found in config');
  }

  // Only initialize if init flag is set
  if (!config.shouldInit) {
    console.log('[bundle-entry] Not initializing (init flag not set). Export Folio for manual initialization.');
    return;
  }

  // Get or create root container
  let container = document.getElementById('root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'root';
    // Ensure body exists before appending
    if (!document.body) {
      // Wait for body to be available
      waitForDOM(() => {
        // Check again if root was created in the meantime
        const existingRoot = document.getElementById('root');
        if (existingRoot) {
          renderApp(existingRoot, config);
        } else {
          document.body.appendChild(container!);
          renderApp(container!, config);
        }
      });
      return;
    }
    document.body.appendChild(container);
  }
  
  renderApp(container, config);
}

/**
 * Render the React app
 */
function renderApp(container: HTMLElement, config: ReturnType<typeof parseConfig>) {
  // Create React root and render
  const root = createRoot(container);
  
  // Build theme object if theme or background is provided
  const themeConfig = config.theme || config.background ? {
    name: config.theme,
    background: config.background,
  } : undefined;
  
  root.render(
    <React.StrictMode>
      <BundleApp
        githubUsername={config.githubUsername}
        githubToken={config.githubToken}
        basePath={config.basePath}
        theme={themeConfig}
        customProjects={config.customProjects}
        customBioStats={config.customBioStats}
      />
    </React.StrictMode>
  );
  
  console.log('[bundle-entry] Initialized with config:', {
    githubUsername: config.githubUsername,
    githubToken: config.githubToken ? '***' : undefined,
    basePath: config.basePath,
    theme: config.theme,
    background: config.background ? '***' : undefined,
    customProjectsCount: config.customProjects?.length || 0,
    customProjects: config.customProjects,
  });
}

// Store script content immediately when script loads (before it executes)
// This is needed because browsers may clear innerHTML/textContent when script has src
// We use DOMContentLoaded to capture content as early as possible
if (typeof document !== 'undefined') {
  function captureScriptContent() {
    // Find all script tags and capture their content
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      const src = script.src;
      if (src && (src.includes('folio.bundle.js') || src.includes('folio.bundle'))) {
        // Store the innerHTML before the script executes
        const content = script.innerHTML?.trim() || script.textContent?.trim();
        if (content) {
          (window as any).__FOLIO_SCRIPT_CONTENT__ = content;
          console.log('[bundle-entry] Captured script content:', content.substring(0, 100));
        }
        break;
      }
    }
  }
  
  // Try to capture immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', captureScriptContent);
  } else {
    // DOM already loaded, capture immediately
    captureScriptContent();
  }
}

// Register custom element as early as possible (before DOM ready)
// This allows <folio-project> elements to be used in HTML
if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  registerFolioProjectElement();
}

// Apply background immediately if available (before DOM ready)
// This ensures it's applied as early as possible
(function applyBackgroundEarly() {
  const script = findBundleScript();
  if (script) {
    const dataBackground = script.getAttribute('data-background');
    // Also check URL query params
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlBackground = urlParams.get('background');
      const background = urlBackground || dataBackground;
      if (background) {
        console.log('[bundle-entry] Applying background early:', background);
        // Try to apply immediately
        if (document.body) {
          applyBodyBackground(background);
        } else {
          // Wait for body and apply
          waitForDOM(() => applyBodyBackground(background));
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }
})();

// Wait for DOM to be ready before initializing
waitForDOM(initializeApp);

// Export for manual initialization if needed
export { BundleApp };
export default BundleApp;



