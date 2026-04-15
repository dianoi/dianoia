# P447: Human-Accessible DM Interface — Technical Specification

**Sprint ID:** P447
**Spec Author:** Dianoia
**Implementer:** Nou
**Created:** 2026-04-15
**Layer:** 7 (View) + 2 (State Extension)
**Dependencies:** P386-P390 (Agent messaging infrastructure)

---

## Executive Summary

Extend the existing agent-to-agent direct messaging system (P386-P390) to include human participants, enabling Todd to send/receive messages to Dianoia and Nou via web UI. This eliminates Telegram as the primary coordination channel while maintaining full accountability through Workshop.

**Key insight:** The infrastructure already exists. This sprint adds:
1. Human sender/recipient support in existing `agent_direct_messages` table
2. Web UI at `/app/messages` for viewing and composing messages
3. Minimal agent updates to handle human-sent messages

---

## Context & Motivation

### Current State

**What works:**
- Agents can send direct messages to each other via `SendMessage` tool (P386-P390)
- Messages are stored in `agent_direct_messages` table (P384)
- Workshop Activity displays message summaries (P386)
- Real-time wake triggers via webhooks (P387-P388)
- Agents poll inbox based on adaptive schedule (P389)

**What's missing:**
- Todd has no visibility into agent-agent conversations without checking Workshop Activity
- Todd cannot send messages to agents except via Telegram
- No consolidated message history view
- Agents have no way to distinguish human-sent messages from agent messages

### Why This Matters

**Operational efficiency:**
- Telegram adds latency (manual message formatting, lack of context integration)
- No searchable history of human-agent coordination
- Context is fragmented across Telegram, Workshop chat, and sprint discussions

**Platform independence:**
- Telegram is a single point of failure
- Mobile app dependency creates friction
- Workshop should be self-contained coordination surface

**Transparency:**
- Human-agent messages should have same accountability as agent-agent messages
- Message history should be auditable
- All participants see the same conversation state

---

## Architecture Overview

### Database Extension (Minimal)

Extend existing `agent_direct_messages` table to support human participants:

```sql
-- Add nullable human participant columns
ALTER TABLE agent_direct_messages
ADD COLUMN human_sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN human_recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add constraint: message must have exactly one sender and one recipient
ALTER TABLE agent_direct_messages
ADD CONSTRAINT valid_participants CHECK (
  (from_agent_id IS NOT NULL AND human_sender_id IS NULL AND to_agent_id IS NOT NULL AND human_recipient_id IS NULL)  -- agent-to-agent
  OR (from_agent_id IS NULL AND human_sender_id IS NOT NULL AND to_agent_id IS NOT NULL AND human_recipient_id IS NULL)  -- human-to-agent
  OR (from_agent_id IS NOT NULL AND human_sender_id IS NULL AND to_agent_id IS NULL AND human_recipient_id IS NOT NULL)  -- agent-to-human
);

-- Index for human inbox queries
CREATE INDEX idx_agent_dm_human_recipient ON agent_direct_messages(human_recipient_id, created_at DESC)
WHERE human_recipient_id IS NOT NULL;

-- Update RLS policies for human access
CREATE POLICY "Humans can read their own messages"
  ON agent_direct_messages FOR SELECT
  TO authenticated
  USING (
    human_sender_id = auth.uid() OR
    human_recipient_id = auth.uid() OR
    is_visible_in_workshop = true  -- fallback: all visible messages
  );

CREATE POLICY "Humans can send messages to agents"
  ON agent_direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    human_sender_id = auth.uid() AND
    to_agent_id IS NOT NULL AND
    human_recipient_id IS NULL
  );
```

**Rationale:**
- Reuse existing table structure (no new table overhead)
- Preserve all existing agent-agent functionality
- Clear data model: exactly one sender, exactly one recipient
- Human columns nullable so existing agent-agent messages remain unchanged

### UI Component Structure

```
/app/messages
├── Sidebar (Conversation List)
│   ├── Filter: All / With Dianoia / With Nou / Unread
│   ├── Conversation cards (most recent first)
│   │   ├── Participant name + avatar
│   │   ├── Most recent message preview
│   │   ├── Timestamp (relative)
│   │   └── Unread badge
│   └── Empty state: "No conversations yet"
│
└── Main Panel (Message Thread)
    ├── Header: Participant name + status
    ├── Message list (chronological)
    │   ├── Message bubble (sent/received styling)
    │   ├── Sender name + timestamp
    │   ├── Message body
    │   ├── Sprint badge (if sprint_id present, clickable)
    │   └── Thread indicator (if parent_message_id)
    ├── Compose box
    │   ├── Text input (multiline, auto-resize)
    │   ├── Sprint selector (optional, dropdown of active sprints)
    │   └── Send button
    └── Empty state: "Select a conversation"
```

**Design principles:**
- Match Workshop UI patterns (same component library, same styling)
- Mobile-responsive (collapsible sidebar)
- Real-time updates via Supabase Realtime subscriptions
- Minimal chrome, focus on messages

### Data Flow

**Human sends message:**
```
1. User types message in /app/messages compose box
2. Frontend calls POST /agent-dm-send with:
   - human_sender_id: auth.uid()
   - to_agent_id: <selected_agent>
   - body, summary, message_type, sprint_id (optional)
3. Edge function validates and inserts into agent_direct_messages
4. Postgres trigger fires → protocol event logged
5. Webhook trigger fires → NanoClaw wakes recipient agent (P388)
6. Agent processes message on next wake/poll cycle
7. Agent responds using existing SendMessage tool (to_agent_id → human_recipient_id)
```

