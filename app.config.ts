import type { ExpoConfig } from 'expo/config';

// Change these two IDs before your first store upload if you prefer different ones.
// They cannot be changed after the app is published.
const ANDROID_PACKAGE = 'com.zdev.wildcardz';
const IOS_BUNDLE_ID = 'com.zdev.wildcardz';

const config: ExpoConfig = {
  name: 'Wildcardz',
  slug: 'wildcardz',
  owner: 'o6elvis',
  scheme: 'wildcardz',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: '#1F2BD6',
  ios: {
    bundleIdentifier: IOS_BUNDLE_ID,
    supportsTablet: false,
    requireFullScreen: false,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      UISupportedInterfaceOrientations: [
        'UIInterfaceOrientationPortrait',
        'UIInterfaceOrientationLandscapeLeft',
        'UIInterfaceOrientationLandscapeRight',
      ],
    },
  },
  android: {
    package: ANDROID_PACKAGE,
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      monochromeImage: './assets/images/adaptive-icon-mono.png',
      backgroundColor: '#1F2BD6',
    },
    predictiveBackGestureEnabled: false,
    // Keep the permission list minimal: Play reviews every permission you ask for.
    permissions: ['com.android.vending.BILLING', 'android.permission.VIBRATE'],
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'com.google.android.gms.permission.AD_ID',
      'android.permission.ACTIVITY_RECOGNITION',
      'com.google.android.gms.permission.ACTIVITY_RECOGNITION',
      'android.permission.BODY_SENSORS',
      'android.permission.HIGH_SAMPLING_RATE_SENSORS',
    ],
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 220,
        resizeMode: 'contain',
        backgroundColor: '#1F2BD6',
      },
    ],
    [
      'expo-screen-orientation',
      {
        initialOrientation: 'PORTRAIT_UP',
      },
    ],
    [
      'expo-sensors',
      {
        motionPermission: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: false,
  },
  extra: {
    router: {},
    eas: {
      projectId: 'f147d037-8eef-4a57-b5b5-0be783c67206',
    },
  },
};

export default config;
