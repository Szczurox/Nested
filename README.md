# Nested

[![Lines of code](https://tokei.rs/b1/github/Szczurox/Nested)](https://github.com/Szczurox/Nested)
[![License](https://img.shields.io/github/license/Szczurox/Nested?service=github)](https://github.com/Szczurox/Nested/blob/main/LICENSE)

This is a [Next.js](https://nextjs.org/) chat app with [Firebase](https://firebase.google.com/)-based backend bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

The project is still in development.

## Getting Started

Firstly, install all needed dependencies:

```bash
npm install
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
```

If you are using [Visual Studio Code](https://code.visualstudio.com/) this command should run automatically.

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Firebase

This project uses [Firebase](https://firebase.google.com/) for database, storage and user authentication.

Go to [Firebase documentation](https://firebase.google.com/docs) for more information.

### Getting Started with Firebase

To get Firebase up and running create a project by going to [Firebase console](https://console.firebase.google.com/u/0/).

Then create [Firestore Database](https://firebase.google.com/docs/firestore) and [Cloud Storage](https://firebase.google.com/docs/storage).

After you are done go to the project settings, scroll down and copy firebase config.

Then go to service accounts category in the setting, get the firebase service account email and generate new private key.

After that create [.env.local](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables) file with this structure

```env
NEXT_PUBLIC_FIREBASE_API_KEY=[apiKey]
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=[authDomain]
NEXT_PUBLIC_FIREBASE_PROJECT_ID=[projectId]
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=[storageBucket]
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=[messagingSenderId]
NEXT_PUBLIC_FIREBASE_APP_ID=[appId]
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=[measurementId]
FIREBASE_CLIENT_EMAIL=[serviceAccountEmail]
FIREBASE_PRIVATE_KEY=[privateKey]
```

## Deploy on Vercel

This project uses [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) for hosting and serverless functions.

Check out [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

Make sure to add `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` to Vercel's enviroment variables in Settings > Environment Variables

## Side notes

-   If you want you can deploy the app to [Firebase](https://firebase.google.com/docs/hosting) or any other host instead of Vercel, it shouldn't affect performance.

-   If you prefer [yarn](https://yarnpkg.com/) over [npm](https://www.npmjs.com/) after creating `package-lock.json` you can remove `package.json` and use:

```bash
yarn import
```

&emsp;&ensp;&ensp;to create `yarn.lock` file from `package-lock.json`.
