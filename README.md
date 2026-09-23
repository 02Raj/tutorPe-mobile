# TutorPe mobile (Android first)

React Native (Expo) app for tutors who asked for Android. **Same Firebase project as [tutorpe-web](https://github.com).** Login with the same email. Students, fees, batches, and class schedule stay in sync.

## What is in v1

Used on web, so they are on the phone:

- Home — overdue count + WhatsApp from your number
- Students — search, add, open, mark paid (full + partial)
- Remind — pending fee WhatsApp list
- Classes — today's class + 1-tap WhatsApp
- Batches — create the same `customBatches` as the website

Skipped for now (low use or desktop-shaped): Enquiries, Broadcast, Fee Intelligence AI, Excel import, ID cards, income PDF.

## Run

```bash
cd D:\@Projects\tutorPe-mobile
npm start
```

Scan the QR with Expo Go, or press `a` for an Android emulator.

Copy `.env.example` to `.env` if you clone on another machine. Firebase web keys are public client config — never put admin private keys here.

## Google login

Google **blocked** the Expo Go browser OAuth (`Error 400: invalid_request`). Native Google Sign-In is required. Email/password still works in Expo Go.

1. Firebase → Authentication → Google is already **Enable** (Web client ID is in `.env.local`).
2. Firebase → Project settings → Your apps → **Add Android app**
   - Package name: `in.tutorpe.app`
   - SHA-1 (debug):

```bash
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Copy the SHA-1 line into Firebase. That is the red warning you saw.

3. Stop Expo Go. USB phone or emulator + Android Studio, then:

```bash
cd D:\@Projects\tutorPe-mobile
npx expo run:android
```

This installs a **TutorPe** app (not Expo Go). Continue with Google will work there — same accounts as the website.

## Play Store later

`npx expo prebuild` then open `android/` — package is `in.tutorpe.app`.
