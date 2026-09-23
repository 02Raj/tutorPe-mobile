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

## Play Store later

`npx expo prebuild` then open `android/` — package is `in.tutorpe.app`.
