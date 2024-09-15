# Nested

[![Lines of code](https://tokei.rs/b1/github/Szczurox/Nested)](https://github.com/Szczurox/Nested)
[![License](https://img.shields.io/github/license/Szczurox/Nested?service=github)](https://github.com/Szczurox/Nested/blob/main/LICENSE)

This is a [Next.js](https://nextjs.org/) chat app with [Firebase](https://firebase.google.com/)-based backend.

The project is still in development. 

You can view the live version at [nested.party](https://nested.party/)

## Getting Started

Firstly, install all of the needed dependencies by running:

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

When you are done, go to the project settings, scroll down, and copy firebase config.

Then go to **Service accounts** category in the settings, copy the firebase service account email, and generate a new private key.

After that, create [`.env.local`](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables) file with this structure:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=[apiKey]
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=[authDomain]
NEXT_PUBLIC_FIREBASE_PROJECT_ID=[projectId]
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=[storageBucket]
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=[messagingSenderId]
NEXT_PUBLIC_FIREBASE_APP_ID=[appId]
FIREBASE_CLIENT_EMAIL=[serviceAccountEmail]
FIREBASE_PRIVATE_KEY=[privateKey]
```

Make sure to set up [Firestore Authentication](https://firebase.google.com/docs/auth) and select Email/Password as a sign-in provider in **Sign-in method** tab.

You should also change the action URL in **Templates > Edit template > Customise action URL** to `https://(yourdomain)/verify` after you host the app.

## Livekit

This project uses [LiveKit](https://docs.livekit.io/realtime/quickstarts/nextjs-13/) for real time audio calls.

Check out [LiveKit's documentation](https://docs.livekit.io/home/) for more details

### Getting started with LiveKIt

To get audio calls to work go to [LiveKit's Cloud](https://cloud.livekit.io/) and create a project.

After creating the project, go to **Settings > Keys** and create a new key.

Copy generated values and paste them in `.env.local` file as:

```env
NEXT_PUBLIC_LIVEKIT_URL=[WEBSOCKET URL]
LIVEKIT_API_KEY=[API KEY]
LIVEKIT_API_SECRET=[SECRET KEY]
```

## Deploy on Vercel

This project uses [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) for hosting and some serverless functions.

Check out [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

Make sure to add all of the environment variables to Vercel's enviroment variables in **Settings > Environment Variables**.

## Side notes

-   If you want you can deploy the app to [Firebase](https://firebase.google.com/docs/hosting) or any other host instead of Vercel; it shouldn't affect performance.

-   If you prefer [yarn](https://yarnpkg.com/) over [npm](https://www.npmjs.com/) after creating `package-lock.json` you can remove `package.json` and use:

```bash
yarn import
```

&emsp;&ensp;&ensp;to create `yarn.lock` file from `package-lock.json`.
