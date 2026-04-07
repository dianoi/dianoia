# Issue Report: Task Cancellation Requests Not Completing

**Date:** 2026-03-03T00:58:54 UTC
**Reporter:** Dianoia (Code · Execution Intelligence)
**Severity:** Medium
**Component:** nanoclaw MCP server - task scheduling system

---

## Summary

Task cancellation requests via `mcp__nanoclaw__cancel_task` return success messages ("Task [id] cancellation requested") but the tasks remain active and continue to appear in `mcp__nanoclaw__list_tasks` output. Cancelled tasks are not being removed from the scheduler.

---

## Expected Behavior

When `mcp__nanoclaw__cancel_task` is called with a valid task ID:
1. The task should be marked for cancellation
2. The task should stop executing on its schedule
3. The task should be removed from `mcp__nanoclaw__list_tasks` output
4. The tool should return confirmation of completed cancellation

---

## Actual Behavior

When `mcp__nanoclaw__cancel_task` is called:
1. ✓ Tool returns: "Task [id] cancellation requested"
2. ✗ Task continues to appear in `mcp__nanoclaw__list_tasks` as "active"
3. ✗ Task remains scheduled with "next" execution time
4. ✗ No observable change in task status after cancellation request

---

## Reproduction Steps

1. Create a scheduled task:
   ```
   mcp__nanoclaw__schedule_task(
     prompt: "Test task",
     schedule_type: "cron",
     schedule_value: "0 */3 * * *"
   )
   ```
   Response: `Task scheduled (1772496350284-07qyhn.json): cron - 0 */3 * * *`

2. List tasks to confirm creation:
   ```
   mcp__nanoclaw__list_tasks()
   ```
   Response shows task as active

3. Request cancellation:
   ```
   mcp__nanoclaw__cancel_task(task_id: "task-1772496350284-07qyhn")
   ```
   Response: `Task task-1772496350284-07qyhn cancellation requested.`

4. List tasks again:
   ```
   mcp__nanoclaw__list_tasks()
   ```
   **BUG:** Task still shows as active with same status as before cancellation

---

## Evidence

**Multiple cancellation attempts on same session (2026-03-03):**

| Task ID | Cancellation Requested | Still Active? |
|---------|----------------------|---------------|
| `task-1772494141077-vqp29r` | 00:05:50 UTC | Yes (as of 00:58) |
| `task-1772496839865-dv6037` | 00:17:21 UTC | Unknown |
| `task-1772496840791-xt4j9w` | 00:51:25 UTC | Yes (as of 00:58) |
| `task-1772496350284-07qyhn` | 00:51:27 UTC | Yes (as of 00:58) |

**Current task list (00:58:54 UTC):**
```
- [task-1772497042022-iu05za] **Workshop Coordination Cycle... (cron: */90 * * * *) - active, next: 2026-03-03T01:00:00.000Z
- [task-1772496840791-xt4j9w] **Workshop Coordination Cycle... (cron: 0 */3 * * *) - active, next: 2026-03-03T03:00:00.000Z
- [task-1772496350284-07qyhn] **Workshop Coordination Cycle... (cron: 0 */3 * * *) - active, next: 2026-03-03T03:00:00.000Z
```

All tasks show status "active" despite cancellation requests.

---

## Environment

- **MCP Server:** nanoclaw (WhatsApp integration)
- **Tool:** `mcp__nanoclaw__cancel_task`
- **Session:** main group (`/workspace/group`)
- **Claude Code Version:** 2.1.34
- **Task Storage:** Unknown (not found in `/workspace/project/data/sessions/main/.claude/`)

---

## Impact

**Current workaround impact:**
- Multiple duplicate cron jobs running simultaneously
- Unable to cleanly replace/update scheduled tasks without manual intervention
- Task list pollution (3 tasks when only 1 is desired)
- Potential for unexpected behavior if multiple tasks execute concurrently

**Operational impact:**
- Medium severity: Can work around by creating new tasks, but cleanup is not possible
- No data loss or critical functionality blocked
- Creates technical debt (orphaned task records)

---

## Hypothesis

Possible causes:

1. **Async cancellation not completing:** Tool returns "requested" language, suggesting cancellation is queued but not executed immediately. May require background process or event loop cycle to complete.

2. **Task storage persistence:** Tasks may be stored in a database or file system that requires explicit commit/flush operation after cancellation request.

3. **Session isolation:** Cancellation may be session-scoped but task list query may be reading from a shared/global scope.

4. **MCP server state management:** nanoclaw server may need restart or state refresh to process cancellation queue.

---

## Requested Actions

1. **Immediate:** Clarify expected behavior - is "cancellation requested" the final state, or should there be a follow-up confirmation?

2. **Short-term:** Provide manual cleanup procedure to remove orphaned tasks (direct database/file access, server restart, etc.)

3. **Long-term:** Fix cancellation completion or update tool response to reflect actual behavior:
   - Option A: Make cancellation synchronous and return "Task cancelled" when complete
   - Option B: Add `mcp__nanoclaw__task_status(task_id)` tool to check cancellation status
   - Option C: Document expected delay and add note that tasks clear on next server restart

---

## Additional Context

This issue was discovered while updating workshop coordination cron frequency from 3 hours to 90 minutes (per Todd's request at 00:16:36 UTC). Multiple attempts to cancel old 3-hour tasks failed, resulting in current state of 3 active tasks where only 1 is desired.

---

**Reporter Contact:** Dianoia via Workshop (https://co-op.us/app/coordinate)
**Session ID:** 06dc7fbb-4a9b-48fd-8e72-e2f301703eaa
**Conversation Log:** `/workspace/project/data/sessions/main/.claude/projects/-workspace-group/06dc7fbb-4a9b-48fd-8e72-e2f301703eaa.jsonl`
