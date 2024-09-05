# 👍 Congusto Chat

Vision:
To build the best AI Chat application for developers and power users.

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
  - [x] Supabase auth + Vercel (or any other host with node support)
  - [ ] Local deployment with SQLite an no auth.


Milestones:

- ![GitHub milestone details](https://img.shields.io/github/milestones/progress/congustoai/chat/1)
- ![GitHub milestone details](https://img.shields.io/github/milestones/progress/congustoai/chat/2)
- ![GitHub milestone details](https://img.shields.io/github/milestones/progress/congustoai/chat/4)
- ![GitHub milestone details](https://img.shields.io/github/milestones/progress/congustoai/chat/3)

## Hosted Version

- Go to [Congusto Chat](https://chat.congusto.ai) and create an account.
- Go to Settings/Providers, add your API Key to an existing provider, or configure a new provider and models.
- Go to Settings/Assistants, create a new assistant that combines the model, API Key, and your system prompt.
- Start chatting.

## Deploy your own

When deploying Congusto Chat, you will need:

- Supabase, used for Authentication
- Postgres, used for storing the data.
  - Using the Postgres from Supabase is the easiest way to go, but you can also deploy your own - there is no dependency on Supabase.

TODO: Local deployment with SQLite and no Auth.

### Supabase

We suggest at least starting with a hosted Supabase instance, as deploying your own is not entirely trivial.

- Register at [Supabase](https://supabase.com) and create a new project (free).
- Got to `https://supabase.com/dashboard/project/[your project]/settings/auth`

  - Check the "Allow new users to sign up" option. You can allow sign-ups, or manage users manually through Supabase dashboard.
  - If you want Email sign-ups, I suggest configuring an SMTP server (AWS SES, Sendgrid, etc.), as Supabase has very low limits for sending emails.

- Go to `https://supabase.com/dashboard/project/[your project]/settings/auth/providers` and enable the Auth providers you want to use.

  - At the moment Congusto Chat supports Google, Github, and Email sign-ups.
  - Setup for Google and other OAuth providers covered in https://www.youtube.com/watch?v=KfezTtt2GsA

- Go to `https://supabase.com/dashboard/project/[your-project]/auth/url-configuration`

  - Set the Site URL to your domain, e.g., `https://chat.congusto.ai` , or `http://localhost:5173` for local-only.
  - For local development, add `http://localhost:5173/**` to the allowed redirect URLs.

- Copy the required keys/urls:

  - Go to `https://supabase.com/dashboard/project/[your project]/settings/api` and copy the **Anon key**. and the **Project URL**. We don't need the SEcret key.
    - Under `Data API Settings`, disable the Data API access.

> **Note**  It is important to disable Data API access as we don't use Supabase Row Level Security, and your data will be accessibly by anyone with the Anon key, which may be shared with the users. IDK why supabase has it on by default.

  - Go to `https://supabase.com/dashboard/project/[your project]/settings/database`
    - Select `[x] Display connection pooler: Mode: Session` and copy the **Database URL**.

### Local development

- Clone the repository
  `git clone https://github.com/ConGustoAI/chat`
- Fill in the `.env` file with the setting you got from Supabase:

```
DATABASE_URL=portgres://....
PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
PUBLIC_SUPABASE_ANON_KEY=...
```

You can disable the unused login methods in the UI by setting the following environment variables:

```
PUBLIC_DISABLE_GOOGLE_LOGIN=true
PUBLIC_DISABLE_GITHUB_LOGIN=true
PUBLIC_DISABLE_EMAIL_LOGIN=true
```

- Make sure you have NodeJS v20 and Bun installed.

  - Install NodeJS 20, platform-dependent.
  - `npm install -g bun`

- Install the dependencies
  `bun i`

- Run migrations (populated the table structure) and seed the database with default data.
  `bun db:migrate`
  `bun db:seed`

- Start the dev server
  `bun dev`

- Open the browser at http://localhost:5173 and sign up as a new user.

- Go to the Supabase dashboard and check the user is created:

  - `https://supabase.com/dashboard/project/[your project]/auth/users`

> **Note:** You can also create the users through the Supabase Dashboard `https://supabase.com/dashboard/project/[your project]/auth/users`

- Go to the Supabase Table Editor, select the `public` schema and the `users` table.
  - `https://supabase.com/dashboard/project/[your project]/editor`
  - Make yourself an Admin by setting `admin` to `true` for your user. This allows you to edit the settings globally.


> **Note:** to run migrations when you make changes to the schema:
- `bun db:generate` to update the migrations.
- `bun db:migrate` to apply the migrations. This will sync the database schema with the code.

If you update the default providers/models/assistants, don't forget to reflect this in `seed.ts.

> **Note:** To see the database with the default data:
- `bun db:seed`



## Deploy to Vercel

- Deploy as usual, and don't forget to set the environment variables in the Vercel dashboard.
- Set the domain name to your domain, and make sure the auth redirect URL in supabase matches the domain.