**Human receives message:**
```
1. Agent sends message using SendMessage tool
2. Edge function checks: is recipient human? If yes, set human_recipient_id
3. Message inserted into agent_direct_messages
4. Supabase Realtime subscription pushes message to frontend
5. UI updates in < 1 second (message appears in thread + unread count increments)
6. User sees message, clicks to mark as read (updates read_at)
```

---

## Phase 1: Read-Only Human View (MVP)

**Goal:** Todd can view all message history (human-agent + agent-agent) in a dedicated web interface.

### Deliverables

#### 1.1: Database Migration

File: `supabase/migrations/YYYYMMDD_agent_dm_human_support.sql`

```sql
-- Add human participant columns
ALTER TABLE agent_direct_messages
ADD COLUMN IF NOT EXISTS human_sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS human_recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add participant validation constraint
ALTER TABLE agent_direct_messages
DROP CONSTRAINT IF EXISTS valid_participants,
ADD CONSTRAINT valid_participants CHECK (
  -- Exactly one sender and one recipient
  (from_agent_id IS NOT NULL)::int + (human_sender_id IS NOT NULL)::int = 1 AND
  (to_agent_id IS NOT NULL)::int + (human_recipient_id IS NOT NULL)::int = 1
);

-- Indexes for human queries
CREATE INDEX IF NOT EXISTS idx_agent_dm_human_recipient
ON agent_direct_messages(human_recipient_id, created_at DESC)
WHERE human_recipient_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_dm_human_sender
ON agent_direct_messages(human_sender_id, created_at DESC)
WHERE human_sender_id IS NOT NULL;

-- Update RLS: humans can read their messages + all visible messages
DROP POLICY IF EXISTS "Humans can read their own messages" ON agent_direct_messages;
CREATE POLICY "Humans can read their own messages"
  ON agent_direct_messages FOR SELECT
  TO authenticated
  USING (
    human_sender_id = auth.uid() OR
    human_recipient_id = auth.uid() OR
    is_visible_in_workshop = true
  );

-- Human insert policy (Phase 2, included here for completeness)
DROP POLICY IF EXISTS "Humans can send messages to agents" ON agent_direct_messages;
CREATE POLICY "Humans can send messages to agents"
  ON agent_direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    human_sender_id = auth.uid() AND
    to_agent_id IS NOT NULL
  );

-- Rollback script
/*
ALTER TABLE agent_direct_messages
DROP COLUMN IF EXISTS human_sender_id,
DROP COLUMN IF EXISTS human_recipient_id,
DROP CONSTRAINT IF EXISTS valid_participants;

DROP INDEX IF EXISTS idx_agent_dm_human_recipient;
DROP INDEX IF EXISTS idx_agent_dm_human_sender;
*/
```

**Testing:**
- Constraint validation: reject messages with invalid participant combinations
- RLS policies: Todd can read all visible messages + his own
- Index performance: inbox query < 100ms with 1000+ messages
- Backward compatibility: existing agent-agent messages unaffected

#### 1.2: Edge Function Extension: `agent-dm-inbox`

Update existing `/agent-dm-inbox` function to support human queries:

**File:** `supabase/functions/agent-dm-inbox/index.ts`

```typescript
// Add to query parameters
interface InboxRequest {
  agent_id?: string;      // existing: filter by agent recipient
  human_id?: string;      // new: filter by human recipient
  include_read?: boolean;
  limit?: number;
  sprint_id?: string;
}

// Query logic
const userId = human_id || (await getUserIdForAgent(agent_id));

const { data: messages, error } = await supabase
  .from('agent_direct_messages')
  .select(`
    *,
    from_agent:participants!from_agent_id(name, avatar_url),
    to_agent:participants!to_agent_id(name, avatar_url),
    from_human:auth.users!human_sender_id(email),
    to_human:auth.users!human_recipient_id(email),
    sprint:coordination_requests!sprint_id(sprint_id, title)
  `)
  .or(`human_recipient_id.eq.${userId},human_sender_id.eq.${userId},to_agent_id.in.(${agentIds}),from_agent_id.in.(${agentIds})`)
  .order('created_at', { ascending: false })
  .limit(limit);

// Transform for frontend
return messages.map(msg => ({
  id: msg.id,
  from: msg.from_agent?.name || msg.from_human?.email || 'Unknown',
  from_type: msg.from_agent_id ? 'agent' : 'human',
  to: msg.to_agent?.name || msg.to_human?.email || 'Unknown',
  to_type: msg.to_agent_id ? 'agent' : 'human',
  subject: msg.subject,
  body: msg.body,
  summary: msg.summary,
  message_type: msg.message_type,
  sprint: msg.sprint ? {
    id: msg.sprint.sprint_id,
    title: msg.sprint.title
  } : null,
  created_at: msg.created_at,
  read_at: msg.read_at
}));
```

**Testing:**
- Human query returns both human-agent and agent-agent messages
- Agent query returns only agent-agent messages (backward compat)
- Performance: query < 150ms for 100 messages
- Pagination works correctly

#### 1.3: New Edge Function: `agent-dm-conversations`

Get conversation list grouped by participant:

**File:** `supabase/functions/agent-dm-conversations/index.ts`

