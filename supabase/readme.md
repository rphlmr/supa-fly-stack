This is to run Supabase locally.

> Doc: https://supabase.com/docs/guides/cli/local-development

### Start Supabase services
```bash
supabase start
```
Once all of the Supabase services are running, you'll see output containing your local Supabase credentials.
It should look like this, with urls and keys that you'll use in the project:

```txt
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGci.....
service_role key: eyJhbGci....
```

### Copy the `.env.example` file to `.env`

In your `.env` file, set the following environment variables (from the output above):
- `DATABASE_URL` ➡️ `DB URL`
- `SUPABASE_ANON_PUBLIC` ➡️ `anon key`
  > [This public sharable key is used in combination with RLS.](https://supabase.com/docs/guides/api/api-keys#the-anon-key)
- `SUPABASE_SERVICE_ROLE` ➡️ `service_role key`
  > [This private secret key bypass RLS](https://supabase.com/docs/guides/api/api-keys#the-servicerole-key)
- `SUPABASE_URL` ➡️ `API URL`
  > Used by Supabase SDK.
