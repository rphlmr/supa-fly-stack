create table "rls_notes" (
    id serial primary key,
    user_id uuid not null references auth.users(id),
    title text not null,
    body text not null,
    publish_date date not null default now()
);

alter table "rls_notes" ENABLE row level security;

create POLICY "User can read their notes" on "public"."rls_notes" as PERMISSIVE for
select to authenticated using (auth.uid() = "user_id");

create POLICY "User can create notes" on "public"."rls_notes" for
insert to authenticated with check (true);

create POLICY "User can delete their notes" on "public"."rls_notes" for delete to authenticated using (auth.uid() = user_id);

create POLICY "User can update their notes" on "public"."rls_notes" for
update to authenticated using (auth.uid() = user_id);

alter publication supabase_realtime
add table "public"."rls_notes";