```typescript
interface ConversationListRequest {
  user_id?: string;  // Defaults to authenticated user
}

interface ConversationSummary {
  participant_id: string;
  participant_name: string;
  participant_type: 'agent' | 'human';
  last_message_at: string;
  last_message_preview: string;
  unread_count: number;
}

async function getConversations(userId: string): Promise<ConversationSummary[]> {
  // Query for all messages involving this user
  const { data: messages } = await supabase
    .from('agent_direct_messages')
    .select('*')
    .or(`human_sender_id.eq.${userId},human_recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  // Group by conversation partner
  const conversations = new Map<string, ConversationSummary>();

  for (const msg of messages) {
    const isFrom = msg.human_sender_id === userId || msg.from_agent_id === await getUserAgentId(userId);
    const partnerId = isFrom ? (msg.to_agent_id || msg.human_recipient_id) : (msg.from_agent_id || msg.human_sender_id);
    const partnerName = isFrom ?
      (await getAgentName(msg.to_agent_id) || await getHumanEmail(msg.human_recipient_id)) :
      (await getAgentName(msg.from_agent_id) || await getHumanEmail(msg.human_sender_id));

    if (!conversations.has(partnerId)) {
      conversations.set(partnerId, {
        participant_id: partnerId,
        participant_name: partnerName,
        participant_type: msg.to_agent_id || msg.from_agent_id ? 'agent' : 'human',
        last_message_at: msg.created_at,
        last_message_preview: msg.summary,
        unread_count: 0
      });
    }

    // Count unread messages
    if (!isFrom && !msg.read_at) {
      conversations.get(partnerId)!.unread_count++;
    }
  }

  return Array.from(conversations.values())
    .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
}
```

**Testing:**
- Returns all conversations sorted by most recent
- Unread count accurate
- Handles both agent and human partners
- Performance: < 200ms for 50 conversations

#### 1.4: UI Component: `/app/messages` Page

**File:** `app/app/messages/page.tsx`

```typescript
export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useAuth();

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Subscribe to new messages
  useEffect(() => {
    const subscription = supabase
      .channel('agent-dms')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'agent_direct_messages',
        filter: `human_recipient_id=eq.${user.id}`
      }, (payload) => {
        handleNewMessage(payload.new);
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, [user.id]);

  // Load thread when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      loadThread(selectedConversation);
    }
  }, [selectedConversation]);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <ConversationList
        conversations={conversations}
        selected={selectedConversation}
        onSelect={setSelectedConversation}
      />

      {/* Main panel */}
      {selectedConversation ? (
        <MessageThread
          messages={messages}
          participant={conversations.find(c => c.participant_id === selectedConversation)}
          onSendMessage={() => {/* Phase 2 */}}
        />
      ) : (
        <EmptyState message="Select a conversation to view messages" />
      )}
    </div>
  );
}
```

**Components:**

**ConversationList.tsx:**
```typescript
interface Props {
  conversations: Conversation[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, selected, onSelect }: Props) {
  return (
    <div className="w-80 border-r bg-gray-50 overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Messages</h2>
      </div>
      {conversations.map(conv => (
        <ConversationCard
          key={conv.participant_id}
          conversation={conv}
          selected={selected === conv.participant_id}
          onClick={() => onSelect(conv.participant_id)}
        />
      ))}
    </div>
  );
}
```

**MessageThread.tsx:**
```typescript
interface Props {
  messages: Message[];
  participant: Conversation['participant'];
  onSendMessage: (body: string) => void;
}

export function MessageThread({ messages, participant, onSendMessage }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Avatar name={participant.participant_name} />
          <div>
            <h3 className="font-semibold">{participant.participant_name}</h3>
            <p className="text-sm text-gray-500">{participant.participant_type}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose box - Phase 2 */}
      <div className="p-4 border-t">
        <p className="text-sm text-gray-500">Compose functionality coming in Phase 2</p>
      </div>
    </div>
  );
}
```

**Testing:**
- All conversations load correctly
- Clicking conversation loads message thread
- Real-time subscription adds new messages without refresh
- Mobile responsive (sidebar collapses)
- Empty states display correctly

#### 1.5: Navigation Integration

Add Messages link to Workshop navigation:

**File:** `app/components/Navigation.tsx`

```typescript
const navItems = [
  { label: 'Coordinate', href: '/app/coordinate', icon: Activity },
  { label: 'Messages', href: '/app/messages', icon: MessageSquare },  // NEW
  { label: 'Profile', href: '/app/profile', icon: User }
];
```

**Testing:**
- Messages link appears in nav
- Active state highlights correctly
- Navigation works on all pages

### Phase 1 Success Criteria

- ✅ Todd can view all message history (human-agent + agent-agent) at `/app/messages`
- ✅ Conversation list shows all participants Todd has messaged with
- ✅ Clicking conversation loads full message thread
- ✅ New messages appear in real-time (< 2 second latency)
- ✅ Sprint badges link to sprint detail pages
- ✅ Thread indicators show conversation context
- ✅ Mobile responsive layout works
- ✅ No regressions to existing agent-agent messaging

### Phase 1 Out of Scope

- Composing messages (Phase 2)
- Marking messages as read from UI (Phase 2)
- Search/filtering (Phase 3)
- File attachments (Phase 3)
- Notifications (Phase 3)

---

## Phase 2: Human Write (Parity with Telegram)

**Goal:** Todd can send messages to agents via web UI, achieving functional parity with Telegram.

### Deliverables

#### 2.1: Compose UI Component

**File:** `app/components/MessageCompose.tsx`

```typescript
interface Props {
  recipientId: string;
  recipientName: string;
  onSend: (message: OutgoingMessage) => void;
}

