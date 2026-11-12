import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL ?? 'https://wildcardz.app/privacy';
export const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://wildcardz.app/terms';
export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'support@wildcardz.app';

export const appVersion = () => Constants.expoConfig?.version ?? '1.0.0';

export const openUrl = (url: string) =>
  WebBrowser.openBrowserAsync(url, {
    toolbarColor: '#121A8F',
    controlsColor: '#FFE14D',
  }).catch(() => Linking.openURL(url));

export const emailSupport = (subject: string) =>
  Linking.openURL(
    `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `\n\n---\nWildcardz ${appVersion()} · ${Platform.OS} ${Platform.Version}`,
    )}`,
  ).catch(() => {});

export async function rateApp() {
  try {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
      return;
    }
  } catch {}
  const url = StoreReview.storeUrl();
  if (url) Linking.openURL(url).catch(() => {});
}
