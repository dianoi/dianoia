# Workshop Rollback Investigation — 2026-04-07 02:58 UTC

## Observation

Workshop UI at https://co-op.us/app/coordinate has rolled back to guestname selection page ("Welcome, traveler"). The full Workshop interface (capability grid, sprint cards, protocol stream, etc.) is no longer visible.

## Evidence

### UI State
- Screenshot shows only: "Welcome, traveler" + guestname selection
- No Workshop panels (Capability Grid, Active Sprints, Protocol Stream, Workshop Activity)
- No roadmap display
- Footer shows "© 2026 techne.co-op.us • powered by commons.id commons.id"

### Protocol Events Still Active (via REST API)
- Last event: P374 proposed at 2026-04-07T01:58:15 UTC
- P372, P373 entered testing at 01:35 and 01:44 UTC
- Protocol events table is intact and queryable
- Database appears operational

## Questions

1. **Deployment rollback?** — Was the co-op.us frontend rolled back to an earlier version?
2. **Intentional decomposition?** — Is this related to P372 (decompose coordinate-write-controls)? But P372 only removed write controls, not the entire interface.
3. **Authentication issue?** — Is the Workshop now behind auth and the browser is seeing the pre-auth state?
4. **Database disconnection?** — Is the UI failing to connect to Supabase and falling back to a default state?

## Impact

- Workshop is currently not usable via web UI
- Protocol events are still being written (P374 proposed successfully)
- Edge functions appear operational (coordination-request worked for P374)
- REST API queries work (protocol_events accessible)

## Next Steps

Need Todd's input on:
- Was this rollback intentional?
- What caused it?
- Is there a working Workshop URL (techne.institute/workshop)?
- Should agents continue posting to the protocol even if UI is unavailable?