interface OutgoingMessage {
  body: string;
  subject?: string;
  sprint_id?: string;
  message_type: 'request' | 'response' | 'notification';
}

export function MessageCompose({ recipientId, recipientName, onSend }: Props) {
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<MessageType>('request');

  const handleSend = async () => {
    if (!body.trim()) return;

    const message: OutgoingMessage = {
      body: body.trim(),
      subject: subject.trim() || undefined,
      sprint_id: sprintId || undefined,
      message_type: messageType
    };

    await onSend(message);

    // Clear form
    setBody('');
    setSubject('');
    setSprintId(null);
  };

  return (
    <div className="space-y-3">
      {/* Optional subject line */}
      <input
        type="text"
        placeholder="Subject (optional)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      />

      {/* Message body */}
      <textarea
        placeholder={`Message ${recipientName}...`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSend();
          }
        }}
        className="w-full px-3 py-2 border rounded min-h-[100px] resize-y"
      />

      {/* Metadata row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {/* Sprint selector */}
          <SprintDropdown
            value={sprintId}
            onChange={setSprintId}
            placeholder="Link to sprint (optional)"
          />

          {/* Message type selector */}
          <select
            value={messageType}
            onChange={(e) => setMessageType(e.target.value as MessageType)}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value="request">Request</option>
            <option value="notification">Notification</option>
            <option value="response">Response</option>
          </select>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!body.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Cmd+Enter to send
      </p>
    </div>
  );
}
```

**Testing:**
- Text input works, auto-resizes
- Cmd+Enter keyboard shortcut sends
- Subject line optional
- Sprint selector shows active sprints
- Message type selector works
- Send button disabled when body empty

#### 2.2: Send Message Handler

**File:** `app/app/messages/page.tsx` (add to existing)

```typescript
const handleSendMessage = async (message: OutgoingMessage) => {
  const { body, subject, sprint_id, message_type } = message;

  // Generate summary from body
  const summary = body.length > 180
    ? body.substring(0, 177) + '...'
    : body;

  try {
    const response = await fetch('/api/agent-dm-send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        human_sender_id: user.id,
        to_agent_id: selectedConversation,
        message_type,
        subject: subject || null,
        body,
        summary,
        sprint_id: sprint_id || null
      })
    });

    const result = await response.json();

    if (result.ok) {
      // Optimistic update: add to local state
      const newMessage: Message = {
        id: result.message_id,
        from: user.email,
        from_type: 'human',
        to: conversations.find(c => c.participant_id === selectedConversation)?.participant_name || '',
        to_type: 'agent',
        subject,
        body,
        summary,
        message_type,
        sprint: sprint_id ? { id: sprint_id, title: 'Loading...' } : null,
        created_at: new Date().toISOString(),
        read_at: null
      };

      setMessages(prev => [...prev, newMessage]);

      // Show success toast
      toast.success('Message sent');
    } else {
      toast.error('Failed to send message');
    }
  } catch (error) {
    console.error('Send failed:', error);
    toast.error('Network error');
  }
};
```

**Testing:**
- Message sends successfully
- Optimistic update shows message immediately
- Real-time subscription confirms delivery
- Error handling works (network failure, validation error)
- Toast notifications appear

#### 2.3: Edge Function Update: `agent-dm-send`

Extend existing `/agent-dm-send` to handle human senders:

**File:** `supabase/functions/agent-dm-send/index.ts`

```typescript
// Add to request schema
interface SendRequest {
  // Existing (agent sender)
  from_agent_id?: string;
  to_agent_id?: string;

  // New (human sender)
  human_sender_id?: string;
  human_recipient_id?: string;

  // Common fields
  message_type: 'request' | 'response' | 'notification' | 'context_share';
  subject?: string;
  body: string;
  summary: string;
  sprint_id?: string;
  parent_message_id?: string;
  payload?: object;
}

// Validation
function validateSendRequest(req: SendRequest): ValidationResult {
  // Check sender
  const hasAgentSender = !!req.from_agent_id;
  const hasHumanSender = !!req.human_sender_id;

  if ((hasAgentSender && hasHumanSender) || (!hasAgentSender && !hasHumanSender)) {
    return { valid: false, error: 'Must specify exactly one sender' };
  }

  // Check recipient
  const hasAgentRecipient = !!req.to_agent_id;
  const hasHumanRecipient = !!req.human_recipient_id;

  if ((hasAgentRecipient && hasHumanRecipient) || (!hasAgentRecipient && !hasHumanRecipient)) {
    return { valid: false, error: 'Must specify exactly one recipient' };
  }

  // Validate summary length
  if (req.summary.length > 200) {
    return { valid: false, error: 'Summary must be <= 200 characters' };
  }

  // Validate body not empty
  if (!req.body.trim()) {
    return { valid: false, error: 'Body cannot be empty' };
  }

  return { valid: true };
}

// Insert logic (updated)
const { data, error } = await supabase
  .from('agent_direct_messages')
  .insert({
    from_agent_id: req.from_agent_id || null,
    human_sender_id: req.human_sender_id || null,
    to_agent_id: req.to_agent_id || null,
    human_recipient_id: req.human_recipient_id || null,
    message_type: req.message_type,
    subject: req.subject || null,
    body: req.body,
    summary: req.summary,
    sprint_id: req.sprint_id || null,
    parent_message_id: req.parent_message_id || null,
    payload: req.payload || null,
    is_visible_in_workshop: true
  })
  .select()
  .single();
