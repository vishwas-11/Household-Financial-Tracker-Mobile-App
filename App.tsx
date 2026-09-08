// App.tsx
const _global = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : ({} as any));

if (typeof (_global as any).crypto !== 'object') {
  (_global as any).crypto = {};
}
if (typeof (_global as any).crypto.getRandomValues !== 'function') {
  (_global as any).crypto.getRandomValues = function <T extends ArrayBufferView | null>(array: T): T {
    if (!array) return array;
    const uint8 = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    for (let i = 0; i < uint8.length; i++) {
      uint8[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}
