# Type Definitions

This directory contains all TypeScript type definitions for the portfolio application.

## Core Types

### `project.ts`
- `ProjectData` - Base interface for all project data
  - Core fields: id, title, description, imageUrl, githubUrl, liveUrl, tags, featured
  - **Timing**: `startDate`, `endDate` (ISO 8601 strings), `hoursWorked` (number)
  - **Metadata**: `contributors` (number), `reason` (ProjectReason enum), `projectType` (ProjectType enum)
  - **Assessment**: `rating` (number), `date` (legacy field, deprecated)
- `Project` - Complete project definition with data and builder

### `software-project.ts`
- `SoftwareProjectData` - Extends `ProjectData` for software-specific projects
  - `languages`: Array of `Language` enum values
  - `frameworks`: Optional array of `Framework` enum values
  - `categorizedTags`: Optional array of `ProjectTag` enum values
  - Additional fields: linesOfCode, contributors, status, license, packageManager, packageName

### `enums.ts`
Contains enumerations for project categorization:

- **Language**: Programming languages (JavaScript, TypeScript, Python, etc.)
- **Framework**: Frameworks and libraries (React, Vue, Express, etc.)
- **ProjectTag**: Project categories and tags (WebApp, MobileApp, OpenSource, etc.)
- **ProjectReason**: Why the project was created (Learning, Work, Personal, Business, etc.)
- **ProjectType**: Project category (Work, Personal, BusinessVenture, Freelance, etc.)

## Usage Examples

### Basic Project
```typescript
import { ProjectReason, ProjectType } from '@/types/enums';

const project: Project = {
  data: {
    id: 'my-project',
    title: 'My Project',
    description: 'Description',
    tags: ['Custom Tag'],
    startDate: '2024-01-15',
    endDate: '2024-03-20',
    hoursWorked: 120,
    contributors: 1,
    reason: ProjectReason.Personal,
    projectType: ProjectType.Personal,
    rating: 8,
  },
  builder: new BaseProjectBuilder(),
};
```

### Software Project
```typescript
import { Language, Framework, ProjectTag, ProjectReason, ProjectType } from '@/types/enums';
import { SoftwareProjectData } from '@/types/software-project';

const softwareProject: Project = {
  data: {
    id: 'my-app',
    title: 'My App',
    description: 'A software project',
    languages: [Language.TypeScript, Language.Python],
    frameworks: [Framework.React, Framework.FastAPI],
    categorizedTags: [ProjectTag.WebApp, ProjectTag.OpenSource],
    tags: ['Additional custom tags'],
    startDate: '2024-01-15',
    endDate: '2024-06-01',
    hoursWorked: 320,
    contributors: 3,
    reason: ProjectReason.Work,
    projectType: ProjectType.Work,
    rating: 9,
    status: 'active',
  } as SoftwareProjectData,
  builder: new BaseProjectBuilder(),
};
```

## Extending Types

To add new project types (e.g., HardwareProjectData, ArtProjectData):

1. Create a new file: `types/your-project-type.ts`
2. Extend `ProjectData` or `SoftwareProjectData`
3. Add type-specific fields
4. Export from `types/index.ts`