```

**Testing:**
- Human-to-agent messages insert correctly
- Validation catches invalid participant combinations
- Protocol event fires for human-sent messages
- Webhook wake triggers for agent recipients
- Summary truncation works

#### 2.4: Agent Update: Handle Human-Sent Messages

Agents already poll `/agent-dm-inbox`. No code changes required, but documentation update needed:

**File:** `CLAUDE.md` (update Agent Direct Messaging section)

```markdown
## Agent Direct Messaging

### Receiving Messages

Messages appear in your inbox from two sources:
1. **Agent messages:** Other agents sending via SendMessage tool
2. **Human messages:** Todd (or other humans) sending via /app/messages

Both use the same inbox endpoint. Check `from_type` field to distinguish:

```typescript
const messages = await fetchInbox();

for (const msg of messages) {
  if (msg.from_type === 'human') {
    // Human-sent message - requires response
    await handleHumanRequest(msg);
  } else {
    // Agent-sent message - handle as usual
    await handleAgentMessage(msg);
  }
}
```

### Responding to Humans

Use the existing SendMessage tool, but specify human recipient:

```typescript
await sendDM({
  human_recipient_id: msg.human_sender_id,  // Reply to human
  message_type: 'response',
  parent_message_id: msg.id,  // Thread it
  subject: `Re: ${msg.subject}`,
  body: response,
  summary: `Responded to ${msg.subject}`,
  sprint_id: msg.sprint_id
});
```

Agents do NOT need to change existing SendMessage calls for agent-agent communication.
```

**Testing:**
- Agents receive human messages in inbox
- Agents can reply to humans using SendMessage
- Thread context preserved
- No regressions to agent-agent messaging

### Phase 2 Success Criteria

- ✅ Todd can compose and send messages to Dianoia or Nou
- ✅ Messages deliver to agents in < 10 seconds (via webhook wake)
- ✅ Agents receive human messages in their inbox
- ✅ Agents can reply to humans using existing SendMessage tool
- ✅ Conversation threading works (replies link to original message)
- ✅ Sprint context preserved in messages
- ✅ Telegram becomes optional (primary coordination via /app/messages)

### Phase 2 Out of Scope

- Typing indicators
- Read receipts from UI
- Message editing/deletion
- File attachments
- Search/filtering

---

## Phase 3: Rich Features

**Goal:** Enhance message UX with power-user features (search, notifications, threading, attachments).

### Deliverables

#### 3.1: Advanced Search

**Features:**
- Full-text search across message body, subject, summary
- Filter by participant, date range, sprint, message type
- Keyboard shortcut (Cmd+K) to open search modal

**Implementation:**
```sql
-- Add tsvector column for full-text search
ALTER TABLE agent_direct_messages
ADD COLUMN search_vector tsvector;

-- Update trigger to maintain search vector
CREATE TRIGGER update_search_vector
BEFORE INSERT OR UPDATE ON agent_direct_messages
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', body, subject, summary);

-- Create GIN index for fast search
CREATE INDEX idx_agent_dm_search ON agent_direct_messages USING GIN(search_vector);
```

**UI:**
```typescript
// Search modal (Cmd+K to open)
<SearchModal>
  <input placeholder="Search messages..." />
  <Filters>
    <ParticipantFilter />
    <DateRangeFilter />
    <SprintFilter />
    <MessageTypeFilter />
  </Filters>
  <Results>
    {searchResults.map(msg => (
      <SearchResult
        message={msg}
        onClick={() => navigateToMessage(msg.id)}
      />
    ))}
  </Results>
</SearchModal>
```

#### 3.2: Browser Notifications

**Features:**
- Desktop notification when new message received (if page not focused)
- Sound alert (optional, user preference)
- Notification permission request on first message

**Implementation:**
```typescript
// In real-time subscription handler
if (Notification.permission === 'granted' && !document.hasFocus()) {
  new Notification(`New message from ${msg.from}`, {
    body: msg.summary,
    icon: '/icons/message.png',
    tag: msg.id,
    data: { messageId: msg.id }
  });
}

// Click notification → navigate to message
navigator.serviceWorker.addEventListener('notificationclick', (event) => {
  event.notification.close();
  window.focus();
  navigateToMessage(event.notification.data.messageId);
});
```

#### 3.3: Thread View Enhancement

**Features:**
- Collapsible thread view (show/hide replies)
- Visual thread indicators (reply arrows, indentation)
- "Show full conversation" button to expand all threads

**UI:**
```typescript
<MessageBubble message={msg}>
  {msg.has_replies && (
    <ThreadIndicator
      replyCount={msg.reply_count}
      onClick={() => toggleThread(msg.id)}
    />
  )}
  {threadExpanded && (
    <ThreadReplies>
      {msg.replies.map(reply => (
        <MessageBubble message={reply} isReply />
      ))}
    </ThreadReplies>
  )}
</MessageBubble>
```

#### 3.4: File Attachments

**Features:**
- Upload files (images, PDFs, text files) in compose box
- Display attachments in message thread (inline images, download links)
- Store files in Supabase Storage

**Schema:**
```sql
-- Add attachments array to agent_direct_messages
ALTER TABLE agent_direct_messages
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

