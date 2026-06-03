import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartgate.app',
  appName: 'SmartGate',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Points directly to the live server URL, giving instant hybrid App experiences
    url: 'https://ais-pre-32runxbhbfzabxyyo5rxpk-416406961414.asia-southeast1.run.app',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
