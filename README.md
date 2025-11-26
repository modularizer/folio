# Folio

Build a configurable portfolio from your public github projects.



## Features

- 🎨 **Parameterized Theme System** - Dark mode with support for additional themes
- 📱 **Responsive Design** - Works beautifully on desktop, tablet, and mobile
- 🖼️ **Background Image Support** - Customizable dark background images
- 🎯 **TypeScript** - Strong typing throughout the codebase
- 🚀 **Expo Router** - File-based routing for easy navigation
- 💻 **React Native Web** - Write once, run on web and mobile
- 🔧 **Customizable Builders** - Each project can have its own custom rendering logic
- 👤 **User Data Separation** - Personal info and projects are separated from generic code

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

```bash
npm install
```

### Customization

**Important:** Before using this template, customize the following files in the `user/` directory:

1. **`user/profile.ts`** - Add your personal information:
   - Name
   - Title/Bio
   - Contact information
   - Social media links (GitHub, LinkedIn, Twitter, etc.)

2. **`user/projects.ts`** - Add your portfolio projects:
   - Each project needs `data` (JSON) and a `builder` (rendering class)
   - Use `BaseProjectBuilder()` for standard projects
   - Create custom builders for unique project layouts

See `user/README.md` for detailed customization instructions.

### Development

Start the development server:

```bash
npm start
```

Then press:
- `w` to open in web browser
- `a` to open in Android emulator
- `i` to open in iOS simulator

Or use the specific commands:

```bash
npm run web      # Web only
npm run android  # Android only
npm run ios      # iOS only
```

## Project Structure

```
about/
├── app/                 # Expo Router pages
│   ├── _layout.tsx     # Root layout (initializes storage)
│   ├── index.tsx       # Home page
│   └── projects/       # Project detail pages
│       └── [id].tsx    # Dynamic project route
├── components/         # Reusable components
│   └── ProjectCard.tsx # Project preview card wrapper
├── contexts/           # React contexts
│   └── ThemeContext.tsx # Theme management
├── data/              # Data access layer
│   ├── projects.ts    # Project data helpers
│   └── profile.ts     # Profile data helpers
├── storage/            # Storage abstraction layer
│   ├── StorageManager.ts # Central storage manager
│   └── drivers/       # Storage driver implementations
│       ├── StaticStorageDriver.ts # Static/hardcoded data (default)
│       └── ExampleDatabaseDriver.ts # Example DB driver template
├── projects/          # Project builder implementations
│   ├── base/         # BaseProjectBuilder (default)
│   └── example/      # ExampleProjectBuilder (custom)
├── types/            # TypeScript types
│   ├── project.ts    # Project type definitions
│   ├── project-builder.ts # Builder interface
│   ├── storage-driver.ts # Storage driver interface
│   └── theme.ts      # Theme type definitions
├── user/             # USER-SPECIFIC DATA (customize this!)
│   ├── profile.ts    # Your personal information
│   ├── projects.ts   # Your portfolio projects
│   └── README.md     # Customization guide
└── assets/           # Static assets (images, etc.)
```

## Adding Projects

Edit `user/projects.ts` to add your portfolio projects:

```typescript
export const userProjects: Project[] = [
  {
    data: {
      id: 'my-project',
      title: 'My Project',
      description: 'A cool project description',
      githubUrl: 'https://github.com/username/project',
      liveUrl: 'https://project-demo.com',
      tags: ['React', 'TypeScript'],
      featured: true,
    },
    builder: new BaseProjectBuilder(),
  },
];
```

### Custom Project Builders

If you want a project to have unique styling or layout, create a custom builder:

1. Create a new file: `projects/your-project/YourProjectBuilder.tsx`
2. Extend `BaseProjectBuilder` or implement `IProjectBuilder`
3. Override `buildPreviewCard()` and/or `buildDetailPage()` methods
4. Import and use it in `user/projects.ts`

See `projects/example/ExampleProject.tsx` for a reference implementation.

## Storage Drivers

The application uses a storage abstraction layer that allows you to switch between different data sources:

- **StaticStorageDriver** (default) - Loads from hardcoded TypeScript files in `user/`
- **Database Driver** - Can be implemented to load from a database
- **API Driver** - Can be implemented to load from an API
- **Custom Drivers** - Implement `IStorageDriver` interface for any data source

By default, the app uses `StaticStorageDriver` which reads from `user/profile.ts` and `user/projects.ts`. This is perfect for static site generation.

To switch to a different driver, modify `app/_layout.tsx`:

```typescript
import { DatabaseStorageDriver } from '@/storage/drivers';
await storageManager.initialize(new DatabaseStorageDriver({ ... }));
```

See `storage/README.md` and `storage/drivers/README.md` for more details.

## Theming

The theme system is fully parameterized. To customize:

1. Edit `types/theme.ts` to modify theme colors
2. Use `useTheme()` hook in components to access theme
3. Set background image via `ThemeContext`

## Building for Production

### Web (Static Export)

```bash
npx expo export:web
```

The static files will be in the `web-build/` directory.

## Template Usage

This is a template repository designed to be forked and customized. The `user/` directory contains all user-specific data that should be customized:

- **Personal Information**: `user/profile.ts`
- **Portfolio Projects**: `user/projects.ts`

All other code is generic and can be shared across different portfolio instances.

## License

ISC
