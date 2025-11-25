# Storage Drivers

Storage drivers implement the `IStorageDriver` interface to provide data access from different sources.

## Available Drivers

### StaticStorageDriver
Loads data from hardcoded TypeScript files. Perfect for static site generation.

## Creating a New Driver

To create a new storage driver (e.g., for a database):

1. Create a new file: `drivers/YourStorageDriver.ts`
2. Implement the `IStorageDriver` interface:

```typescript
import { IStorageDriver } from '@/types/storage-driver';
import { Project } from '@/types/project';
import { UserProfile } from '@/user/profile';

export class DatabaseStorageDriver implements IStorageDriver {
  async initialize(): Promise<void> {
    // Connect to database, etc.
  }

  async getUserProfile(): Promise<UserProfile> {
    // Fetch from database
  }

  async getAllProjects(): Promise<Project[]> {
    // Fetch from database
  }

  async getProjectBySlug(slug: string): Promise<Project | undefined> {
    // Fetch from database
  }

  async getFeaturedProjects(): Promise<Project[]> {
    // Fetch from database
  }

  async cleanup(): Promise<void> {
    // Close database connections
  }
}
```

3. Export it from `drivers/index.ts`
4. Use it in your app initialization:

```typescript
import { storageManager } from '@/storage';
import { DatabaseStorageDriver } from '@/storage/drivers';

await storageManager.initialize(new DatabaseStorageDriver());
```

## Example: API Driver

```typescript
export class ApiStorageDriver implements IStorageDriver {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getUserProfile(): Promise<UserProfile> {
    const response = await fetch(`${this.baseUrl}/api/profile`);
    return response.json();
  }

  async getAllProjects(): Promise<Project[]> {
    const response = await fetch(`${this.baseUrl}/api/projects`);
    return response.json();
  }

  // ... implement other methods
}
```

