# 👍 Congusto Chat

Vision:
To build the best open-source AI Chat application for developers and power users.

Features:

- [x] Any model from any API provider
- [ ] Multi-modal
  - [x] Text
  - [x] Images
  - [ ] Audio
  - [ ] Video
- [ ] Artifacts
- [ ] Code Interpreter
  - [ ] One-off calculation
  - [ ] Jupyter notebook session
- [ ] Esay deployment
  - [x] Postgres + Vercel/Railway (or any other host with node support)
  - [ ] Local deployment with SQLite an no auth.
- [x] MIT license allows for commercial use and modification.

Milestones:

- ![GitHub milestone details](https://img.shields.io/github/milestones/progress/congustoai/chat/1)
- ![GitHub milestone details](https://img.shields.io/github/milestones/progress/congustoai/chat/2)
- ![GitHub milestone details](https://img.shields.io/github/milestones/progress/congustoai/chat/4)
- ![GitHub milestone details](https://img.shields.io/github/milestones/progress/congustoai/chat/3)

## Hosted Version

- Go to [Congusto Chat](https://chat.congusto.ai) and create an account.
- Go to Settings/Providers, add your API Key to a default provider, or configure a new provider and models.
- Go to Settings/Assistants, create a new assistant that combines the model, API Key, and your system prompt.
- Start chatting.

## Deploy your own

When deploying Congusto Chat, you will need:

### Postgres database.

Some options (not sponsored):
- [Neon](https://neon.tech) - Free tier available. Has a nice UI for managing the database.
- [Supabase](https://supabase.com) - Free tier available. Has a nice UI for managing the database.
  - Make sure you get the "Session mode" connection string:
  - Go to `https://supabase.com/dashboard/project/[your project]/settings/database`
    - Select `[x] Display connection pooler: Mode: Session` and copy the **Database URL**.
  - We only want the database, not the Auth/API functionality.
- Deploy on [Railway](https://railway.app) - Free tier available. The UI is minimal, you might want to use pgAdmin or similar to manage the database.
- Deploy on any vps - Digital Ocean, AWS, etc. - You will need to manage the database yourself.

You will need the set the `DATABASE_URL` env variabled to the Postgres connection string, that should look like this:

```
DATABASE_URL=postgres://user:password@host:port/database
```

TODO: Local deployment with SQLite and no Auth.

### OAuth Authentication with Google and/or Github

#### Github

Github is the easiest to set up.
- Go to [Github Developer Settings/OAuth Apps](https://github.com/settings/applications) and create a new OAuth App.

  - Set the `Homepage URL` to your domain.
  - Set the `Authorization callback URL` to `https://yourdomain.com/login/github`

- Github does not allow multiple callback URLs, so if you want to both deploy publicly and do local development, you will need to create an extra OAuth App for local development.
  - Set the `Authorization callback URL` to `http://localhost:5173/login/github`

Set the following environment variables:

```
GITHUB_CLIENT_ID=your client id
GITHUB_CLIENT_SECRET=your client secret
```

Make sure to set the correct one for prod/dev. The redirect will fail if the redirect URL does not match the one in the OAuth App.

If you don't want Github auth, you can disable the login button in the UI by setting the following environment variable:

```
PUBLIC_DISABLE_GITHUB_LOGIN=true
```

#### Google

To set up OAuth authentication with Google:

- Go to the [Google Cloud Console](https://console.cloud.google.com/).
- Create a new project or select an existing one.
- Navigate to "APIs & Services" > "Credentials".
- Click "Create Credentials" and select "OAuth client ID".
- Choose "Web application" as the application type.
- Set the "Authorized JavaScript origins" to your domain (e.g., `https://yourdomain.com`).
- For local development, add `http://localhost:5173` as an authorized JavaScript origin and `http://localhost:5173/login/google` as a redirect URI.

After creating the OAuth client, you'll receive a client ID and client secret. Set these as environment variables:

```
GOOGLE_CLIENT_ID=your client id
GOOGLE_CLIENT_SECRET=your client secret
```

If you don't want Google auth, you can disable the login button in the UI by setting the following environment variable:

```
PUBLIC_DISABLE_GOOGLE_LOGIN=true
```

### Email login
Coming soon.

## Local development

- Clone the repository: `git clone https://github.com/ConGustoAI/chat`
- Copy `.env.example` to `.env` and set the environment variables.
- Make sure you have NodeJS v20+ installed.
- Install the dependencies
  - `npm i`

- Populate .env with your Postgres connection string, Google and/or Github OAuth credentials.

- Run migrations (populate the table structure) and seed the database with default data.
  - `npm db:migrate`
  - `npm db:seed`

- Start the dev server
  - `npm dev`

- Open the browser at http://localhost:5173 and sign up as a new user.

> **Note:** Run migrations when you make changes to the database schema (src/lib/db/schema/*.ts):
- `npm db:generate` to update the migrations.
- `npm db:migrate` to apply the migrations. This will sync the database schema with the code.

If you update the default providers/models/assistants, don't forget to reflect this in `src/scripts/seed.ts`

## Deployment on Railway.app

- Fork the repository on Github.
- Create a new project, "Deploy from GitHub" and point it to our repository.
- Set the envorpnment variables in the settings.
- Set the domain name to your domain, make sure it matches the auth callback URL for Google/Github.

> @xl0 You can also deploy Postgres on Railway, but the management UI is minimal. I prefer Supabase or Neon if I have to touch the database.

## Deploy to Vercel

- In `svelte.config.js`, set the `adapter` to `auto` (uncomment auto, comment out node).
- In settings, use the following commands:
  - Build command: `npm run deploy` - this will build the app and run migrations/seed if needed.
  - Install command: `npm i`
  - Development command: `npm dev`

- Node version: 20
- Runtime limits: 60 seconds on Hoby plan, 300 seconds on Pro plan.
- Set the environment variables.
- Set the domain name to your domain, and make sure the auth callback URL for Google/Github matches the domain.

## Admin users

Congusto Chat keeps the providers (OpenAI, Anthropic, etc.), models and assistants in the database. It comes with a set of default ones, and the users are able to define their own. The default ones are seeded in the database when you run `npm run db:seed`.

To edit the default providers, models, and assistants through the UI, the user needs to be an Admin.
To make a user an Admin, set the `is_admin` field to `true` for that user in the `public.users` table, you will see the Admin entries in the Settings page.

## Development

For backend logs, set `DEBUG=app:*` to see all logs. You can also set it a subset of the logs, e.g., `DEBUG=app:db*` to see only the database logs.
For frontend logs, set `debug` to `*` in the browser local storage.
See the [debug](https://www.npmjs.com/package/debug) package for more information.

## Sponsors:
Possibly, you: [info@congusto.ai](mailto:info@congusto.ai)
