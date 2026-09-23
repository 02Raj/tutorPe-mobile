import { create } from "zustand";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  type User,
  type AuthError,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import type { Institute, Student } from "../lib/types";
import {
  getOrCreateInstitute,
  onInstituteSnapshot,
  onStudentsSnapshot,
} from "../services/db";

type AuthState = {
  user: User | null;
  institute: Institute | null;
  students: Student[];
  ready: boolean;
  busy: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  start: () => () => void;
};

export function authErrorMessage(error: unknown): string {
  const code = (error as AuthError)?.code;
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/user-not-found":
      return "This email is not registered. Sign up on the web or here.";
    case "auth/email-already-in-use":
      return "This email is already registered. Log in instead.";
    case "auth/weak-password":
      return "Use at least 6 characters.";
    default:
      return error instanceof Error ? error.message : "Something went wrong.";
  }
}

let unsubInstitute: (() => void) | null = null;
let unsubStudents: (() => void) | null = null;

function clearListeners() {
  unsubInstitute?.();
  unsubStudents?.();
  unsubInstitute = null;
  unsubStudents = null;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  institute: null,
  students: [],
  ready: false,
  busy: false,

  signIn: async (email, password) => {
    set({ busy: true });
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } finally {
      set({ busy: false });
    }
  },

  signUp: async (name, email, password) => {
    set({ busy: true });
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(result.user, { displayName: name.trim() });
      await getOrCreateInstitute(result.user);
    } finally {
      set({ busy: false });
    }
  },

  signOut: async () => {
    clearListeners();
    await firebaseSignOut(auth);
    set({ user: null, institute: null, students: [], ready: true });
  },

  start: () => {
    return onAuthStateChanged(auth, async (user) => {
      clearListeners();
      if (!user) {
        set({ user: null, institute: null, students: [], ready: true });
        return;
      }
      try {
        const institute = await getOrCreateInstitute(user);
        unsubInstitute = onInstituteSnapshot(user.uid, (next) =>
          set({ institute: next })
        );
        unsubStudents = onStudentsSnapshot(user.uid, (students) =>
          set({ students })
        );
        set({ user, institute, ready: true });
      } catch (error) {
        console.warn("Auth bootstrap failed", error);
        set({ user, ready: true });
      }
    });
  },
}));
