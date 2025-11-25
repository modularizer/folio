import { IStorageDriver } from '@/types/storage-driver';
import { StaticStorageDriver } from './drivers/StaticStorageDriver';

/**
 * Storage Manager
 * 
 * Centralized manager for data storage operations.
 * Handles driver initialization and provides a clean API for data access.
 */
class StorageManager {
  private driver: IStorageDriver | null = null;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the storage manager with a specific driver.
   * @param driver - The storage driver to use
   */
  async initialize(driver?: IStorageDriver): Promise<void> {
    // If already initialized, return immediately
    if (this.initialized) {
      return;
    }

    // If initialization is in progress, wait for it to complete
    if (this.initPromise) {
      return this.initPromise;
    }

    // Start initialization and store the promise
    this.initPromise = (async () => {
      try {
        // Use provided driver or default to StaticStorageDriver
        this.driver = driver || new StaticStorageDriver();

        // Initialize the driver if it has an initialize method
        if (this.driver.initialize) {
          await this.driver.initialize();
        }

        this.initialized = true;
      } finally {
        // Clear the promise after initialization completes (success or failure)
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Get the current storage driver.
   * @throws Error if not initialized
   */
  private getDriver(): IStorageDriver {
    if (!this.driver || !this.initialized) {
      throw new Error(
        'StorageManager not initialized. Call initialize() first.'
      );
    }
    return this.driver;
  }

  /**
   * Ensure the storage manager is initialized before accessing it.
   * This is a convenience method that can be called before any operation.
   */
  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get the user profile.
   */
  async getUserProfile() {
    await this.ensureInitialized();
    return this.getDriver().getUserProfile();
  }

  /**
   * Get all projects.
   */
  async getAllProjects() {
    await this.ensureInitialized();
    return this.getDriver().getAllProjects();
  }

  /**
   * Get a project by slug.
   */
  async getProjectBySlug(slug: string) {
    await this.ensureInitialized();
    return this.getDriver().getProjectBySlug(slug);
  }

  /**
   * Get all featured projects.
   */
  async getFeaturedProjects() {
    await this.ensureInitialized();
    return this.getDriver().getFeaturedProjects();
  }

  /**
   * Cleanup resources.
   */
  async cleanup(): Promise<void> {
    // Wait for any ongoing initialization to complete before cleanup
    if (this.initPromise) {
      await this.initPromise;
    }

    if (this.driver?.cleanup) {
      await this.driver.cleanup();
    }
    this.driver = null;
    this.initialized = false;
    this.initPromise = null;
  }

  /**
   * Switch to a different storage driver.
   * Useful for runtime driver switching (e.g., dev vs prod).
   */
  async switchDriver(driver: IStorageDriver): Promise<void> {
    await this.cleanup();
    await this.initialize(driver);
  }
}

// Export a singleton instance
export const storageManager = new StorageManager();

// Also export the class for testing or multiple instances
export { StorageManager };

