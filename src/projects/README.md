# Projects Module

This directory contains the hierarchical project system with base types, components, and builders, plus extensions for different project categories.

## Structure

```
projects/
├── types/                  # Base project types (ProjectData, Project, ProjectBuilder, enums)
├── components/             # BaseProjectCard, BaseProjectPage
├── builders/               # BaseProjectBuilder
├── extensions/             # Project extensions
│   └── software/           # Software project extension
│       ├── types/          # SoftwareProjectData, Language, Framework enums
│       ├── components/     # SoftwareProjectCard, SoftwareProjectPage
│       ├── builders/       # SoftwareProjectBuilder
│       ├── extensions/     # Software sub-extensions
│       │   ├── app/        # App sub-extension
│       │   │   ├── types/     # AppProjectData
│       │   │   ├── components/# AppProjectCard, AppProjectPage
│       │   │   ├── builders/  # AppProjectBuilder
│       │   │   └── index.ts
│       │   └── package/     # Package sub-extension
│       │       ├── types/     # SoftwarePackageProjectData
│       │       ├── components/# PackageProjectCard, PackageProjectPage
│       │       ├── builders/  # PackageProjectBuilder
│       │       └── index.ts
│       └── index.ts
└── index.ts               # Main exports
```

## Hierarchy

1. **Base** (this folder) - Core project types, cards, pages, and builders
2. **Software** (extensions/software) - Extends base with languages, frameworks, software-specific fields
3. **App / Package** (software/extensions/app, software/extensions/package) - Sub-extensions of Software for specific project types

The pattern is consistent: all extensions live in an `extensions/` folder within their parent.

## Usage

### Base Project
```typescript
import { BaseProjectBuilder } from '@/projects';
import { ProjectData } from '@/projects/types';

const project = {
  data: {
    id: 'my-project',
    title: 'My Project',
    // ... base fields
  } as ProjectData,
  builder: new BaseProjectBuilder(),
};
```

### Software Project
```typescript
import { SoftwareProjectBuilder } from '@/projects/extensions/software';
import { SoftwareProjectData } from '@/projects/extensions/software/types';
import { Language, Framework } from '@/projects/extensions/software/types';

const project = {
  data: {
    id: 'my-app',
    template: 'Software',
    languages: [Language.TypeScript],
    frameworks: [Framework.React],
    // ... software fields
  } as SoftwareProjectData,
  builder: new SoftwareProjectBuilder(),
};
```

### App Project
```typescript
import { AppProjectBuilder } from '@/projects/extensions/software/extensions/app';
import { AppProjectData } from '@/projects/extensions/software/extensions/app/types';

const project = {
  data: {
    id: 'my-app',
    template: 'App',
    platforms: ['web', 'ios'],
    // ... app-specific fields
  } as AppProjectData,
  builder: new AppProjectBuilder(),
};
```

### Package Project
```typescript
import { PackageProjectBuilder } from '@/projects/extensions/software/extensions/package';
import { SoftwarePackageProjectData } from '@/projects/extensions/software/extensions/package/types';

const project = {
  data: {
    id: 'my-package',
    template: 'SoftwarePackage',
    packageName: 'my-package',
    packageManager: 'npm',
    // ... package-specific fields
  } as SoftwarePackageProjectData,
  builder: new PackageProjectBuilder(),
};
```

## Template System

Projects use a `template` field to determine which builder/component to use:

- `'Base'` or undefined → BaseProjectBuilder
- `'Software'` → SoftwareProjectBuilder
- `'App'` → AppProjectBuilder
- `'SoftwarePackage'` → PackageProjectBuilder

The builder is set when creating the project, and the components automatically use the appropriate card/page based on the template.

## Extending

To create a new project extension:

1. Create a new folder under the appropriate `extensions/` directory:
   - For base extensions: `projects/extensions/your-extension/`
   - For software extensions: `projects/extensions/software/extensions/your-extension/`
2. Create `types/`, `components/`, `builders/` subdirectories
3. Extend the appropriate base type (ProjectData, SoftwareProjectData, etc.)
4. Create card and page components
5. Create a builder class implementing `IProjectBuilder`
6. Export everything from an `index.ts`

The consistent pattern: **all extensions live in an `extensions/` folder within their parent**.

For examples and detailed documentation, see `docs/examples/`.

