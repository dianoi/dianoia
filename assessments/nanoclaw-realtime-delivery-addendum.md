# Real-Time Message Delivery Addendum

**Author:** Dianoia
**Date:** 2026-04-08
**Parent Document:** [nanoclaw-agent-coordination-assessment.md](nanoclaw-agent-coordination-assessment.md)
**Context:** Todd's requirement for instantaneous message delivery

---

## Critical Gap Identified

The original Workshop Direct Messaging proposal has **polling-based delivery with 5-90 minute latency**. This does not meet Todd's requirement for "real-time and instantaneous" notification.

**The problem:**
```
Dianoia sends message → Workshop stores in DB → Nou's next scheduled check (5-90 min later) → Nou reads message
```

This is acceptable for asynchronous coordination but **not** for real-time conversation.

---

## Real-Time Delivery Options

### Option 1: Supabase Realtime + Agent Wake Triggers (Recommended)

**How it works:**

1. **Workshop already has Supabase Realtime** for UI updates
2. Add a **webhook trigger** on `agent_direct_messages` table inserts
3. Webhook calls NanoClaw's **agent wake endpoint** to interrupt scheduled execution
4. Agent wakes, processes message, responds immediately

**Architecture:**

```
Dianoia sends DM
  ↓
POST /agent-dm-send (Workshop Edge Function)
  ↓
INSERT INTO agent_direct_messages
  ↓
Postgres trigger fires → calls Supabase Edge Function
  ↓
POST https://nanoclaw-host/wake-agent
  {
    "agent_id": "nou_uuid",
    "event_type": "agent_dm_received",
    "message_id": "msg_uuid"
  }
  ↓
NanoClaw spawns Nou container immediately
  ↓
Nou queries inbox, processes message, responds
  ↓
Response triggers wake for Dianoia
  ↓
Round-trip < 10 seconds
```

**Supabase webhook (SQL trigger):**

```sql
CREATE OR REPLACE FUNCTION notify_agent_dm()
RETURNS TRIGGER AS $$
BEGIN
  -- Call edge function to wake recipient agent
  PERFORM net.http_post(
    url := 'https://nanoclaw-host/api/wake-agent',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object(
      'agent_id', NEW.to_agent_id,
      'event_type', 'agent_dm_received',
      'message_id', NEW.id,
      'from_agent', NEW.from_agent_id,
      'subject', NEW.subject
    )::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_dm_notify
  AFTER INSERT ON agent_direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_agent_dm();
```

**NanoClaw wake endpoint:**

```typescript
// New endpoint in NanoClaw host
app.post('/api/wake-agent', async (req, res) => {
  const { agent_id, event_type, message_id } = req.body;

  // Map agent_id to group JID
  const groupJid = await getGroupJidForAgent(agent_id);

  // Spawn container immediately with event context
  await spawnContainer({
    jid: groupJid,
    trigger: 'webhook',
    event: {
      type: event_type,
      message_id: message_id
    }
  });

  res.json({ status: 'waking' });
});
```

**Benefits:**
- **Instant delivery** (< 10 seconds round-trip)
- **No polling overhead** when idle
- **Leverages existing Workshop infrastructure** (Supabase Realtime already deployed)
- **Clean separation** — Workshop handles protocol, NanoClaw handles execution
- **Scales naturally** — one wake per message, only when needed

**Limitations:**
- **Requires NanoClaw host modification** — add wake endpoint
- **Public endpoint exposure** — NanoClaw host must be reachable from Supabase
- **Authentication needed** — webhook must verify it's from Workshop

---

### Option 2: Make.com as Message Broker

**How it works:**

1. Workshop sends messages to Make.com webhook instead of direct DB insert
2. Make.com scenario:
   - Stores message in Workshop DB (via Supabase API)
   - Sends wake request to NanoClaw host
   - Logs event for audit
3. NanoClaw agent wakes and processes

**Make.com scenario flow:**

```
Webhook Trigger (incoming agent DM)
  ↓
[1] HTTP Request → Supabase (INSERT agent_direct_messages)
  ↓
[2] HTTP Request → NanoClaw wake endpoint
  ↓
[3] HTTP Request → Workshop protocol event log
  ↓
Response to sender
```

**Benefits:**
- **Visual workflow** — Make.com's UI makes the flow auditable
- **Retry logic built-in** — Make.com handles failed webhook deliveries
- **Easy modifications** — Todd can adjust routing without code changes
- **Monitoring dashboard** — Make.com shows execution history

**Limitations:**
- **Additional dependency** — another service in the critical path
- **Latency overhead** — extra hop adds 200-500ms
- **Cost** — Make.com operations consumed per message
- **Doesn't add value over native Postgres triggers** — Supabase can do all of this

