# Required Supabase activation
The application code is repaired, but these database steps cannot be applied with the public client key.
1. Run setup.sql in this project's Supabase SQL Editor. It preserves products, adds category/availability, restricts product writes to store_admins, and guards image writes.
2. Create your admin user in Authentication > Users. Copy its User UID, then run the commented INSERT at the bottom of setup.sql with that UUID. Never place a password or service-role key in website files.
3. Run categories.sql to restore categories only for identifiable image filenames or unique titles. Review remaining items in admin; duplicate names must not be guessed.
4. Log into admin.html. Verify adding, editing (including two same-name items), uploading and deleting a disposable product, then refresh the storefront. Verify anonymous product writes are denied.
The storefront has no silent local inventory fallback. Network errors are shown instead of displaying outdated prices. Existing local cart IDs are ignored when they do not correspond to current database records.
Live Supabase access was blocked by the environment proxy during repair. Local tests used mocked REST responses; live permissions and writes remain unverified.
