# Enabling SSC member storage

With both public settings empty, the site runs an in-memory preview. No answers,
photos or sign-in details leave the page. Refreshing discards the draft.

1. In an SSC-controlled Supabase project, run `profile-schema.sql` before enabling sign-in. It creates one row per authenticated guest; row-level security restricts reads and writes to that guest. The row holds survey answers and a resized JPEG. No public photo bucket is needed.
2. Enable email magic links and configure Google's OAuth provider in Supabase Auth. Add the Supabase callback URL in Google's authorized redirects. Set the production Site URL and allow the exact SSC profile redirect URL, using the final canonical path after any hosting redirects.
3. In a staging copy, set the project URL and **publishable** key in `profile-config.js`. Never put a service-role key, Google secret, or database password in this repo.
4. With two test accounts, verify sign-in, saving, photo replacement, sign-out, and reload. Confirm anonymous clients cannot read rows and neither user can read or change the other's row by ID. Publish the configuration only after these checks pass.
