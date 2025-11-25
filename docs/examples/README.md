# Examples

This directory contains example code demonstrating how to extend the project system.

## Custom Project Builder

See `CustomProjectBuilder.tsx` for a complete example of:
- Creating a custom builder class
- Extending BaseProjectBuilder
- Creating custom card and page components
- Custom styling and layout

## Usage

1. Copy the example file to your own project extension folder
2. Rename classes and components to match your project type
3. Customize styling and add project-specific fields
4. Import and use in `user/projects.ts`

## Creating a New Project Extension

For a more complete extension (like Software → App), see the structure in:
- `projects/software/` - Base software extension
- `projects/software/app/` - App sub-extension
- `projects/software/package/` - Package sub-extension

Each extension follows the pattern:
```
your-extension/
├── types/          # Extended data types
├── components/     # Custom cards and pages
├── builders/       # Custom builders
└── index.ts        # Exports
```