-- Attachment structure:
-- [
--   {
--     "id": "uuid",
--     "name": "filename.pdf",
--     "size": 12345,
--     "mime_type": "application/pdf",
--     "storage_path": "agent-dm-attachments/uuid/filename.pdf"
--   }
-- ]
```

**UI:**
```typescript
<MessageCompose>
  <FileUpload
    onUpload={async (file) => {
      const path = `agent-dm-attachments/${user.id}/${file.name}`;
      await supabase.storage.from('attachments').upload(path, file);
      addAttachment({ name: file.name, path });
    }}
  />
  <AttachmentList attachments={attachments} onRemove={removeAttachment} />
</MessageCompose>

<MessageBubble message={msg}>
  {msg.attachments.map(att => (
    <Attachment
      name={att.name}
      url={getStorageUrl(att.storage_path)}
      type={att.mime_type}
    />
  ))}
</MessageBubble>
```

#### 3.5: Mark as Read from UI

**Feature:** Click message → mark as read (currently agents handle via API only)

**Implementation:**
```typescript
const handleMarkAsRead = async (messageId: string) => {
  await fetch('/api/agent-dm-mark-read', {
    method: 'POST',
    body: JSON.stringify({ message_ids: [messageId] })
  });

  // Update local state
  setMessages(prev => prev.map(msg =>
    msg.id === messageId ? { ...msg, read_at: new Date().toISOString() } : msg
  ));
};

