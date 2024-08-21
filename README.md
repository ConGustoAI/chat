

# 👍 Congusto Chat

Vision:
To build the best AI Chat application for developers and power users.

Planned Features:
- [x] Any model from any provider
- Multi-modal
    - [x] Text
    - [ ] Images
    - [ ] Audio
    - [ ] Video
- [ ] Artifacts
- [ ] Code Interpreter
    - [ ] One-off calculation
    - [ ] Jupyter notebook session
- [ ] Deploy locally and in the cloud

Milestones:

- ![GitHub milestone details](https://img.shields.io/github/milestones/progress/congustoai/chat/1)
- ![GitHub milestone details](https://img.shields.io/github/milestones/progress/congustoai/chat/2)
- ![GitHub milestone details](https://img.shields.io/github/milestones/progress/congustoai/chat/3)
- ![GitHub milestone details](https://img.shields.io/github/milestones/progress/congustoai/chat/4)

## Hosted Version

- Go to [Congusto Chat](https://chat.congusto.ai) and create an account.
- Go to Settings/Providers, add your API Key to an existing provider, or create a new provider.
- Go to Settings/Assistants, create a new assistant that combines the model, API Key, and the system prompt.
- Start chatting.

## Deploy your own

When deploying Congusto Chat, you will need:
- Supabase, used for Authentication
- Postgres, used for storing the data. Can be the Supabase Postgres, as you get it for free with Supabase.

TODO: Local deployment with SQLite only.

### Supabase

We suggest at least starting with a hosted Supabase instance, as deploying your own is not entirely trivial.
- Register at [Supabase](https://supabase.com) and create a new project (free)
- Got to `https://supabase.com/dashboard/project/[your project]/settings/auth`
    - Check the "Allow new users to sign up" option. You can allow sign-ups, or manage users manually through Supabase dashboard.
    - If you want Email sign-ups, I suggest configuring an SMTP server (AWS SES, Sendgrid, etc.), as Supabase has very low limits for sending emails.


- Go to `https://supabase.com/dashboard/project/[your project]/settings/auth/providers` and enable the Auth providers you want to use.
    - At the moment Congusto Chat supports Google, Github, and Email sign-ups.
    - Setup for Google and other OAuth providers covered in https://www.youtube.com/watch?v=KfezTtt2GsA

- Go to `https://supabase.com/dashboard/project/[your-project]/auth/url-configuration`
    - Set the Sute URL to your domain, e.g., `https://chat.congusto.ai` , or `http://localhost:5173` for local-only.
    - For local development, add `http://localhost:5173/**` to the allowed redirect URLs.

- Copy the required keys/urls:
    - Go to `https://supabase.com/dashboard/project/[your project]/settings/api` and copy the **Anon key**. and the **Project URL**.
        - Under `Data API Settings`, disable the Data API access.
        - This is important to disable Data API access as we don't use Supabase Row Level Security, and your data will be accessibly by anyone with the Anon key, which may be shared with the users.

    - Go to https://supabase.com/dashboard/project/[your project]/settings/database
        - Select [x] Display connection pooler: Mode: Session and copy the **Database URL**.

We will need to set the following environment variables soon:

### Local development

- Clone the repository
`git clone https://github.com/ConGustoAI/chat` and `cd chat`
- Fill in the `.env` file with the setting you got from Supabase:
```
DATABASE_URL=portgres://....
PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
PUBLIC_SUPABASE_ANON_KEY=...
```

- Make sure you have NodeJS v20 and Bun installed.

- Install the dependencies
`bun i`

- Run the migrations - this will populate the database with the required tables.
`bun db:migrate`

- Start the dev server
`bun dev`

- Open the browser at http://localhost:5173 and sign up as a new user.

- Go to the Supabase dashboard and check the user is created:
    https://supabase.com/dashboard/project/[your user]/auth/users

- Go to the Supabase Table Editor, select the `public` schema and the `users` table.
    - Make yourself an Admin by setting `admin` to `true` for your user.
















