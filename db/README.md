# Database layout

`migrations/` is the authoritative database schema history. Every schema change
must be introduced through a new numbered migration and applied with:

```powershell
pnpm run db:migrate
```

`seeds/` contains executable seed data consumed by the repository's seed
commands.

`reference/` is a browse-friendly SQL catalogue organized by tables,
functions, indexes, and views. Its files are not a deployment mechanism. When a
database object changes, add the change to a numbered migration first and then
mirror the resulting definition under `reference/` for inspection and test
support.

Do not execute `reference/table init.sql` or the individual reference files to
upgrade an environment.
