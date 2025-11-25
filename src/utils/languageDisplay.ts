/**
 * Languages that should be excluded from language filters and displays
 * These are configuration/markup formats, not programming languages
 */
export const EXCLUDED_LANGUAGES = new Set([
  'markdown',
  'toml',
  'yaml',
  'json',
  'xml', // XML is markup, not a programming language
]);

/**
 * Check if a language should be excluded from filters/displays
 * 
 * @param langKey - Lowercase language key
 * @returns true if the language should be excluded
 */
export function isLanguageExcluded(langKey: string): boolean {
  return EXCLUDED_LANGUAGES.has(langKey.toLowerCase());
}

/**
 * Language display name mapping
 * Converts lowercase language keys to properly formatted display names
 */
const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  // Popular languages
  'python': 'Python',
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'java': 'Java',
  'c': 'C',
  'cpp': 'C++',
  'c++': 'C++',
  'cxx': 'C++',
  'go': 'Go',
  'rust': 'Rust',
  'ruby': 'Ruby',
  'php': 'PHP',
  'swift': 'Swift',
  'kotlin': 'Kotlin',
  'dart': 'Dart',
  
  // Web technologies
  'html': 'HTML',
  'css': 'CSS',
  'scss': 'SCSS',
  'sass': 'Sass',
  'less': 'Less',
  
  // Databases
  'sql': 'SQL',
  'postgresql': 'PostgreSQL',
  'mysql': 'MySQL',
  'sqlite': 'SQLite',
  'mongodb': 'MongoDB',
  
  // Markup/Config
  'xml': 'XML',
  'json': 'JSON',
  'yaml': 'YAML',
  'toml': 'TOML',
  'markdown': 'Markdown',
  
  // Shell
  'shell': 'Shell',
  'bash': 'Bash',
  'zsh': 'Zsh',
  'fish': 'Fish',
  
  // Other languages
  'r': 'R',
  'matlab': 'MATLAB',
  'lua': 'Lua',
  'perl': 'Perl',
  'scala': 'Scala',
  'clojure': 'Clojure',
  'haskell': 'Haskell',
  'elixir': 'Elixir',
  'vue': 'Vue',
  'svelte': 'Svelte',
  'julia': 'Julia',
  'erlang': 'Erlang',
  'ocaml': 'OCaml',
  'fsharp': 'F#',
  'f#': 'F#',
  'csharp': 'C#',
  'c#': 'C#',
  'vb': 'Visual Basic',
  'visual basic': 'Visual Basic',
  'objective-c': 'Objective-C',
  'objectivec': 'Objective-C',
  'objc': 'Objective-C',
  'assembly': 'Assembly',
  'asm': 'Assembly',
  'makefile': 'Makefile',
  'make': 'Makefile',
};

/**
 * Convert a lowercase language key to a properly formatted display name
 * 
 * @param langKey - Lowercase language key (e.g., "python", "typescript")
 * @returns Properly formatted display name (e.g., "Python", "TypeScript")
 * 
 * @example
 * getLanguageDisplayName("python") // "Python"
 * getLanguageDisplayName("typescript") // "TypeScript"
 * getLanguageDisplayName("postgresql") // "PostgreSQL"
 * getLanguageDisplayName("unknown") // "Unknown" (fallback capitalization)
 */
export function getLanguageDisplayName(langKey: string): string {
  if (!langKey) return '';
  
  const lowerKey = langKey.toLowerCase();
  
  // Check if we have a specific display name
  if (LANGUAGE_DISPLAY_NAMES[lowerKey]) {
    return LANGUAGE_DISPLAY_NAMES[lowerKey];
  }
  
  // Fallback: capitalize first letter of each word
  return lowerKey
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Language short name mapping for card display
 * Maps languages to short abbreviations for compact display in cards
 */
const LANGUAGE_SHORT_NAMES: Record<string, string> = {
  'typescript': 'TS',
  'javascript': 'JS',
  'python': 'Py',
  'java': 'Java',
  'c': 'C',
  'cpp': 'C++',
  'c++': 'C++',
  'cxx': 'C++',
  'go': 'Go',
  'rust': 'Rust',
  'ruby': 'Rb',
  'php': 'PHP',
  'swift': 'Swift',
  'kotlin': 'Kt',
  'dart': 'Dart',
  'html': 'HTML',
  'css': 'CSS',
  'scss': 'SCSS',
  'sass': 'Sass',
  'less': 'Less',
  'sql': 'SQL',
  'postgresql': 'PgSQL',
  'mysql': 'MySQL',
  'sqlite': 'SQLite',
  'mongodb': 'Mongo',
  'shell': 'Sh',
  'bash': 'Bash',
  'zsh': 'Zsh',
  'fish': 'Fish',
  'r': 'R',
  'matlab': 'MATLAB',
  'lua': 'Lua',
  'perl': 'Perl',
  'scala': 'Scala',
  'clojure': 'Clj',
  'haskell': 'Haskell',
  'elixir': 'Ex',
  'vue': 'Vue',
  'svelte': 'Svelte',
  'julia': 'Julia',
  'erlang': 'Erl',
  'ocaml': 'OCaml',
  'fsharp': 'F#',
  'f#': 'F#',
  'csharp': 'C#',
  'c#': 'C#',
  'vb': 'VB',
  'visual basic': 'VB',
  'objective-c': 'ObjC',
  'objectivec': 'ObjC',
  'objc': 'ObjC',
  'assembly': 'ASM',
  'asm': 'ASM',
  'makefile': 'Mk',
  'make': 'Mk',
};

/**
 * Get short name for a language (for card display)
 * Falls back to full display name if no short name is defined
 * 
 * @param langKey - Lowercase language key (e.g., "typescript", "javascript")
 * @returns Short name (e.g., "TS", "JS") or full display name if no short name exists
 * 
 * @example
 * getLanguageShortName("typescript") // "TS"
 * getLanguageShortName("javascript") // "JS"
 * getLanguageShortName("python") // "Py"
 * getLanguageShortName("unknown") // "Unknown" (falls back to display name)
 */
export function getLanguageShortName(langKey: string): string {
  if (!langKey) return '';
  
  const lowerKey = langKey.toLowerCase();
  
  // Check if we have a short name
  if (LANGUAGE_SHORT_NAMES[lowerKey]) {
    return LANGUAGE_SHORT_NAMES[lowerKey];
  }
  
  // Fallback to full display name
  return getLanguageDisplayName(langKey);
}

