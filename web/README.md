# Nested

[![Lines of code](https://tokei.rs/b1/github/Szczurox/Nested)](https://github.com/Szczurox/Nested)
[![License](https://img.shields.io/github/license/Szczurox/Nested?service=github)](https://github.com/Szczurox/Nested/blob/main/LICENSE)

This is a [Next.js](https://nextjs.org/) chat app backed by the self-hosted
`nested-server` API and PostgreSQL.

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

## Self-hosted server

Start `nested-server` with Docker Compose. The web app sends authenticated
requests to the API using the `nested_session` HTTP-only cookie. Set
`NEXT_PUBLIC_SERVER_URL` in [`.env.local`](./.env.local) when the API is not
available at `http://localhost:4000`:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:4000
```

## Voice channels

Voice and chat realtime events are provided by `nested-server` over Socket.IO.

## Deploy on Vercel

This project uses [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) for hosting and some serverless functions.

Check out [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

Make sure to add all of the environment variables to Vercel's enviroment variables in **Settings > Environment Variables**.

## Side notes

- If you prefer [yarn](https://yarnpkg.com/) over [npm](https://www.npmjs.com/) after creating `package-lock.json` you can remove `package.json` and use:

```bash
yarn import
```

&emsp;&ensp;&ensp;to create `yarn.lock` file from `package-lock.json`.