**Verdict:** Make.com doesn't have an intuitive fit here. It's a visual integration tool for connecting SaaS apps. We already have direct database access (Supabase) and can trigger webhooks natively. Make.com would add latency and cost without adding capabilities.

**Where Make.com WOULD be useful:**
- Integrating Workshop with external services (Slack notifications, email summaries)
- Building non-technical user dashboards
- Connecting Workshop to tools without native APIs
- Scheduled reporting tasks that don't need code

**For agent-to-agent messaging:** Native Postgres triggers + NanoClaw wake endpoint is cleaner.

---

### Option 3: WebSocket Connection (Persistent)

**How it works:**

1. Each NanoClaw agent maintains a persistent WebSocket connection to Workshop
2. When message arrives, Workshop pushes via WebSocket
3. Agent processes immediately

**Architecture:**

```
Agent startup → WebSocket connect to Workshop
  ↓
Workshop: INSERT agent_direct_messages
  ↓
Workshop broadcasts to WebSocket subscribers
  ↓
Agent receives push notification
  ↓
Agent processes message, responds
```

**Benefits:**
- **True push delivery** (no polling, no wake latency)
- **Bidirectional** — Workshop can also query agent status

**Limitations:**
- **Connection management complexity** — handle reconnects, timeouts, failures
- **Resource overhead** — persistent connection per agent
- **NanoClaw architecture mismatch** — NanoClaw agents are ephemeral containers that spin up/down
- **Doesn't work across container restarts** — connection breaks when container stops

**Verdict:** WebSockets don't fit NanoClaw's container lifecycle model. Agents aren't always running.

---

## Recommended Architecture: Hybrid Approach

**Combine polling + webhook wake for optimal behavior:**

### For Real-Time Work (Active Sprint Execution)

1. Agent sends heartbeat with `status: "executing"`, `current_sprint: uuid`
2. While executing, agent **maintains short polling** (1-2 minute checks)
3. Workshop webhook wake provides **instant notification** when message arrives
4. Agent processes immediately, continues working

**Latency:** < 10 seconds (webhook wake) or < 2 minutes (polling fallback)

### For Background Monitoring (Idle State)

1. Agent sends heartbeat with `status: "idle"` or `status: "active"`
2. No short polling — relies on **scheduled cron** (15-90 minute cycle)
3. Webhook wake still works but agent may not respond until next cycle if container isn't running

**Latency:** Variable (instant if container running, up to 90 min if container idle)

### Webhook Wake Implementation

**Phase 1: NanoClaw Wake Endpoint**

Add to NanoClaw host:

```typescript
// /api/wake-agent
// Called by Workshop when high-priority event needs immediate agent attention

import { spawn } from 'child_process';

app.post('/api/wake-agent', authenticateWorkshop, async (req, res) => {
  const { agent_id, event_type, message_id, priority } = req.body;

  // Map Workshop agent_id to NanoClaw group JID
  const agentMapping = {
    '4ec57cb4-b4f6-4458-aa07-56de1a0d5ea9': process.env.MAIN_GROUP_JID, // Dianoia
    'nou_agent_uuid': process.env.NOU_GROUP_JID
  };

  const groupJid = agentMapping[agent_id];
  if (!groupJid) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  // Write event to IPC queue for container to pick up
  await fs.writeFile(
    `/workspace/ipc/events/${groupJid}_${Date.now()}.json`,
    JSON.stringify({
      type: event_type,
      message_id: message_id,
      priority: priority || 'normal',
      triggered_at: new Date().toISOString()
    })
  );

  // Spawn container if not already running
  // (NanoClaw's container manager handles de-duplication)
  await spawnContainer(groupJid, {
    trigger: 'webhook',
    event_type: event_type
  });

  res.json({
    status: 'waking',
    agent: agent_id,
    group: groupJid
  });
});

// Middleware to verify webhook is from Workshop
function authenticateWorkshop(req, res, next) {
  const secret = req.headers['x-workshop-secret'];
  if (secret !== process.env.WORKSHOP_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
```

**Phase 2: Workshop Webhook Trigger**

```sql
-- Supabase function to call NanoClaw wake endpoint
CREATE OR REPLACE FUNCTION wake_agent_for_dm()
RETURNS TRIGGER AS $$
DECLARE
  recipient_record RECORD;
BEGIN
  -- Get recipient agent info
  SELECT agent_id, name, status INTO recipient_record
  FROM agent_presence
  WHERE agent_id = NEW.to_agent_id;

  -- Only wake if agent is active or executing (not away/offline)
  IF recipient_record.status IN ('active', 'executing', 'idle') THEN
    PERFORM net.http_post(
      url := 'https://nanoclaw.your-domain.com/api/wake-agent',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Workshop-Secret', current_setting('app.settings.webhook_secret')
      ),
      body := jsonb_build_object(
        'agent_id', NEW.to_agent_id,
        'event_type', 'agent_dm_received',
        'message_id', NEW.id,
        'priority', CASE
          WHEN NEW.message_type = 'request' THEN 'high'
          ELSE 'normal'
        END
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wake_on_agent_dm
  AFTER INSERT ON agent_direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION wake_agent_for_dm();
```

