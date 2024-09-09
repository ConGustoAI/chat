# 👍 Congusto Chat

Vision:
To build the best open-source AI Chat application for developers and power users.

Features:

- [x] Any model from any API provider
- [~] Multi-modal
  - [x] Text
  - [ ] Images
  - [ ] Audio
  - [ ] Video
- [ ] Artifacts
- [ ] Code Interpreter
  - [ ] One-off calculation
  - [ ] Jupyter notebook session
- [~] Esay deployment
  - [x] Postgres + Vercel (or any other host with node support)
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

- Github does not allow multiple callback URLs, so if you want to both deploy publicly and do lovel development, you will need to create an extra OAuth App for local development.
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
- For local development:
  - Set the "Authorized redirect URIs" to `https://yourdomain.com/login/google`.
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
- Make sure you have NodeJS v20 and Bun installed.
  - Install NodeJS 20, platform-dependent.
  - `npm install -g bun`

- Install the dependencies
  `bun i`

- Run migrations (populate the table structure) and seed the database with default data.
  `bun db:migrate`
  `bun db:seed`

- Start the dev server
  `bun dev`

- Open the browser at http://localhost:5173 and sign up as a new user.
- In your database, the `public.users` table should have a new user.
  - Set the `is_admin` field to `true` to make the user an admin.

> **Note:** Run migrations when you make changes to the database schema (src/lib/db/schema/*.ts):
- `bun db:generate` to update the migrations.
- `bun db:migrate` to apply the migrations. This will sync the database schema with the code.

If you update the default providers/models/assistants, don't forget to reflect this in `src/lib/db/seed.ts`

## Deployment on Railway.app (Recommended)

- Fork the repository on Github.
- Create a new project, "Deploy from GitHub" and point it to our repository.
- In settings:
  - Set the "start command" to `node build`.
- Set the envorpnment variables in the settings.

- Set the domain name to your domain,



## Deploy to Vercel (Not recommended)

> The issue with Vercel is, instead of the normal long-lived node runtime, they wrap your code into "server functions" that are short-lived, and then charge per millisecond of their runtime. On the hobby plan, the default runtime cap is 10 seconds that can be extended to 60.
> When we execute a chat request, the backend function runs for the time the message is being streamed from the LLM provider. This typically takes a few seconds, and can easily be minutes for long message from a slow provider. This will result in a timeous and/or an expensive deployment.

Still, if you choose to deploy to Vercel, you can:

- In `svelte.config.js`, set the `adapter` to `vercel` (uncomment vercel, comment out node).
- In settings, use the following commands:
  - Build command: `bun run deploy` - this will build the app and run migrations/seed if needed.
  - Install command: `bun i`
  - Development command: `bun dev`

- Node version: 20
- Runtime limits: 60 seconds on Hoby plan, 300 seconds on Pro plan.
- Set the environment variables.
- Set the domain name to your domain, and make sure the auth callback URL for Google/Github matches the domain.

## Development

For backend logs, set `DEBUG=app:*` to see all logs. You can also set it a subset of the logs, e.g., `DEBUG=app:db*` to see only the database logs.
For frontend logs, set `debug` to `*` in the browser local storage.
See the [debug](https://www.npmjs.com/package/debug) package for more information.

## Sponsors:
Possibly, you: [info@congusto.ai](mailto:info@congusto.ai)
