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

import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  '"shadow*" style props are deprecated',
  '"textShadow*" style props are deprecated',
  'props.pointerEvents is deprecated',
  'Animated: `useNativeDriver` is not supported',
]);

// Suppress React Native Web console deprecation noise in development
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  const _warn = console.warn;
  console.warn = (...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('"shadow*" style props are deprecated') ||
      msg.includes('"textShadow*" style props are deprecated') ||
      msg.includes('props.pointerEvents is deprecated') ||
      msg.includes('useNativeDriver` is not supported')
    ) {
      return;
    }
    _warn(...args);
  };
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
