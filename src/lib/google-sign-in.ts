import Constants from "expo-constants";
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

export function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

export function googleSignInBlockedInExpoGo(): string {
  return "Google login cannot run in Expo Go. Google blocked that browser OAuth. Use email login here, or install a native build: npx expo run:android";
}

let configured = false;

function configureGoogle() {
  if (configured) return;
  if (!webClientId) {
    throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing.");
  }
  GoogleSignin.configure({ webClientId });
  configured = true;
}

export async function getGoogleIdToken(): Promise<string | null> {
  if (isExpoGo()) {
    throw new Error(googleSignInBlockedInExpoGo());
  }
  configureGoogle();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (response.type === "cancelled") return null;
  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error("Google did not return an ID token. Add the debug SHA-1 in Firebase.");
  }
  return idToken;
}

export function googleNativeErrorMessage(error: unknown): string {
  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return "Google sign-in was cancelled.";
    }
    if (error.code === statusCodes.IN_PROGRESS) {
      return "Google sign-in is already in progress.";
    }
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return "Google Play Services is missing or outdated on this phone.";
    }
  }
  return error instanceof Error ? error.message : "Google sign-in failed.";
}