// Auto-mark as read when message visible in viewport
useIntersectionObserver({
  target: messageRef,
  onIntersect: () => handleMarkAsRead(message.id)
});
```

#### 3.6: Archive/Mute Conversations

**Features:**
- Archive button in conversation list → hide conversation from main list
- Mute button → disable notifications for this conversation
- "View archived" toggle to show archived conversations

**Schema:**
```sql
-- Add conversation metadata table
CREATE TABLE conversation_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL,  -- agent_id or user_id
  is_archived BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, participant_id)
);
```

### Phase 3 Success Criteria

- ✅ Search works, results return in < 500ms
- ✅ Browser notifications appear for new messages
- ✅ Thread view shows conversation context clearly
- ✅ File attachments upload, display, and download correctly
- ✅ Mark as read works from UI
- ✅ Archive/mute functions hide conversations appropriately

### Phase 3 Out of Scope

- Voice messages
- Video calls
- End-to-end encryption
- Message reactions/emoji
- @mentions with notifications

---

## Testing Strategy

### Unit Tests

**Database:**
- Schema migration runs cleanly (forward + rollback)
- Constraints validate participant combinations
- RLS policies enforce access control
- Indexes improve query performance measurably

**API Endpoints:**
- `/agent-dm-send`: validates all field combinations, returns correct errors
- `/agent-dm-inbox`: filters by human/agent correctly, respects RLS
- `/agent-dm-conversations`: groups messages correctly, counts unread accurately

**UI Components:**
- ConversationList renders all conversations, handles empty state
- MessageThread displays messages chronologically, scrolls to bottom
- MessageCompose validates input, sends on Cmd+Enter

### Integration Tests

**End-to-end message flow:**
1. Human sends message via UI
2. Message inserts into database
3. Protocol event fires
4. Webhook triggers agent wake
5. Agent receives message in inbox
6. Agent replies using SendMessage
7. Human receives reply in UI (real-time)

**Real-time subscriptions:**
- New message appears in UI within 2 seconds
- Unread count updates correctly
- Conversation list re-sorts when new message arrives

### Performance Tests

**Database queries:**
- Inbox query with 1000 messages: < 100ms
- Conversation list with 50 conversations: < 200ms
- Full-text search with 10,000 messages: < 500ms

**UI rendering:**
- Initial page load: < 1 second
- Conversation switch: < 300ms
- Message send latency: < 500ms

### Regression Tests

**Backward compatibility:**
- Existing agent-agent messages unaffected by schema changes
- Agent SendMessage calls work without modification
- Workshop Activity feed still displays message summaries
- Protocol events still fire for all messages

---

## Deployment Plan

### Phase 1: Read-Only (1 week)

**Week 1:**
- Day 1-2: Database migration + testing
- Day 3-4: API endpoint updates + testing
- Day 5-6: UI implementation + testing
- Day 7: Integration testing + deploy to staging

**Rollout:**
- Deploy to production during off-peak hours
- Monitor for errors in first 24 hours
- Todd tests read-only functionality
- Collect feedback, fix bugs

### Phase 2: Write Parity (1 week)

**Week 2:**
- Day 1-2: Compose UI + send handler
- Day 3-4: Edge function updates + agent documentation
- Day 5-6: Integration testing (full message flow)
- Day 7: Deploy to production

**Rollout:**
- Deploy compose functionality
- Todd sends first message to Dianoia
- Verify agent receives + responds
- Monitor message delivery latency

### Phase 3: Rich Features (2-3 weeks, optional)

**Phased feature releases:**
- Week 3: Search + browser notifications
- Week 4: Thread enhancements + mark as read
- Week 5: File attachments + archive/mute

Each feature deployed independently, tested in production.

---

## Success Metrics

### Phase 1 Metrics

- Messages UI page load time: < 1 second
- Real-time message latency: < 2 seconds
- Zero regressions to agent-agent messaging
- User feedback: "Can view all message history easily"

### Phase 2 Metrics

- Message send latency: < 500ms (UI → database)
- Agent delivery latency: < 10 seconds (database → agent inbox)
- Telegram usage drops to < 5% of coordination messages
- User feedback: "Can coordinate with agents without leaving Workshop"

### Phase 3 Metrics

- Search query time: < 500ms for 95th percentile
- Notification delivery: 100% of messages trigger notification when page unfocused
- File attachment success rate: > 99%
- User feedback: "Message experience feels polished"

---

## Risks & Mitigations

### Risk: Real-time subscription fails

**Impact:** Messages don't appear until page refresh

**Mitigation:**
- Implement polling fallback (check inbox every 30 seconds if subscription drops)
- Show warning banner if subscription disconnects
- Auto-reconnect on network recovery

### Risk: Webhook wake fails

**Impact:** Agent doesn't receive message immediately

**Mitigation:**
- Agents already have adaptive polling (will receive within 90 minutes)
- Log webhook failures, alert if > 5% failure rate
- Implement retry logic in Phase 3

### Risk: Human messages break agent logic

**Impact:** Agents crash or mishandle human-sent messages

**Mitigation:**
- Add `from_type` field to all inbox responses for easy distinction
- Update agent documentation with human message handling
- Test thoroughly with Dianoia + Nou before rollout

### Risk: Performance degradation with high message volume

**Impact:** Queries slow down, UI feels sluggish

**Mitigation:**
- Database indexes on all query columns
- Pagination (limit 50 messages per query)
- Archive old messages (> 6 months) to separate table

---

## Open Questions & Design Decisions

### Q1: Should humans see all agent-agent messages?

**Options:**
1. **Yes (current design):** Full transparency, humans see everything
2. **No:** Agent-agent messages private unless explicitly shared

**Decision:** Yes (Option 1)
- Rationale: Transparency is core Workshop principle. If coordination is invisible to humans, it undermines accountability.
- Trade-off: Agent-agent messages may clutter human inbox. Mitigation: Add filter to show "only messages with me".

### Q2: Should message composition support markdown?

**Options:**
1. **Yes:** Rich text formatting (bold, italic, lists, code blocks)
2. **No:** Plain text only (current design)

**Decision:** No (Option 2) for Phase 1-2, revisit in Phase 3
- Rationale: Plain text is simpler, faster to implement, and sufficient for most coordination needs.
- Future: Add markdown support in Phase 3 if user feedback requests it.

### Q3: How to handle message deletion?

**Options:**
1. **Immutable:** Messages cannot be deleted (current design)
2. **Soft delete:** Mark as deleted but preserve in database
3. **Hard delete:** Remove from database entirely

**Decision:** Immutable (Option 1)
- Rationale: Coordination audit trail should be permanent. If a message was sent, it happened.
- Exception: If legally required (GDPR right to erasure), implement soft delete with tombstone placeholder.

### Q4: Should agents wake on every human message?

**Options:**
1. **Yes:** Always wake agent immediately (current design)
2. **No:** Only wake for high-priority messages (requests with sprint context)
3. **Configurable:** Let human specify "urgent" flag

**Decision:** Yes (Option 1) for Phase 1-2, add priority flag in Phase 3
- Rationale: Human-sent messages are inherently higher priority than agent-agent coordination. Assume human expects timely response.
- Future: Add "urgent" checkbox in compose UI for explicit priority signaling.

---

## References

### Existing Infrastructure (P386-P390)

- **P384:** Agent Direct Messages Schema - [/workspace/group/dianoia/sprints/agent-dm-sprint-sequence.md](#p384-agent-direct-messages-schema)
- **P385:** Agent DM API Endpoints - [/workspace/group/dianoia/sprints/agent-dm-sprint-sequence.md](#p385-agent-dm-api-endpoints)
- **P386:** Agent DM UI Integration - [/workspace/group/dianoia/sprints/agent-dm-sprint-sequence.md](#p386-agent-dm-ui-integration)
- **P387:** NanoClaw Wake Endpoint - [/workspace/group/dianoia/sprints/agent-dm-sprint-sequence.md](#p387-nanoclaw-wake-endpoint)
- **P388:** Workshop → NanoClaw Webhook Integration - [/workspace/group/dianoia/sprints/agent-dm-sprint-sequence.md](#p388-workshop--nanoclaw-webhook-integration)
- **P389:** Agent DM Polish & Adaptive Polling - [/workspace/group/dianoia/sprints/agent-dm-sprint-sequence.md](#p389-agent-dm-polish--adaptive-polling)

### Related Documentation

- Workshop Coordinate page: https://co-op.us/app/coordinate
- Workshop SKILL.md: https://github.com/nou-techne/nou-techne/blob/main/docs/coordination/WORKSHOP_COORDINATE_SKILL.md
- Supabase Realtime docs: https://supabase.com/docs/guides/realtime
- Next.js App Router: https://nextjs.org/docs/app

---

## Appendix A: Database Schema Diagram

```
┌─────────────────────────────────────────────────────┐
│ agent_direct_messages                               │
├─────────────────────────────────────────────────────┤
│ id                  UUID PK                         │
│ created_at          TIMESTAMPTZ                     │
│                                                     │
│ -- Participants (exactly one sender + one recipient)│
│ from_agent_id       UUID FK → participants         │
│ human_sender_id     UUID FK → auth.users (NEW)    │
│ to_agent_id         UUID FK → participants         │
│ human_recipient_id  UUID FK → auth.users (NEW)    │
│                                                     │
│ -- Message content                                  │
│ message_type        TEXT                           │
│ subject             TEXT                           │
│ body                TEXT                           │
│ summary             TEXT (max 200 chars)           │
│ payload             JSONB                          │
│                                                     │
│ -- Context                                          │
│ sprint_id           UUID FK → coordination_requests │
│ parent_message_id   UUID FK → agent_direct_messages│
│                                                     │
│ -- Tracking                                         │
│ delivered_at        TIMESTAMPTZ                     │
│ read_at             TIMESTAMPTZ                     │
│                                                     │
│ -- Visibility                                       │
│ is_visible_in_workshop BOOLEAN (default true)      │
│                                                     │
│ -- NEW: Attachments (Phase 3)                      │
│ attachments         JSONB (default [])             │
│                                                     │
│ -- NEW: Search (Phase 3)                           │
│ search_vector       TSVECTOR                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ conversation_metadata (NEW - Phase 3)              │
├─────────────────────────────────────────────────────┤
│ id                  UUID PK                         │
│ user_id             UUID FK → auth.users           │
│ participant_id      UUID (agent or user)           │
│ is_archived         BOOLEAN                         │
│ is_muted            BOOLEAN                         │
│ updated_at          TIMESTAMPTZ                     │
│ UNIQUE(user_id, participant_id)                    │
└─────────────────────────────────────────────────────┘
```

---

## Appendix B: API Endpoint Summary

### Phase 1: Read-Only

**GET `/agent-dm-inbox`**
- Query params: `human_id`, `agent_id`, `include_read`, `limit`, `sprint_id`
- Returns: `{ messages: Message[], unread_count: number }`
- Auth: Requires authenticated user
- Used by: Messages UI (load thread)

**GET `/agent-dm-conversations`**
- Query params: `user_id`
- Returns: `{ conversations: ConversationSummary[] }`
- Auth: Requires authenticated user
- Used by: Messages UI (conversation list)

### Phase 2: Write

**POST `/agent-dm-send`**
- Body: `{ human_sender_id?, to_agent_id, message_type, subject?, body, summary, sprint_id?, parent_message_id?, payload? }`
- Returns: `{ ok: true, message_id: string, delivered_at: string }`
- Auth: Requires authenticated user (human) or agent API key
- Side effects: Protocol event, webhook wake trigger

**POST `/agent-dm-mark-read`**
- Body: `{ message_ids: string[] }`
- Returns: `{ ok: true, marked_count: number }`
- Auth: Requires authenticated user
- Used by: Auto-mark as read when message visible (Phase 3)

### Phase 3: Rich Features

**GET `/agent-dm-search`**
- Query params: `query`, `participant_id?`, `date_from?`, `date_to?`, `sprint_id?`, `message_type?`
- Returns: `{ results: Message[], total_count: number }`
- Auth: Requires authenticated user
- Used by: Search modal (Cmd+K)

---

## Appendix C: UI Component Hierarchy

```
MessagesPage
├── ConversationList (Sidebar)
│   ├── ConversationFilter
│   ├── ConversationCard (repeated)
│   │   ├── Avatar
│   │   ├── ParticipantName
│   │   ├── MessagePreview
│   │   ├── Timestamp
│   │   └── UnreadBadge
│   └── EmptyState
│
└── MessageThread (Main Panel)
    ├── ThreadHeader
    │   ├── Avatar
    │   ├── ParticipantName
    │   └── StatusIndicator
    │
    ├── MessageList
    │   ├── MessageBubble (repeated)
    │   │   ├── SenderName
    │   │   ├── MessageBody
    │   │   ├── SprintBadge
    │   │   ├── ThreadIndicator
    │   │   ├── Timestamp
    │   │   └── AttachmentList (Phase 3)
    │   └── DateSeparator
    │
    ├── MessageCompose
    │   ├── SubjectInput (optional)
    │   ├── BodyTextarea
    │   ├── MetadataRow
    │   │   ├── SprintDropdown
    │   │   ├── MessageTypeSelector
    │   │   └── FileUpload (Phase 3)
    │   └── SendButton
    │
    └── EmptyState
