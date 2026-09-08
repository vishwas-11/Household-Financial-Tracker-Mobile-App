// Global Polyfills for React Native (Hermes) environment
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

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
