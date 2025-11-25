import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CardLayoutProvider } from '@/contexts/CardLayoutContext';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { storageManager } from '@/storage';

export default function RootLayout() {
  useEffect(() => {
    // Initialize storage manager on app startup
    // By default, it uses StaticStorageDriver
    // You can switch drivers here if needed:
    // import { DatabaseStorageDriver } from '@/storage/drivers';
    // storageManager.initialize(new DatabaseStorageDriver());
    storageManager.initialize().catch((error) => {
      console.error('Failed to initialize storage:', error);
    });

    // Cleanup on unmount
    return () => {
      storageManager.cleanup().catch((error) => {
        console.error('Failed to cleanup storage:', error);
      });
    };
  }, []);

  return (
    <ThemeProvider>
      <CardLayoutProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </CardLayoutProvider>
    </ThemeProvider>
  );
}

