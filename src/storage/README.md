# Storage Abstraction Layer

This module provides an abstraction layer for data storage, allowing you to easily switch between different data sources without changing the rest of your application.

## Architecture

```
┌─────────────────┐
│   App Code      │
│  (Components)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Data Layer     │
│ (data/*.ts)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ StorageManager  │
│  (Singleton)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Storage Driver  │
│  (Interface)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ Static │ │Database│
│ Driver │ │ Driver │
└────────┘ └────────┘
```

## Usage

### Default (Static Driver)

By default, the app uses `StaticStorageDriver` which loads data from `user/profile.ts` and `user/projects.ts`. No configuration needed - it just works!

### Switching Drivers

To use a different driver, initialize it in `app/_layout.tsx`:

```typescript
import { storageManager } from '@/storage';
import { DatabaseStorageDriver } from '@/storage/drivers';

// In your layout component
useEffect(() => {
  storageManager.initialize(new DatabaseStorageDriver({
    connectionString: 'your-db-connection',
  })).catch(console.error);
}, []);
```

### Creating a New Driver

1. Create a new file: `storage/drivers/YourDriver.ts`
2. Implement `IStorageDriver` interface
3. Export from `storage/drivers/index.ts`
4. Use it in your app initialization

See `storage/drivers/README.md` for detailed examples.

## Available Drivers

- **StaticStorageDriver** - Loads from hardcoded TypeScript files (default)
- More drivers can be added (Database, API, FileSystem, etc.)

## Benefits

✅ **Flexibility** - Switch data sources without changing app code  
✅ **Testability** - Easy to mock for testing  
✅ **Future-proof** - Add new data sources as needed  
✅ **Consistency** - All data access goes through the same interface  
✅ **Type Safety** - Full TypeScript support throughout