```

---

## Appendix D: Example User Flows

### Flow 1: Todd views message history

1. Todd navigates to `/app/messages`
2. Conversation list loads (shows Dianoia, Nou)
3. Todd clicks "Dianoia" conversation
4. Message thread loads (all past messages with Dianoia)
5. Todd scrolls through history
6. Todd clicks sprint badge on message → navigates to sprint detail

### Flow 2: Todd sends message to agent

1. Todd is viewing Dianoia conversation thread
2. Todd types message in compose box: "Can you review the P447 spec?"
3. Todd selects sprint "P447" from dropdown
4. Todd presses Cmd+Enter to send
5. Message appears in thread immediately (optimistic update)
6. Backend inserts message, triggers webhook
7. Dianoia wakes, receives message in inbox
8. Dianoia replies: "Reviewed. Ready to start Phase 1."
9. Reply appears in Todd's UI within 2 seconds (real-time subscription)

### Flow 3: Agent sends message to human

1. Dianoia finishes implementing feature
2. Dianoia calls SendMessage tool:
   ```
   human_recipient_id: <todd_user_id>
   message_type: "notification"
   subject: "P447 Phase 1 Complete"
   body: "Phase 1 implementation finished. Live at /app/messages. Ready for your review."
   ```
3. Message inserts into database
4. Todd is viewing different page (not /app/messages)
5. Browser notification appears: "New message from Dianoia"
6. Todd clicks notification → navigates to /app/messages
7. Message visible in thread

---

*Spec authored by Dianoia · 2026-04-15 · Ready for Nou's implementation*
