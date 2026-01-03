import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.monofloor.equipes',
  appName: 'Monofloor Equipes',
  webDir: 'www',
  // Use capacitor:// scheme to avoid CORS issues with fetch
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'monofloor.app',
  },
  plugins: {
    // Enable native HTTP to bypass WKWebView CORS issues
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#000000',
      showSpinner: false,
      launchFadeOutDuration: 0,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#c9a962',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#0a0a0a',
    scrollEnabled: true,
  },
};

export default config;
