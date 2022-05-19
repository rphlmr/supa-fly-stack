# Remix Supa Fly Stack

![The Remix Indie Stack](https://raw.githubusercontent.com/rphlmr/supa-fly-stack/main/doc/supa-fly-stak.png)

Learn more about [Remix Stacks](https://remix.run/stacks).

```
npx create-remix --template rphlmr/supa-fly-stack
```

## What's in the stack

- [Fly app deployment](https://fly.io) with [Docker](https://www.docker.com/products/docker-desktop/)
- Production-ready [Supabase Database](https://supabase.com/)
- Healthcheck endpoint for [Fly backups region fallbacks](https://fly.io/docs/reference/configuration/#services-http_checks)
- [GitHub Actions](https://github.com/features/actions) for deploy on merge to production and staging environments
- Email/Password Authentication with [cookie-based sessions](https://remix.run/docs/en/v1/api/remix#createcookiesessionstorage)
  - **NEW** : Magic Link login 🥳
- Database ORM with [Prisma](https://prisma.io)
- Forms Schema (client and server sides !) validation with [Remix Params Helper](https://github.com/kiliman/remix-params-helper)
- Styling with [Tailwind](https://tailwindcss.com/)
- End-to-end testing with [Cypress](https://cypress.io)
- Local third party request mocking with [MSW](https://mswjs.io)
- Unit testing with [Vitest](https://vitest.dev) and [Testing Library](https://testing-library.com)
- Code formatting with [Prettier](https://prettier.io)
- Linting with [ESLint](https://eslint.org)
- Static Types with [TypeScript](https://typescriptlang.org)

Not a fan of bits of the stack? Fork it, change it, and use `npx create-remix --template your/repo`! Make it your own.

## Development

- Download and run [Docker Desktop](https://www.docker.com/products/docker-desktop/)

  > **Note:** Needed to create a [shadow database for prisma](https://www.prisma.io/docs/concepts/components/prisma-migrate/shadow-database)

  > **Note:** Shadow database is local and run by `docker-compose.yml`

- Create a [Supabase Database](https://supabase.com/) (Free tiers gives you 2 databases)

  > **Note:** Only one for playing around with Supabase or 2 for `staging` and `production`

  > **Note:** Used all your free tiers ? Also works with [Supabase CLI](https://github.com/supabase/cli) and local self-hosting

  > **Note:** Create a strong database password, but prefer a passphrase, it'll be more easy to use in connection string (no need to escape special char)
  >
  > _example : my_strong_passphrase_

- Go to https://app.supabase.io/project/{PROJECT}/settings/api to find your secrets
- "Project API keys"
- Add your `SUPABASE_URL`, `SERVER_URL`, `SUPABASE_SERVICE_ROLE` (aka `service_role` `secret`), `SUPABASE_ANON_PUBLIC` (aka `anon` `public`) and `DATABASE_URL` in the `.env` file
  > **Note:** `SERVER_URL` is your localhost on dev. It'll work for magic link login

```en
DATABASE_URL="postgres://postgres:{STAGING_POSTGRES_PASSWORD}@db.{STAGING_YOUR_INSTANCE_NAME}.supabase.co:5432/postgres"
SHADOW_DATABASE_URL="postgresql://postgres:postgres@localhost:12345/postgres"
SUPABASE_ANON_PUBLIC="{ANON_PUBLIC}"
SUPABASE_SERVICE_ROLE="{SERVICE_ROLE}"
SUPABASE_URL="https://{STAGING_YOUR_INSTANCE_NAME}.supabase.co"
SESSION_SECRET="super-duper-s3cret"
SERVER_URL="http://localhost:3000"
```

- Initial setup:

  ```sh
  npm run setup
  ```

- Start dev server:

  ```sh
  npm run dev
  ```

This starts your app in development mode, rebuilding assets on file changes.

The database seed script creates a new user with some data you can use to get started:

- Email: `hello@supabase.com`
- Password: `supabase`

### Relevant code:

This is a pretty simple note-taking app, but it's a good example of how you can build a full stack app with Prisma, Supabase and Remix. The main functionality is creating users, logging in and out (handling access and refresh tokens + refresh on expire), and creating and deleting notes.

- auth / session [./app/core/auth](./app/core/auth)
- creating, and deleting notes [./app/modules/note](./app/modules/note)

## Deployment

> Do what you know if you are a Fly.io expert.

This Remix Stack comes with two GitHub Actions that handle automatically deploying your app to production and staging environments.

Prior to your first deployment, you'll need to do a few things:

- [Install Fly](https://fly.io/docs/getting-started/installing-flyctl/)

- Sign up and log in to Fly

  ```sh
  fly auth signup
  ```

  > **Note:** If you have more than one Fly account, ensure that you are signed into the same account in the Fly CLI as you are in the browser. In your terminal, run `fly auth whoami` and ensure the email matches the Fly account signed into the browser.

- Create two apps on Fly, one for staging and one for production:

  ```sh
  fly create supa-fly-stack-template
  fly create supa-fly-stack-template-staging
  ```

  - Initialize Git.

  ```sh
  git init
  ```

- Create a new [GitHub Repository](https://repo.new), and then add it as the remote for your project. **Do not push your app yet!**

  ```sh
  git remote add origin <ORIGIN_URL>
  ```

- Add a `FLY_API_TOKEN` to your GitHub repo. To do this, go to your user settings on Fly and create a new [token](https://web.fly.io/user/personal_access_tokens/new), then add it to [your repo secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) with the name `FLY_API_TOKEN`.

- Add a `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`,`SUPABASE_ANON_PUBLIC`, `SERVER_URL` and `DATABASE_URL` to your fly app secrets

  To do this you can run the following commands:

  ```sh
  # staging
  fly secrets set SESSION_SECRET=$(openssl rand -hex 32) --app supa-fly-stack-template-staging
  fly secrets set SUPABASE_URL="https://{YOUR_STAGING_INSTANCE_NAME}.supabase.co" --app supa-fly-stack-template-staging
  fly secrets set SUPABASE_SERVICE_ROLE="{STAGING_SUPABASE_SERVICE_ROLE}" --app supa-fly-stack-template-staging
  fly secrets set SUPABASE_ANON_PUBLIC="{STAGING_SUPABASE_ANON_PUBLIC}" --app supa-fly-stack-template-staging
  fly secrets set DATABASE_URL="postgres://postgres:{STAGING_POSTGRES_PASSWORD}@db.{STAGING_YOUR_INSTANCE_NAME}.supabase.co:5432/postgres" --app supa-fly-stack-template-staging
  fly secrets set SERVER_URL="https://{YOUR_STAGING_SERVEUR_URL}" --app supa-fly-stack-template-staging

  # production
  fly secrets set SESSION_SECRET=$(openssl rand -hex 32) --app supa-fly-stack-template
  fly secrets set SUPABASE_URL="https://{YOUR_INSTANCE_NAME}.supabase.co" --app supa-fly-stack-template
  fly secrets set SUPABASE_SERVICE_ROLE="{SUPABASE_SERVICE_ROLE}" --app supa-fly-stack-template
  fly secrets set SUPABASE_ANON_PUBLIC="{SUPABASE_ANON_PUBLIC}" --app supa-fly-stack-template
  fly secrets set DATABASE_URL="postgres://postgres:{POSTGRES_PASSWORD}@db.{YOUR_INSTANCE_NAME}.supabase.co:5432/postgres" --app supa-fly-stack-template
  fly secrets set SERVER_URL="https://{YOUR_STAGING_SERVEUR_URL}" --app supa-fly-stack-template
  ```

  If you don't have openssl installed, you can also use [1password](https://1password.com/generate-password) to generate a random secret, just replace `$(openssl rand -hex 32)` with the generated secret.

Now that everything is set up you can commit and push your changes to your repo. Every commit to your `main` branch will trigger a deployment to your production environment, and every commit to your `dev` branch will trigger a deployment to your staging environment.

## GitHub Actions

> DISCLAIMER : Github actions ==> I'm not an expert about that. Read carefully before using it

We use GitHub Actions for continuous integration and deployment. Anything that gets into the `main` branch will be deployed to production after running tests/build/etc. Anything in the `dev` branch will be deployed to staging.

👉 **You have to add some env secrets for cypress.** 👈

Add a `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`,`SUPABASE_ANON_PUBLIC`, `SERVER_URL` and `DATABASE_URL` to [your repo secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## Testing

### Cypress

We use Cypress for our End-to-End tests in this project. You'll find those in the `cypress` directory. As you make changes, add to an existing file or create a new file in the `cypress/e2e` directory to test your changes.

We use [`@testing-library/cypress`](https://testing-library.com/cypress) for selecting elements on the page semantically.

To run these tests in development, complete your `.env` and run `npm run test:e2e:dev` which will start the dev server for the app as well as the Cypress client. Make sure the database is running in docker as described above.

We also have a utility to auto-delete the user at the end of your test. Just make sure to add this in each test file:

```ts
afterEach(() => {
  cy.cleanupUser();
});
```

That way, we can keep your test db clean and keep your tests isolated from one another.

### Vitest

For lower level tests of utilities and individual components, we use `vitest`. We have DOM-specific assertion helpers via [`@testing-library/jest-dom`](https://testing-library.com/jest-dom).

### Type Checking

This project uses TypeScript. It's recommended to get TypeScript set up for your editor to get a really great in-editor experience with type checking and auto-complete. To run type checking across the whole project, run `npm run typecheck`.

### Linting

This project uses ESLint for linting. That is configured in `.eslintrc.js`.

### Formatting

We use [Prettier](https://prettier.io/) for auto-formatting in this project. It's recommended to install an editor plugin (like the [VSCode Prettier plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) to get auto-formatting on save. There's also a `npm run format` script you can run to format all files in the project.

CC BY-NC-SA 4.0

```

```