**Phase 3: Agent Inbox Check on Wake**

Update agent monitoring task to check for wake events:

```typescript
// In scheduled task or on container startup
async function checkForWakeEvents() {
  const eventFiles = await fs.readdir('/workspace/ipc/events/');
  const myEvents = eventFiles.filter(f => f.startsWith(process.env.GROUP_JID));

  for (const eventFile of myEvents) {
    const event = JSON.parse(await fs.readFile(`/workspace/ipc/events/${eventFile}`));

    if (event.type === 'agent_dm_received') {
      // Fetch and process the specific message
      const message = await fetchMessage(event.message_id);
      await processMessage(message);

      // Clean up event file
      await fs.unlink(`/workspace/ipc/events/${eventFile}`);
    }
  }
}
```

---

## Revised Implementation Timeline

### Phase 1: Workshop DM Schema + API (Week 1)
- `agent_direct_messages` table
- API endpoints (send, inbox, mark-read)
- **No webhook trigger yet** — polling-based delivery

**Deliverable:** Functional DM system with 5-min polling latency

### Phase 2: NanoClaw Wake Endpoint (Week 2)
- Add `/api/wake-agent` to NanoClaw host
- IPC event queue for wake notifications
- Authentication middleware

**Deliverable:** NanoClaw can receive external wake requests

### Phase 3: Workshop Webhook Integration (Week 2)
- Postgres trigger on `agent_direct_messages`
- Workshop → NanoClaw webhook calls
- Webhook secret management

**Deliverable:** Real-time wake on message receipt (< 10 sec delivery)

### Phase 4: Agent Wake Handling (Week 3)
- Update agent startup to check IPC events
- Process immediate wake events before scheduled work
- Respond and return to idle

**Deliverable:** Full real-time DM flow (Dianoia ↔ Nou)

### Phase 5: Hybrid Polling Strategy (Week 3-4)
- Adaptive polling based on agent status
- Short polling during execution (1-2 min)
- Long polling when idle (90 min)
- Webhook wake overrides polling when needed

**Deliverable:** Optimized resource usage + guaranteed delivery

---

## Success Criteria (Revised)

1. **Real-time delivery:** Message from Dianoia reaches Nou in < 10 seconds when Nou is active
2. **Guaranteed delivery:** Message reaches Nou within 90 minutes even if wake fails (polling fallback)
3. **No polling spam:** Agents don't poll when idle
4. **Public accountability:** All messages visible in Workshop Activity
5. **Reliable wake:** Webhook triggers 99%+ success rate
6. **Graceful degradation:** System works even if webhook endpoint is down (falls back to polling)

---

## Make.com Integration: Where It Fits

**Not recommended for agent messaging**, but Make.com IS useful for:

### 1. Workshop Activity Notifications to Slack/Email
**Scenario:** When sprint claimed, notify team in Slack
```
Workshop protocol_events table → Make.com webhook → Slack message
```

### 2. Daily Coordination Digest
**Scenario:** Every morning, email summary of yesterday's coordination activity
```
Make.com scheduler → Query Workshop API → Format report → Email to team
```

### 3. External Tool Integration
**Scenario:** When sprint completed, create GitHub issue for documentation
```
Workshop sprint complete → Make.com → GitHub API → Create issue
```

### 4. Backup and Archival
**Scenario:** Weekly backup of agent messages to Google Sheets for analysis
```
Make.com scheduler → Workshop API → Google Sheets append
```

**Verdict:** Make.com is valuable for **Workshop → External World** integrations. Not needed for **Agent → Agent** direct messaging, where native Postgres triggers are faster and more reliable.

---

## Recommendation

**Implement Hybrid Polling + Webhook Wake:**

1. **Start with polling-based DM (Phase 1)** — gets functionality working immediately
2. **Add webhook wake (Phases 2-3)** — reduces latency to < 10 seconds for active agents
3. **Optimize with adaptive polling (Phase 5)** — reduces resource waste during idle periods
4. **Reserve Make.com for external integrations** — Slack notifications, email digests, reporting

This delivers real-time performance while maintaining fallback reliability.

---

*Dianoia · Execution Intelligence Agent · 2026-04-08*
