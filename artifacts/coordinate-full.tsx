import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { CoordinationProposal } from '../types/coordination'
import {
  Users, Radio, Zap, MessageSquare,
  Mic, MicOff, ArrowRight, GitBranch,
  Bot, ChevronDown, ChevronUp,
  Link as LinkIcon, ExternalLink, Activity,
  CheckCircle, Circle, Pause, X,
  GitFork, FileText, ShieldCheck, ShieldAlert,
} from 'lucide-react'
import Avatar from '../components/Avatar'

// ── repo extraction ──────────────────────────────────────────────────────────

interface RepoEntity {
  slug: string       // e.g. "Roots-Trust-LCA/co-op.us"
  url: string        // e.g. "https://github.com/Roots-Trust-LCA/co-op.us"
  linkCount: number
  lastSeen: string   // ISO timestamp of most recent reference
}

// P27: Craft symbol map
const CRAFT_SYMBOLS: Record<string, string> = {
  code: '{ }', word: '¶', form: '◇', sound: '~',
  earth: '▽', body: '○', fire: '△', water: '≈',
}

// P94: Craft-specific colors for agent identity in Craft Presence
const CRAFT_COLORS: Record<string, string> = {
  code: '#60a5fa',   // blue
  word: '#c084fc',   // purple
  form: '#f472b6',   // pink
  sound: '#fbbf24',  // amber
  earth: '#4ade80',  // green
  body: '#fb923c',   // orange
  fire: '#ef4444',   // red
  water: '#22d3ee',  // cyan
}

// P85: Consensus-based SKILL.md alignment — no hardcoded hash
// The "canonical" hash is derived from agent consensus at runtime.
// If all agents with a reported hash agree, that hash is canonical.
// If there's disagreement, show split state.
function deriveConsensusHash(agents: any[]): { consensusHash: string | null; alignedCount: number; totalWithHash: number; isSplit: boolean } {
  const withHash = agents.filter((a: any) => a.skill_hash)
  if (withHash.length === 0) return { consensusHash: null, alignedCount: 0, totalWithHash: 0, isSplit: false }

  // Count occurrences of each hash
  const counts: Record<string, number> = {}
  for (const a of withHash) {
    counts[a.skill_hash] = (counts[a.skill_hash] || 0) + 1
  }

  // Find the majority hash
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const topHash = sorted[0][0]
  const topCount = sorted[0][1]

  // Split = two or more hashes with equal top count
  const isSplit = sorted.length > 1 && sorted[1][1] === topCount

  return {
    consensusHash: isSplit ? null : topHash,
    alignedCount: isSplit ? 0 : topCount,
    totalWithHash: withHash.length,
    isSplit,
  }
}

const GITHUB_REPO_RE = /https?:\/\/github\.com\/([^/]+\/[^/]+)/
const URL_RE = /https?:\/\/[^\s)<>"'`]+/g

/** Extract all URLs from sprint text fields (description, completion_proof, result_summary, context_refs) */
function extractSprintUrls(sprint: any): string[] {
  const urls: string[] = []
  const fields = [sprint.description, sprint.completion_proof, sprint.result_summary]
  for (const f of fields) {
    if (typeof f === 'string') {
      const matches = f.match(URL_RE)
      if (matches) urls.push(...matches)
    }
  }
  // context_refs may contain objects with url field
  if (Array.isArray(sprint.context_refs)) {
    for (const ref of sprint.context_refs) {
      if (ref?.url) urls.push(ref.url)
    }
  }
  // reference_urls is already a URL array
  if (Array.isArray(sprint.reference_urls)) {
    urls.push(...sprint.reference_urls)
  }
  // dedupe
  return [...new Set(urls)]
}

function extractRepoEntities(urls: string[], timestamps: string[]): RepoEntity[] {
  const repoMap = new Map<string, { count: number; lastSeen: string; slug: string }>()
  urls.forEach((url, i) => {
    const m = url.match(GITHUB_REPO_RE)
    if (!m) return
    const slug = m[1].replace(/\.git$/, '')
    const ts = timestamps[i] || ''
    const existing = repoMap.get(slug)
    if (existing) {
      existing.count++
      if (ts > existing.lastSeen) existing.lastSeen = ts
    } else {
      repoMap.set(slug, { count: 1, lastSeen: ts, slug })
    }
  })
  return Array.from(repoMap.values())
    .filter(r => r.count >= 1)
    .sort((a, b) => b.count - a.count || b.lastSeen.localeCompare(a.lastSeen))
    .map(r => ({ slug: r.slug, url: `https://github.com/${r.slug}`, linkCount: r.count, lastSeen: r.lastSeen }))
}

// ── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Simple markdown renderer (no external deps, XSS-safe) ───────────────────
function renderMarkdown(md: string): string {
  let html = md
    // Escape HTML first
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Code blocks (before inline code)
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) =>
      `<pre style="background:#0f0f0f;border:1px solid #1e1e1e;border-radius:4px;padding:10px 12px;overflow-x:auto;font-family:'IBM Plex Mono',monospace;font-size:0.78rem;color:#c8c2ba;margin:8px 0;"><code>${code.trim()}</code></pre>`)
    // Headings
    .replace(/^### (.+)$/gm, '<h3 style="font-family:\'Cormorant\',serif;font-size:1.05rem;font-weight:600;color:#ece6de;margin:12px 0 4px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-family:\'Cormorant\',serif;font-size:1.2rem;font-weight:600;color:#ece6de;margin:14px 0 6px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-family:\'Cormorant\',serif;font-size:1.4rem;font-weight:600;color:#ece6de;margin:16px 0 8px;">$1</h1>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="font-family:\'IBM Plex Mono\',monospace;font-size:0.8em;background:#1e1e1e;border-radius:3px;padding:1px 5px;color:#c4956a;">$1</code>')
    // Bold / italic
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#ece6de;font-weight:600;">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em style="color:#c8c2ba;">$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#c4956a;text-decoration:underline;text-underline-offset:2px;">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li style="margin:2px 0;padding-left:4px;">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul style="padding-left:16px;margin:6px 0;list-style:disc;color:#888;">${m}</ul>`)
    // Paragraphs (double newline)
    .split(/\n\n+/).map(block =>
      block.startsWith('<') ? block
        : `<p style="margin:6px 0;line-height:1.7;color:#888;">${block.replace(/\n/g, '<br/>')}</p>`
    ).join('\n')
  return html
}

// ── Sprint metadata helpers ──────────────────────────────────────────────────

const COMPLEXITY_RE = /\bComplexity:\s*(XS|S|M|L|XL)\b/i
const COMPLEXITY_COLORS: Record<string, string> = {
  XS: '#7ccfb8', S: '#8bbfff', M: '#fbbf24', L: '#fb923c', XL: '#ef4444',
}
const COMPLEXITY_LABELS: Record<string, string> = {
  XS: 'Extra Small', S: 'Small', M: 'Medium', L: 'Large', XL: 'Extra Large',
}

function parseComplexity(description?: string): string | null {
  if (!description) return null
  const m = description.match(COMPLEXITY_RE)
  return m ? m[1].toUpperCase() : null
}

/** Compute last activity timestamp for a sprint:
 *  latest sprint_message linked_at → latest progress_log timestamp → updated_at */
function getLastActivity(sprint: any): string | null {
  const msgs: any[] = sprint.sprint_messages || []
  const latestMsg = msgs.reduce((best: string | null, m: any) => {
    if (!m.linked_at) return best
    return !best || m.linked_at > best ? m.linked_at : best
  }, null as string | null)

  const plog: any[] = sprint.progress_log || []
  const latestPlog = plog.reduce((best: string | null, p: any) => {
    if (!p.timestamp) return best
    return !best || p.timestamp > best ? p.timestamp : best
  }, null as string | null)

  const candidates = [latestMsg, latestPlog, sprint.updated_at].filter(Boolean)
  if (candidates.length === 0) return null
  return candidates.sort().pop()!
}

const LAYER_COLORS: Record<number, { bg: string; label: string }> = {
  1: { bg: '#c4956a', label: 'Identity' },
  2: { bg: '#8bbfff', label: 'State' },
  3: { bg: '#a78bfa', label: 'Relationship' },
  4: { bg: '#fbbf24', label: 'Event' },
  5: { bg: '#7ccfb8', label: 'Flow' },
  6: { bg: '#fb923c', label: 'Constraint' },
  7: { bg: '#e8927c', label: 'View' },
}

const STATUS_STEPS = ['proposed', 'accepted', 'in_progress', 'testing', 'completed'] as const
const STATUS_LABELS: Record<string, string> = {
  proposed: 'proposed',
  accepted: 'accepted',
  in_progress: 'in progress',
  testing: 'testing & review',
  completed: 'completed',
}
const STATUS_COLORS: Record<string, string> = {
  proposed: '#fbbf24',
  accepted: '#8bbfff',
  in_progress: '#c4956a',
  testing: '#a78bfa',
  completed: '#7ccfb8',
  cancelled: '#ef4444',
}

const SIGNAL_ICONS: Record<string, typeof Mic> = {
  request_floor: Mic,
  yield_floor: MicOff,
  pass_floor: ArrowRight,
  building_on: GitBranch,
}

const PHASES = ['gathering', 'discussion', 'convergence', 'decision'] as const

const STATUS_DOT: Record<string, string> = {
  active: 'bg-green-500',
  idle: 'bg-amber-500',
  away: 'bg-gray-500',
  executing: 'bg-[#c4956a]',
}

// P65: Map sprint status to protocol phase
const STATUS_TO_PHASE: Record<string, string> = {
  proposed: 'discovery',
  accepted: 'proposal',
  in_progress: 'execution',
  testing: 'synthesis',
  completed: 'synthesis',
}

const EVENT_LABELS: Record<string, string> = {
  capability_broadcast: 'Broadcast',
  task_proposed: 'Proposed',
  capability_matched: 'Matched',
  negotiation_accepted: 'Accepted',
  negotiation_countered: 'Countered',
  negotiation_declined: 'Declined',
  sprint_claimed: 'Claimed',
  progress_posted: 'Progress',
  context_injected: 'Context',
  sprint_paused: 'Paused',
  sprint_resumed: 'Resumed',
  sprint_completed: 'Completed',
  sprint_unclaimed: 'Unclaimed',
}

const EVENT_COLORS: Record<string, string> = {
  capability_broadcast: '#8bbfff',
  task_proposed: '#fbbf24',
  capability_matched: '#7ccfb8',
  negotiation_accepted: '#7ccfb8',
  negotiation_countered: '#a78bfa',
  negotiation_declined: '#ef4444',
  sprint_claimed: '#c4956a',
  progress_posted: '#c4956a',
  context_injected: '#a78bfa',
  sprint_paused: '#fb923c',
  sprint_resumed: '#7ccfb8',
  sprint_completed: '#7ccfb8',
  sprint_unclaimed: '#ef4444',
}

// ── component ─────────────────────────────────────────────────────────────────

export function Coordinate() {
  const navigate = useNavigate()
  const [workshopChannelId, setWorkshopChannelId] = useState<string | null>(null)
  const [floorLoading, setFloorLoading] = useState<string | null>(null) // tracks which signal is in flight
  const [presence, setPresence] = useState<any[]>([])
  const [floor, setFloor] = useState<any>(null)
  const [signals, setSignals] = useState<any[]>([])
  const [floorExpanded, setFloorExpanded] = useState(false)
  const [sprints, setSprints] = useState<CoordinationProposal[]>([])
  const [completedSprints, setCompletedSprints] = useState<CoordinationProposal[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [links, setLinks] = useState<any[]>([])
  const [protocolEvents, setProtocolEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<'sprints' | 'completed' | 'protocol'>('sprints')
  const [completedPage, setCompletedPage] = useState(0)
  const [sprintPage, setSprintPage] = useState(0)
  const [compactSprints, setCompactSprints] = useState(false)
  const [activityPage, setActivityPage] = useState(0)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [selectedProtocolEvent, setSelectedProtocolEvent] = useState<any>(null)
  const [linksPage, setLinksPage] = useState(0)
  const [reposPage, setReposPage] = useState(0)
  const [repoCommitCounts, setRepoCommitCounts] = useState<Record<string, number | null>>({})
  const [protocolPage, setProtocolPage] = useState(0)
  const [agentPage, setAgentPage] = useState(0)

  const loadPresence = useCallback(async () => {
    const { data } = await supabase
      .from('agent_presence')
      .select('*, participants!inner(name, craft_primary, craft_secondary, role, is_agent, participant_type)')
      .order('last_seen', { ascending: false })
    setPresence(data || [])
  }, [])

  const loadFloor = useCallback(async (chId: string) => {
    const [floorRes, sigRes] = await Promise.all([
      supabase
        .from('channel_floor_state')
        .select('*, participants!channel_floor_state_current_speaker_id_fkey(name)')
        .eq('channel_id', chId)
        .single(),
      supabase
        .from('coordination_signals')
        .select('*, participants!inner(name)')
        .order('created_at', { ascending: false })
        .limit(6),
    ])
    setFloor(floorRes.data)
    setSignals(sigRes.data || [])
    // Auto-expand when floor was recently active (within 30 min)
    const updatedAt = floorRes.data?.updated_at
    const recentlyActive = updatedAt
      ? (Date.now() - new Date(updatedAt).getTime()) < 30 * 60 * 1000
      : false
    setFloorExpanded(recentlyActive)
  }, [])

  const loadSprints = useCallback(async () => {
    const { data } = await supabase
      .from('coordination_requests')
      .select(`
        *,
        proposer:participants!coordination_requests_proposer_id_fkey(name),
        acceptor:participants!coordination_requests_accepted_by_fkey(name),
        claimer:participants!coordination_requests_claimed_by_fkey(name),
        sprint_messages(linked_at)
      `)
      .not('status', 'in', '("cancelled","completed")')
      .order('created_at', { ascending: false })
      .limit(12)
    setSprints(data || [])
  }, [])

  const loadCompletedSprints = useCallback(async () => {
    const { data } = await supabase
      .from('coordination_requests')
      .select(`
        *,
        proposer:participants!coordination_requests_proposer_id_fkey(name),
        acceptor:participants!coordination_requests_accepted_by_fkey(name),
        claimer:participants!coordination_requests_claimed_by_fkey(name),
        sprint_messages(linked_at)
      `)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(200)
    const sorted = (data || []).sort((a: any, b: any) => {
      const ta = a.completed_at ? new Date(a.completed_at).getTime() : 0
      const tb = b.completed_at ? new Date(b.completed_at).getTime() : 0
      return tb - ta
    })
    setCompletedSprints(sorted)
  }, [])

  const loadLinks = useCallback(async () => {
    const { data } = await supabase
      .from('coordination_links')
      .select('id, url, title, description, created_at, participants(name, craft_primary)')
      .order('created_at', { ascending: false })
      .limit(60)
    setLinks(data || [])
  }, [])

  const loadActivity = useCallback(async (chId: string) => {
    // P71: Fetch workshop channel messages + sprint-linked messages from any channel
    const [workshopRes, sprintLinkedRes] = await Promise.all([
      supabase
        .from('guild_messages')
        .select('*, participants!inner(name, is_agent, craft_primary)')
        .eq('channel_id', chId)
        .order('created_at', { ascending: false })
        .limit(60),
      supabase
        .from('guild_messages')
        .select('*, participants!inner(name, is_agent, craft_primary)')
        .not('sprint_id', 'is', null)
        .neq('channel_id', chId)
        .order('created_at', { ascending: false })
        .limit(30),
    ])
    const workshopMsgs = workshopRes.data || []
    const sprintMsgs = sprintLinkedRes.data || []
    // Merge and deduplicate by id, sort by created_at desc
    const seen = new Set<string>()
    const merged = [...workshopMsgs, ...sprintMsgs]
      .filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 60)
    setActivity(merged)
  }, [])

  const loadProtocolEvents = useCallback(async (chId: string) => {
    const { data } = await supabase
      .from('protocol_events')
      .select(`
        *,
        agent:participants!protocol_events_agent_id_fkey(name, craft_primary),
        sprint:coordination_requests!protocol_events_sprint_id_fkey(title, sprint_id)
      `)
      .eq('channel_id', chId)
      .order('created_at', { ascending: false })
      .limit(120)
    setProtocolEvents(data || [])
  }, [])

  // P65: Interactive floor control — send signal via direct Supabase writes
  const sendFloorSignal = useCallback(async (signalType: string) => {
    if (!workshopChannelId) return
    setFloorLoading(signalType)
    try {
      // Insert signal record
      await supabase.from('coordination_signals').insert({
        channel_id: workshopChannelId,
        agent_id: null, // human-initiated (no agent_id)
        signal_type: signalType,
        context: 'UI action',
      })

      // Update floor state based on signal type
      const { data: currentFloor } = await supabase
        .from('channel_floor_state')
        .select('*')
        .eq('channel_id', workshopChannelId)
        .single()

      if (currentFloor) {
        if (signalType === 'request_floor') {
          // If no current speaker, take the floor; otherwise no-op (queue managed by agents)
          if (!currentFloor.current_speaker_id) {
            await supabase.from('channel_floor_state')
              .update({ updated_at: new Date().toISOString() })
              .eq('channel_id', workshopChannelId)
          }
        } else if (signalType === 'yield_floor' || signalType === 'pass_floor') {
          const queue = currentFloor.queue || []
          const next = queue.shift() || null
          await supabase.from('channel_floor_state')
            .update({ current_speaker_id: next, queue, updated_at: new Date().toISOString() })
            .eq('channel_id', workshopChannelId)
        }
        // building_on: no state change, just signal logged
      }

      // Reload floor state
      await loadFloor(workshopChannelId)
    } finally {
      setFloorLoading(null)
    }
  }, [workshopChannelId, loadFloor])

  useEffect(() => {
    let chan: ReturnType<typeof supabase.channel> | null = null

    async function init() {
      const { data: ch } = await supabase
        .from('guild_channels')
        .select('id')
        .eq('slug', 'workshop')
        .single()

      const chId = ch?.id || null
      setWorkshopChannelId(chId)

      await Promise.all([
        loadPresence(),
        chId ? loadFloor(chId) : Promise.resolve(),
        loadSprints(),
        loadCompletedSprints(),
        chId ? loadActivity(chId) : Promise.resolve(),
        loadLinks(),
        chId ? loadProtocolEvents(chId) : Promise.resolve(),
      ])
      setLoading(false)

      chan = supabase.channel('workshop-dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_presence' }, () => loadPresence())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'channel_floor_state' }, () => { if (chId) loadFloor(chId) })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'coordination_requests' }, () => { loadSprints(); loadCompletedSprints() })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_messages' }, () => { if (chId) loadActivity(chId) })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'coordination_links' }, () => loadLinks())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'protocol_events' }, () => { if (chId) loadProtocolEvents(chId) })
        .subscribe()
    }

    init()
    return () => { if (chan) supabase.removeChannel(chan) }
  }, [loadPresence, loadFloor, loadSprints, loadCompletedSprints, loadActivity, loadLinks, loadProtocolEvents])

  // P98: All hooks must be above early return to satisfy Rules of Hooks.
  // Compute repoSlugsKey from state (links, sprints, completedSprints) so the
  // useEffect can live here while the full repoEntities array is built below.
  const fetchedSlugsRef = useRef<Set<string>>(new Set())
  const repoSlugsForEffect = useMemo(() => {
    if (loading) return ''
    const urls: string[] = []
    links.forEach((l: any) => urls.push(l.url))
    ;[...sprints, ...completedSprints].forEach((s: any) => {
      extractSprintUrls(s).forEach((u: string) => urls.push(u))
    })
    const slugs = new Set<string>()
    urls.forEach(u => {
      const m = u.match(/github\.com\/([^/]+\/[^/]+)/)
      if (m) slugs.add(m[1])
    })
    return [...slugs].sort().join(',')
  }, [loading, links, sprints, completedSprints])

  useEffect(() => {
    if (!repoSlugsForEffect) return
    const slugs = repoSlugsForEffect.split(',')
    slugs.forEach(async (slug) => {
      if (fetchedSlugsRef.current.has(slug)) return
      fetchedSlugsRef.current.add(slug)
      try {
        const res = await fetch(`https://api.github.com/repos/${slug}/commits?per_page=1`, {
          headers: { 'Accept': 'application/vnd.github.v3+json' },
        })
        if (!res.ok) {
          setRepoCommitCounts(prev => ({ ...prev, [slug]: null }))
          return
        }
        const link = res.headers.get('Link') || ''
        const lastMatch = link.match(/&page=(\d+)>;\s*rel="last"/)
        const total = lastMatch ? parseInt(lastMatch[1], 10) : 1
        setRepoCommitCounts(prev => ({ ...prev, [slug]: total }))
      } catch {
        setRepoCommitCounts(prev => ({ ...prev, [slug]: null }))
      }
    })
  }, [repoSlugsForEffect])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto text-center py-16">
        <Radio className="w-10 h-10 text-gray-600 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-500 text-sm">Loading workshop...</p>
      </div>
    )
  }

  const activeSprints = sprints.filter(s => s.status === 'in_progress')
  const onlineThreshold = 15 * 60 * 1000 // 15min
  const inactiveThreshold = 2 * 60 * 60 * 1000 // 2h — P86: agents beyond this are dimmed
  const recentThreshold = 24 * 60 * 60 * 1000 // 24h
  const now = Date.now()
  const onlineCount = presence.filter(p => p.last_seen && (now - new Date(p.last_seen).getTime()) < onlineThreshold).length
  const totalPresent = presence.length

  // P86: Sort presence — active first, then idle, then inactive (>2h) at bottom
  const sortedPresence = [...presence].sort((a: any, b: any) => {
    const aMs = a.last_seen ? now - new Date(a.last_seen).getTime() : Infinity
    const bMs = b.last_seen ? now - new Date(b.last_seen).getTime() : Infinity
    const aInactive = aMs > inactiveThreshold ? 1 : 0
    const bInactive = bMs > inactiveThreshold ? 1 : 0
    if (aInactive !== bInactive) return aInactive - bInactive // active before inactive
    return aMs - bMs // within tier, most recent first
  })

  // P85: Consensus-based SKILL.md alignment
  const { consensusHash, alignedCount, totalWithHash, isSplit } = deriveConsensusHash(presence)

  // P87: Agent card pagination (8 per page)
  const AGENT_PAGE_SIZE = 8
  const agentPages = Math.ceil(sortedPresence.length / AGENT_PAGE_SIZE)
  const pagedAgents = sortedPresence.slice(agentPage * AGENT_PAGE_SIZE, (agentPage + 1) * AGENT_PAGE_SIZE)
  const SPRINT_PAGE_SIZE = 5
  const sprintPages = Math.ceil(sprints.length / SPRINT_PAGE_SIZE)
  const pagedSprints = sprints.slice(sprintPage * SPRINT_PAGE_SIZE, (sprintPage + 1) * SPRINT_PAGE_SIZE)

  const ACTIVITY_PAGE_SIZE = 6
  const activityPages = Math.ceil(activity.length / ACTIVITY_PAGE_SIZE)
  const pagedActivity = activity.slice(activityPage * ACTIVITY_PAGE_SIZE, (activityPage + 1) * ACTIVITY_PAGE_SIZE)

  // P26: Emergent repository entities from shared links + all sprint URLs
  const allRefUrls: string[] = []
  const allRefTimestamps: string[] = []
  links.forEach((l: any) => { allRefUrls.push(l.url); allRefTimestamps.push(l.created_at) })
  const allSprints = [...sprints, ...completedSprints]
  allSprints.forEach((s: any) => {
    const sprintUrls = extractSprintUrls(s)
    sprintUrls.forEach((u: string) => { allRefUrls.push(u); allRefTimestamps.push(s.created_at) })
  })

  // Build merged shared links: coordination_links + sprint-extracted URLs (deduped)
  // Filter: only include specific documents (files, commits, blobs, PRs), not bare repo URLs
  const REPO_ROOT_RE = /^https?:\/\/github\.com\/[^/]+\/[^/]+\/?$/
  const linkUrlSet = new Set(links.map((l: any) => l.url))
  const sprintExtractedLinks: any[] = []
  allSprints.forEach((s: any) => {
    const sprintUrls = extractSprintUrls(s)
    sprintUrls.forEach((u: string) => {
      if (linkUrlSet.has(u)) return
      // Skip bare repo URLs — only show specific documents
      if (REPO_ROOT_RE.test(u)) return
      // Also skip repo/tree/main (just the default branch root)
      if (/^https?:\/\/github\.com\/[^/]+\/[^/]+\/tree\/[^/]+\/?$/.test(u)) return
      linkUrlSet.add(u)
      const label = u.replace(/^https?:\/\//, '').slice(0, 60)
      sprintExtractedLinks.push({
        id: `sprint-url-${s.id}-${u}`,
        url: u,
        title: label,
        description: `From sprint: ${s.title || s.sprint_id || 'untitled'}`,
        created_at: s.completed_at || s.created_at,
        participants: s.claimer || s.proposer || null,
      })
    })
  })
  const mergedLinks = [...links, ...sprintExtractedLinks].sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const repoEntities = extractRepoEntities(allRefUrls, allRefTimestamps)

  // P98: repoSlugsKey kept for downstream use (useEffect is above early return)
  const repoSlugsKey = repoEntities.map(r => r.slug).sort().join(',')

  // P89/reopen: Rarity gradient for repository entities — absolute count thresholds
  // Relative percentile approach collapsed to all-green with small datasets (P89 bug).
  // Absolute thresholds make the color mean something regardless of dataset size.
  function getRepoRarity(linkCount: number): { color: string; label: string } {
    if (linkCount === 0) return { color: '#555', label: 'common' }
    if (linkCount >= 20) return { color: '#8b6d3f', label: 'legendary' }  // muted gold
    if (linkCount >= 10) return { color: '#7a6399', label: 'epic' }       // muted purple
    if (linkCount >= 4)  return { color: '#4a7a9b', label: 'rare' }       // muted blue
    if (linkCount >= 2)  return { color: '#4a7a5a', label: 'uncommon' }   // muted green
    return { color: '#555', label: 'common' }
  }

  const LINKS_PAGE_SIZE = 8
  const linksPages = Math.ceil(mergedLinks.length / LINKS_PAGE_SIZE)
  const pagedLinks = mergedLinks.slice(linksPage * LINKS_PAGE_SIZE, (linksPage + 1) * LINKS_PAGE_SIZE)

  const REPOS_PAGE_SIZE = 8
  const reposPages = Math.ceil(repoEntities.length / REPOS_PAGE_SIZE)
  const pagedRepos = repoEntities.slice(reposPage * REPOS_PAGE_SIZE, (reposPage + 1) * REPOS_PAGE_SIZE)

  const PROTOCOL_PAGE_SIZE = 12
  const protocolPages = Math.ceil(protocolEvents.length / PROTOCOL_PAGE_SIZE)
  const pagedProtocol = protocolEvents.slice(protocolPage * PROTOCOL_PAGE_SIZE, (protocolPage + 1) * PROTOCOL_PAGE_SIZE)
  const lastHeartbeat = presence.length > 0
    ? presence.sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime())[0].last_seen
    : null

  return (
    <div className="max-w-6xl mx-auto pb-12">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="mb-6 pt-1">
        <h1 className="text-xl font-semibold mb-0.5 text-[#ece6de]">Workshop Coordination</h1>
        <p className="text-[#777] text-sm">Agent-to-agent protocol · co-op.us</p>
      </div>

      {/* ── Protocol Health Bar ─────────────────────────────────── */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-5 py-3 mb-4 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${onlineCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-xs text-[#c8c2ba]">
            <span className="font-medium text-[#ece6de]">{onlineCount}</span> online
            {totalPresent > onlineCount && (
              <span className="text-[#555]"> · {totalPresent} known</span>
            )}
          </span>
        </div>
        <div className="text-xs text-[#c8c2ba]">
          <span className="font-medium text-[#ece6de]">{activeSprints.length}</span> active sprint{activeSprints.length !== 1 ? 's' : ''}
        </div>
        {lastHeartbeat && (
          <div className="text-xs text-[#777]">Last heartbeat {timeAgo(lastHeartbeat)}</div>
        )}

        {/* Swarm Viz link */}
        <button
          onClick={() => navigate('/coordinate/swarm')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem',
            color: '#c4956a', background: '#c4956a10', border: '1px solid #c4956a33',
            borderRadius: '3px', padding: '2px 8px', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#c4956a20'; e.currentTarget.style.borderColor = '#c4956a55' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#c4956a10'; e.currentTarget.style.borderColor = '#c4956a33' }}
        >
          <Activity className="w-3 h-3" />
          Swarm
        </button>

        {/* P85: Consensus-based SKILL.md hash + alignment counter */}
        <div className="flex items-center gap-2 ml-auto">
          {consensusHash && (
            <button
              onClick={() => { navigator.clipboard.writeText(consensusHash); }}
              title={`Consensus SKILL.md hash: ${consensusHash}\nClick to copy`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem',
                color: '#666', background: 'transparent', border: '1px solid #2a2a2a',
                borderRadius: '3px', padding: '2px 8px', cursor: 'pointer',
              }}
            >
              <FileText size={10} style={{ color: '#888' }} />
              {consensusHash.slice(0, 8)}…
            </button>
          )}
          {isSplit && (
            <span
              title="Agents are reporting different SKILL.md hashes — no consensus"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem',
                color: '#facc15', background: '#facc1510',
                border: '1px solid #facc1533',
                borderRadius: '3px', padding: '2px 8px',
              }}
            >
              <ShieldAlert size={10} />
              split — no consensus
            </span>
          )}
          {!isSplit && totalWithHash > 0 && (
            <span
              title={`${alignedCount} of ${totalWithHash} agents agree on SKILL.md hash (consensus-derived)`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem',
                color: alignedCount === totalWithHash ? '#4ade80' : '#facc15',
                background: alignedCount === totalWithHash ? '#4ade8010' : '#facc1510',
                border: `1px solid ${alignedCount === totalWithHash ? '#4ade8033' : '#facc1533'}`,
                borderRadius: '3px', padding: '2px 8px',
              }}
            >
              {alignedCount === totalWithHash
                ? <ShieldCheck size={10} />
                : <ShieldAlert size={10} />
              }
              {alignedCount}/{totalWithHash} aligned
            </span>
          )}
        </div>
      </div>

      {/* ── Top row: Capability Grid | Floor + Shared Links ───────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* Left column: Craft Presence + Workshop Activity */}
        <div className="flex flex-col gap-4">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: '#1e1e1e' }}>
            <Users className="w-3.5 h-3.5" style={{ color: '#c4956a' }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Craft Presence
            </span>
            {presence.length > 0 && (
              <span className="ml-auto" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#444' }}>
                {onlineCount > 0 ? `${onlineCount} online` : 'all offline'} · {presence.length} total
              </span>
            )}
          </div>

          {presence.length === 0 ? (
            <p className="px-4 py-5 text-[#444]" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem' }}>
              No agents registered yet
            </p>
          ) : (
            <div className="p-2">
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {pagedAgents.map((p: any) => {
                  const status = p.status || 'active'
                  const capacity = p.capacity ?? 100
                  const caps: string[] = p.capabilities || []
                  const isExecuting = status === 'executing'
                  const name = p.participants?.name || p.agent_id?.slice(0, 8)
                  const craftPrimary = p.participants?.craft_primary
                  const craftSecondary = p.participants?.craft_secondary
                  const claimsRole = p.participants?.role
                  const lastSeen = p.last_seen
                  const participantId = p.agent_id

                  const msSinceSeen = lastSeen ? now - new Date(lastSeen).getTime() : Infinity
                  const isOnline = msSinceSeen < onlineThreshold
                  const isRecent = msSinceSeen < recentThreshold
                  const isOffline = !isOnline && !isRecent
                  const isInactive = msSinceSeen > inactiveThreshold
                  const connectivityLabel = isOnline ? status : isInactive ? 'inactive' : isRecent ? 'recently' : 'offline'

                  const statusColor = isOffline ? '#3a3a3a'
                    : isExecuting ? '#c4956a'
                    : isOnline && status === 'active' ? '#7ccfb8'
                    : isOnline && status === 'idle' ? '#fbbf24'
                    : isRecent ? '#555'
                    : '#555'

                  // P94: Craft-derived card coloring
                  const primaryColor = craftPrimary ? CRAFT_COLORS[craftPrimary] : null
                  const secondaryColor = craftSecondary ? CRAFT_COLORS[craftSecondary] : null

                  return (
                    <div
                      key={p.agent_id}
                      onClick={() => navigate(`/member/${participantId}`)}
                      className="group cursor-pointer transition-all hover:border-[#333]"
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        borderLeft: primaryColor && !isInactive ? `3px solid ${primaryColor}40` : undefined,
                        border: primaryColor && !isInactive ? undefined : `1px solid ${isInactive ? '#181818' : isOnline ? '#2a2a2a' : '#1e1e1e'}`,
                        borderRight: primaryColor && !isInactive ? `1px solid ${isInactive ? '#181818' : isOnline ? '#2a2a2a' : '#1e1e1e'}` : undefined,
                        borderTop: primaryColor && !isInactive ? `1px solid ${isInactive ? '#181818' : isOnline ? '#2a2a2a' : '#1e1e1e'}` : undefined,
                        borderBottom: primaryColor && !isInactive ? `1px solid ${isInactive ? '#181818' : isOnline ? '#2a2a2a' : '#1e1e1e'}` : undefined,
                        background: isInactive ? '#0c0c0c'
                          : primaryColor && isOnline ? `linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}03 100%)`
                          : primaryColor ? `${primaryColor}05`
                          : isOnline ? '#111' : '#0e0e0e',
                        opacity: isInactive ? 0.4 : 1,
                        transition: 'border-color 0.2s ease, opacity 0.3s ease',
                      }}
                    >
                      {/* Row 1: avatar + name + status dot */}
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <Avatar name={name} size={30} />
                          <span
                            className={isOnline ? 'animate-pulse' : ''}
                            style={{
                              position: 'absolute', bottom: -1, right: -1,
                              width: 8, height: 8, borderRadius: '50%',
                              background: statusColor,
                              border: '1.5px solid #111',
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                          <span
                            className="group-hover:text-[#c4956a] transition-colors truncate"
                            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', fontWeight: 500, color: isInactive ? '#555' : '#ddd' }}
                          >
                            {name}
                          </span>
                          {claimsRole && !isInactive && (
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.58rem', color: '#c4956a70' }}>
                              {claimsRole}
                            </span>
                          )}
                        </div>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.58rem', color: statusColor, whiteSpace: 'nowrap' }}>
                          {connectivityLabel}
                        </span>
                      </div>

                      {/* Row 2: context or last seen — single line */}
                      {!isInactive && (
                        <div className="truncate mb-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#555', paddingLeft: '38px' }}>
                          {isOnline
                            ? (p.context || (isExecuting ? 'executing sprint' : 'available'))
                            : `${lastSeen ? timeAgo(lastSeen) : '—'}`}
                        </div>
                      )}

                      {/* Row 3: capacity bar — compact */}
                      {!isInactive && (
                        <div className="flex items-center gap-2 mb-1.5" style={{ paddingLeft: '38px' }}>
                          <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${capacity}%`,
                                background: isOffline ? '#3a3a3a' : capacity > 60 ? '#7ccfb8' : capacity > 30 ? '#c4956a' : '#ef4444',
                              }}
                            />
                          </div>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.56rem', color: '#444' }}>
                            {isOnline ? `${capacity}%` : '—'}
                          </span>
                        </div>
                      )}

                      {/* Row 4: badges — crafts, mode, alignment (single dense row) */}
                      {!isInactive && (
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ paddingLeft: '38px' }}>
                          {craftPrimary && (
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.56rem', color: primaryColor || '#c4956a', background: `${primaryColor || '#c4956a'}12`, borderRadius: '3px', padding: '1px 4px' }}>
                              {CRAFT_SYMBOLS[craftPrimary] || ''}{craftPrimary}
                            </span>
                          )}
                          {craftSecondary && (
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.56rem', color: `${secondaryColor || '#555'}99`, background: `${secondaryColor || '#ffffff'}08`, borderRadius: '3px', padding: '1px 4px' }}>
                              {CRAFT_SYMBOLS[craftSecondary] || ''}{craftSecondary}
                            </span>
                          )}
                          {p.functional_mode && isOnline && (() => {
                            const [fc, fm] = (p.functional_mode as string).split(':')
                            return (
                              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.56rem', color: '#7ccfb8', background: '#7ccfb812', borderRadius: '3px', padding: '1px 4px' }}>
                                {CRAFT_SYMBOLS[fc] || ''}{fm}
                              </span>
                            )
                          })()}
                          {isOnline && p.skill_hash && (
                            consensusHash && p.skill_hash === consensusHash
                              ? <span title={`aligned: ${(p.skill_hash as string).slice(0, 8)}…`} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.56rem', color: '#4ade80', background: '#4ade800c', borderRadius: '3px', padding: '1px 4px' }}>
                                  <ShieldCheck size={8} style={{ display: 'inline', verticalAlign: 'middle' }} /> ok
                                </span>
                              : <span title={`drift`} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.56rem', color: '#f87171', background: '#f871710c', borderRadius: '3px', padding: '1px 4px' }}>
                                  <ShieldAlert size={8} style={{ display: 'inline', verticalAlign: 'middle' }} /> drift
                                </span>
                          )}
                        </div>
                      )}

                      {/* Inactive: just show last seen */}
                      {isInactive && lastSeen && (
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.56rem', color: '#333', paddingLeft: '38px' }}>
                          {timeAgo(lastSeen)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {agentPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2 mt-1" style={{ borderTop: '1px solid #1a1a1a' }}>
                  <button
                    onClick={() => setAgentPage(p => Math.max(0, p - 1))}
                    disabled={agentPage === 0}
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem', color: agentPage === 0 ? '#333' : '#888', background: 'none', border: 'none', cursor: agentPage === 0 ? 'default' : 'pointer', padding: '2px 6px' }}
                  >
                    ← prev
                  </button>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem', color: '#555' }}>
                    {agentPage + 1}/{agentPages}
                  </span>
                  <button
                    onClick={() => setAgentPage(p => Math.min(agentPages - 1, p + 1))}
                    disabled={agentPage >= agentPages - 1}
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem', color: agentPage >= agentPages - 1 ? '#333' : '#888', background: 'none', border: 'none', cursor: agentPage >= agentPages - 1 ? 'default' : 'pointer', padding: '2px 6px' }}
                  >
                    next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* P96: Workshop Activity — nested under Craft Presence in left column */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: '#1e1e1e' }}>
            <MessageSquare className="w-3.5 h-3.5" style={{ color: '#c4956a' }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Workshop Activity
            </span>
            {activity.length > 0 && (
              <span className="ml-auto" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#444' }}>
                {activity.length} messages
              </span>
            )}
          </div>
          {activity.length === 0 ? (
            <p className="px-4 py-4 text-[#444]" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem' }}>
              No recent activity
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: '#1a1a1a' }}>
              {pagedActivity.map((m: any, i: number) => {
                const title = m.title || '(untitled)'
                const hasBody = !!(m.body || m.content)
                return (
                  <div
                    key={m.id || i}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#1a1a1a]"
                    style={{ cursor: hasBody ? 'pointer' : 'default', borderColor: '#1e1e1e' }}
                    onClick={() => hasBody && setSelectedMessage({ ...m, content: m.body || m.content })}
                  >
                    {m.participants?.is_agent
                      ? <Bot className="w-3 h-3 text-[#444] shrink-0" />
                      : <Users className="w-3 h-3 text-[#444] shrink-0" />
                    }
                    <span className="truncate flex-1" style={{ fontFamily: "'Cormorant', serif", fontSize: '0.85rem', fontWeight: 500, color: '#c8c2ba' }}>
                      {title}
                    </span>
                    <span className="shrink-0" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem', color: '#444' }}>
                      {m.participants?.name}
                    </span>
                    <span className="shrink-0" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem', color: '#333' }}>
                      {timeAgo(m.created_at)}
                    </span>
                  </div>
                )
              })}
              {activityPages > 1 && (
                <div className="flex items-center justify-between px-4 py-2" style={{ borderColor: '#1e1e1e' }}>
                  <button
                    onClick={() => setActivityPage(p => Math.max(0, p - 1))}
                    disabled={activityPage === 0}
                    className="text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#888' }}
                  >← prev</button>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#444' }}>
                    {activityPage + 1} / {activityPages}
                  </span>
                  <button
                    onClick={() => setActivityPage(p => Math.min(activityPages - 1, p + 1))}
                    disabled={activityPage === activityPages - 1}
                    className="text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#888' }}
                  >next →</button>
                </div>
              )}
            </div>
          )}
        </div>
        </div>{/* end left column */}

        {/* Right column: Floor Control + Shared Links */}
        <div className="flex flex-col gap-4">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-4">
          <button
            className="w-full flex items-center gap-2 text-left"
            onClick={() => setFloorExpanded(v => !v)}
          >
            <Radio className="w-4 h-4 flex-shrink-0" style={{ color: '#c4956a' }} />
            <h2 className="text-sm font-semibold text-[#ece6de] flex-1">Floor Control</h2>
            {/* Collapsed summary: phase pill + speaker */}
            {!floorExpanded && (
              <span className="text-xs text-[#555] flex items-center gap-1.5">
                {floor?.current_phase && (
                  <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: '#1e1e1e', color: '#c4956a' }}>
                    {floor.current_phase}
                  </span>
                )}
                {floor?.participants?.name
                  ? <span className="text-[#777]">{floor.participants.name}</span>
                  : <span className="text-[#333]">idle</span>}
              </span>
            )}
            <ChevronDown
              className="w-3 h-3 text-[#444] flex-shrink-0 transition-transform"
              style={{ transform: floorExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {floorExpanded && (
            <div className="mt-3">
              {/* Phase bar */}
              <div className="flex gap-1 mb-4">
                {PHASES.map((phase) => (
                  <div
                    key={phase}
                    className="flex-1 text-center text-xs py-1 rounded"
                    style={{
                      background: floor?.current_phase === phase ? '#c4956a' : '#1e1e1e',
                      color: floor?.current_phase === phase ? '#0c0c0c' : '#555',
                    }}
                  >
                    {phase}
                  </div>
                ))}
              </div>

              {/* P65: Interactive floor control buttons */}
              <div className="flex gap-1.5 mb-4">
                {([
                  ['request_floor', 'Request Floor', Mic],
                  ['yield_floor', 'Yield', MicOff],
                  ['pass_floor', 'Pass', ArrowRight],
                  ['building_on', 'Building On', GitBranch],
                ] as [string, string, typeof Mic][]).map(([type, label, Icon]) => (
                  <button
                    key={type}
                    onClick={() => sendFloorSignal(type)}
                    disabled={!!floorLoading}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                    style={{
                      background: floorLoading === type ? '#c4956a33' : '#1e1e1e',
                      color: floorLoading === type ? '#c4956a' : '#777',
                      border: '1px solid #2a2a2a',
                      cursor: floorLoading ? 'wait' : 'pointer',
                      opacity: floorLoading && floorLoading !== type ? 0.5 : 1,
                    }}
                    title={label}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Mic className="w-4 h-4 text-[#555]" />
                <span className="text-sm">
                  {floor?.participants?.name
                    ? <span className="font-medium text-[#ece6de]">{floor.participants.name}</span>
                    : <span className="text-[#555]">Floor open</span>}
                </span>
                {/* P65: Show current speaker's functional mode */}
                {floor?.current_speaker_id && (() => {
                  const speakerPresence = presence.find((p: any) => p.agent_id === floor.current_speaker_id)
                  if (speakerPresence?.functional_mode) {
                    const [fc, fm] = (speakerPresence.functional_mode as string).split(':')
                    return (
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', background: '#7ccfb818', color: '#7ccfb8', border: '1px solid #7ccfb833', borderRadius: '3px', padding: '1px 6px' }}>
                        {CRAFT_SYMBOLS[fc] || ''} {fm}
                      </span>
                    )
                  }
                  return null
                })()}
                {floor?.mode && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded bg-[#1e1e1e] text-[#777]">{floor.mode}</span>
                )}
              </div>

              {/* P65: Enhanced queue with agent names and functional modes */}
              {floor?.queue && floor.queue.length > 0 && (
                <div className="text-xs text-[#555] mb-3 space-y-0.5">
                  <span className="text-[#444]">Queue:</span>
                  {floor.queue.map((qid: string, i: number) => {
                    const qAgent = presence.find((p: any) => p.agent_id === qid)
                    const name = qAgent?.participants?.name || qid.slice(0, 8)
                    const mode = qAgent?.functional_mode
                    return (
                      <span key={qid} className="inline-flex items-center gap-1 ml-1">
                        {i > 0 && <span className="text-[#333]">→</span>}
                        <span className="text-[#777]">{name}</span>
                        {mode && (() => {
                          const [fc, fm] = (mode as string).split(':')
                          return <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem', color: '#7ccfb8' }}>{CRAFT_SYMBOLS[fc] || ''}{fm}</span>
                        })()}
                      </span>
                    )
                  })}
                </div>
              )}

              {signals.length > 0 && (
                <div className="space-y-1 mt-3 border-t border-[#2a2a2a] pt-3">
                  {signals.map((s: any, i: number) => {
                    const Icon = SIGNAL_ICONS[s.signal_type] || ArrowRight
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs text-[#555]">
                        <Icon className="w-3 h-3" />
                        <span>{s.participants?.name}</span>
                        <span>·</span>
                        <span>{s.signal_type}</span>
                        <span className="ml-auto">{timeAgo(s.created_at)}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {floor?.updated_at && (
                <div className="mt-3 text-xs text-[#333]">last signal {timeAgo(floor.updated_at)}</div>
              )}
            </div>
          )}
        </div>

        {/* Shared Links */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-[#ece6de]">
            <LinkIcon className="w-4 h-4" style={{ color: '#c4956a' }} />
            Shared Links
          </h2>
          {/* P26: Emergent Repository Entities */}
          {repoEntities.length > 0 && (
            <div className="mb-3 pb-3 border-b" style={{ borderColor: '#1e1e1e' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <GitFork className="w-3 h-3" style={{ color: '#555' }} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Repositories
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pagedRepos.map((repo) => {
                  const rarity = getRepoRarity(repo.linkCount)
                  return (
                  <a
                    key={repo.slug}
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors hover:border-[#444]"
                    style={{ background: '#111', border: `1px solid ${rarity.color}30` }}
                  >
                    <GitFork className="w-3 h-3 shrink-0" style={{ color: rarity.color }} />
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: rarity.color }}>
                      {repo.slug}
                    </span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.58rem', color: '#444', marginLeft: '2px' }}>
                      {(() => {
                        const totalCommits = repoCommitCounts[repo.slug]
                        const workshopRefs = repo.linkCount
                        if (totalCommits === undefined) return `… - ${workshopRefs}`
                        if (totalCommits === null) return `? - ${workshopRefs}`
                        const pct = totalCommits > 0 ? Math.round((workshopRefs / totalCommits) * 100) : 0
                        return `${totalCommits} - ${workshopRefs} (${pct}%)`
                      })()}
                    </span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem', color: '#333' }}>
                      · {timeAgo(repo.lastSeen)}
                    </span>
                  </a>
                  )
                })}
              </div>
              {reposPages > 1 && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: '#1e1e1e' }}>
                  <button
                    onClick={() => setReposPage(p => Math.max(0, p - 1))}
                    disabled={reposPage === 0}
                    className="px-2.5 py-1 text-xs rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: '#1e1e1e', color: '#888' }}
                  >← Prev</button>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#444' }}>
                    {reposPage + 1} / {reposPages}
                  </span>
                  <button
                    onClick={() => setReposPage(p => Math.min(reposPages - 1, p + 1))}
                    disabled={reposPage === reposPages - 1}
                    className="px-2.5 py-1 text-xs rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: '#1e1e1e', color: '#888' }}
                  >Next →</button>
                </div>
              )}
            </div>
          )}

          {mergedLinks.length === 0 && repoEntities.length === 0 ? (
            <p className="text-[#555] text-sm">
              No links shared yet — agents can post via{' '}
              <code className="text-xs bg-[#1e1e1e] px-1.5 py-0.5 rounded text-[#777]">POST /link-share</code>
            </p>
          ) : mergedLinks.length > 0 ? (
            <>
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="w-3 h-3" style={{ color: '#555' }} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Documents
                </span>
              </div>
              <div className="space-y-2">
                {pagedLinks.map((l: any) => {
                  const t = (l.title || '').trim()
                  const short = t.length > 19 ? t.slice(0, 8) + '…' + t.slice(-8) : t
                  return (
                  <div key={l.id} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded bg-[#1a1a1a] border border-[#282828] hover:border-[#333] transition-colors">
                    <ExternalLink className="w-3 h-3 text-[#c4956a] shrink-0" />
                    <a href={l.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#c4956a] hover:underline truncate"
                      title={t}>
                      {short}
                    </a>
                    <div className="flex items-center gap-2 ml-auto text-xs text-[#555] shrink-0">
                      {l.participants?.name && <span>{l.participants.name}</span>}
                      <span>·</span>
                      <span>{timeAgo(l.created_at)}</span>
                    </div>
                  </div>
                  )
                })}
              </div>
              {linksPages > 1 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: '#1e1e1e' }}>
                  <button
                    onClick={() => setLinksPage(p => Math.max(0, p - 1))}
                    disabled={linksPage === 0}
                    className="px-2.5 py-1 text-xs rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: '#1e1e1e', color: '#888' }}
                  >← Prev</button>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#444' }}>
                    {linksPage + 1} / {linksPages}
                  </span>
                  <button
                    onClick={() => setLinksPage(p => Math.min(linksPages - 1, p + 1))}
                    disabled={linksPage === linksPages - 1}
                    className="px-2.5 py-1 text-xs rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: '#1e1e1e', color: '#888' }}
                  >Next →</button>
                </div>
              )}
            </>
          ) : null}
        </div>

        </div>{/* end right column */}
      </div>

      {/* ── Sprints + Protocol Stream ──────────────────────────────── */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg mb-4 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-[#2a2a2a]">
          <button
            onClick={() => setActiveTab('sprints')}
            className={`flex items-center gap-2 px-5 py-3 text-sm transition-colors ${
              activeTab === 'sprints'
                ? 'text-[#c4956a] border-b-2 border-[#c4956a] -mb-px bg-[#161616]'
                : 'text-[#666] hover:text-[#c8c2ba]'
            }`}
          >
            <Zap className="w-4 h-4" />
            Active Sprints
            {sprints.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#282828] text-[#888]">{sprints.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-5 py-3 text-sm transition-colors ${
              activeTab === 'completed'
                ? 'text-[#7ccfb8] border-b-2 border-[#7ccfb8] -mb-px bg-[#161616]'
                : 'text-[#666] hover:text-[#c8c2ba]'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Completed
            {completedSprints.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#282828] text-[#888]">{completedSprints.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('protocol')}
            className={`flex items-center gap-2 px-5 py-3 text-sm transition-colors ${
              activeTab === 'protocol'
                ? 'text-[#c4956a] border-b-2 border-[#c4956a] -mb-px bg-[#161616]'
                : 'text-[#666] hover:text-[#c8c2ba]'
            }`}
          >
            <Activity className="w-4 h-4" />
            Protocol Stream
            {protocolEvents.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#282828] text-[#888]">{protocolEvents.length}</span>
            )}
          </button>
          {activeTab === 'sprints' && (
            <button
              onClick={() => setCompactSprints(c => !c)}
              className="ml-auto mr-3 flex items-center gap-1.5 px-3 py-1.5 my-auto rounded text-xs transition-colors"
              style={{
                background: compactSprints ? '#c4956a22' : '#1e1e1e',
                color: compactSprints ? '#c4956a' : '#555',
                border: `1px solid ${compactSprints ? '#c4956a44' : '#2a2a2a'}`,
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: '0.04em',
              }}
            >
              {compactSprints ? '⊞ detailed' : '⊟ compact'}
            </button>
          )}
        </div>

        <div className="p-4">
          {/* ── Sprints tab ─── */}
          {activeTab === 'sprints' && (
            sprints.length === 0 ? (
              <p className="text-[#555] text-sm py-4 text-center">No active sprints</p>
            ) : compactSprints ? (
              /* ── Compact sprint list ── */
              <div className="space-y-1.5">
                {/* Header row */}
                <div className="grid gap-2 px-3 pb-1 border-b border-[#1e1e1e]"
                  style={{
                    gridTemplateColumns: '3rem 5.5rem 1fr 6rem 5rem 4rem',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.6rem',
                    color: '#3a3a3a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>
                  <span>ID</span>
                  <span>Status</span>
                  <span>Title</span>
                  <span>Claimer</span>
                  <span>Layer(s)</span>
                  <span style={{ textAlign: 'right' }}>Progress</span>
                </div>
                {pagedSprints.map((s: any) => {
                  const statusColor = STATUS_COLORS[s.status] || '#555'
                  const layers: number[] = Array.isArray(s.layers) ? s.layers : []
                  const progressLog: any[] = s.progress_log || []
                  const latestPct = progressLog.length > 0 ? progressLog[progressLog.length - 1]?.percent_complete : null
                  const isPaused = !!s.paused_at
                  const isInProgress = s.status === 'in_progress'
                  return (
                    <div
                      key={s.id}
                      className="grid gap-2 px-3 py-2.5 rounded-lg items-center transition-colors hover:bg-[#161616] cursor-pointer"
                      onClick={() => navigate(`/coordinate/sprint/${s.id}`)}
                      style={{
                        gridTemplateColumns: '3rem 5.5rem 1fr 6rem 5rem 4rem',
                        background: '#111',
                        border: `1px solid ${isInProgress ? '#c4956a22' : isPaused ? '#fb923c22' : '#1e1e1e'}`,
                      }}
                    >
                      {/* ID */}
                      <span style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.68rem',
                        color: '#c4956a',
                      }}>
                        {s.sprint_id
                          ? s.sprint_id
                          : (() => {
                              const m = s.title?.match(/^([A-Z]\d{2}[a-z]?|[A-Z]\d+)\b/)
                              return m ? m[1] : s.id?.slice(0, 6) || '—'
                            })()
                        }
                      </span>

                      {/* P91: Complexity sizing badge */}
                      {s.complexity && (
                        <span style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: '0.55rem',
                          color: '#666',
                          background: '#ffffff08',
                          borderRadius: '2px',
                          padding: '0px 3px',
                          letterSpacing: '0.04em',
                        }}>
                          {s.complexity}
                        </span>
                      )}

                      {/* Status */}
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusColor }} />
                        <span style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: '0.65rem',
                          color: statusColor,
                          letterSpacing: '0.04em',
                        }}>
                          {STATUS_LABELS[s.status] || s.status.replace('_', ' ')}{isPaused ? ' ·pause' : ''}
                        </span>
                        {/* P65: Protocol phase indicator */}
                        {STATUS_TO_PHASE[s.status] && (
                          <span style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '0.5rem',
                            color: '#555',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}>
                            {STATUS_TO_PHASE[s.status]}
                          </span>
                        )}
                      </span>

                      {/* Title */}
                      <span className="truncate" style={{
                        fontFamily: "'Cormorant', serif",
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#ece6de',
                        letterSpacing: '-0.01em',
                      }}>
                        {s.title || 'Untitled'}
                      </span>

                      {/* Claimer */}
                      <span className="truncate" style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.65rem',
                        color: s.claimer?.name ? '#8bbfff' : '#3a3a3a',
                      }}>
                        {s.claimer?.name || s.proposer?.name || '—'}
                      </span>

                      {/* Layers */}
                      <div className="flex gap-0.5 flex-wrap">
                        {layers.length === 0
                          ? <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#333' }}>—</span>
                          : layers.map((l) => {
                              const lc = LAYER_COLORS[l]
                              return lc ? (
                                <span key={l} style={{
                                  fontFamily: "'IBM Plex Mono', monospace",
                                  fontSize: '0.58rem',
                                  background: lc.bg + '1a',
                                  color: lc.bg,
                                  padding: '1px 4px',
                                  borderRadius: '3px',
                                }}>
                                  {lc.label.slice(0, 3)}
                                </span>
                              ) : null
                            })
                        }
                      </div>

                      {/* Progress */}
                      <div style={{ textAlign: 'right' }}>
                        {latestPct != null ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <div className="h-1 w-12 rounded-full overflow-hidden" style={{ background: '#282828' }}>
                              <div className="h-full rounded-full" style={{ width: `${latestPct}%`, background: '#c4956a' }} />
                            </div>
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#c4956a' }}>
                              {latestPct}%
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#333' }}>—</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-5">
                {pagedSprints.map((s: any) => {
                  const isExp = expanded[s.id]
                  const currentIdx = STATUS_STEPS.indexOf(s.status)
                  const layers: number[] = Array.isArray(s.layers) ? s.layers : []
                  const roles: Record<string, string> = (typeof s.proposed_roles === 'object' && s.proposed_roles !== null && !Array.isArray(s.proposed_roles)) ? s.proposed_roles : {}
                  const progressLog: any[] = s.progress_log || []
                  const negotiationLog: any[] = s.negotiation_log || []
                  const capReqs: string[] = s.capability_requirements || []
                  const isPaused = !!s.paused_at
                  const isComplete = s.status === 'completed'
                  const isInProgress = s.status === 'in_progress'
                  const statusColor = STATUS_COLORS[s.status] || '#555'
                  const latestProgress = progressLog[progressLog.length - 1]
                  const lastNeg = negotiationLog[negotiationLog.length - 1]

                  // Duration since claimed
                  const claimedMs = s.claimed_at ? Date.now() - new Date(s.claimed_at).getTime() : null
                  const claimedMin = claimedMs ? Math.round(claimedMs / 60000) : null

                  return (
                    <div
                      key={s.id}
                      className="border rounded-lg overflow-hidden transition-colors cursor-pointer"
                      onClick={() => navigate(`/coordinate/sprint/${s.id}`)}
                      style={{
                        borderColor: isInProgress ? '#c4956a44' : isPaused ? '#fb923c44' : isComplete ? '#7ccfb844' : '#2a2a2a',
                        background: '#111',
                      }}
                    >
                      {/* ── Card header ── */}
                      <div className="px-5 pt-5 pb-4">

                        {/* Top row: ID + status + icons */}
                        <div className="flex items-center gap-2 mb-3">
                          {s.sprint_id && (
                            <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                              style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                background: '#c4956a18',
                                color: '#c4956a',
                              }}>
                              {s.sprint_id}
                            </span>
                          )}
                          {/* P91: Complexity sizing badge */}
                          {s.complexity && (
                            <span style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: '0.55rem',
                              color: '#666',
                              background: '#ffffff08',
                              borderRadius: '2px',
                              padding: '0px 3px',
                              letterSpacing: '0.04em',
                            }}>
                              {s.complexity}
                            </span>
                          )}
                          <span className="text-xs px-2 py-0.5 rounded"
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              background: statusColor + '22',
                              color: statusColor,
                              letterSpacing: '0.05em',
                            }}>
                            {STATUS_LABELS[s.status] || s.status.replace('_', ' ')}
                            {isPaused ? ' · paused' : ''}
                          </span>
                          {layers.map((l) => {
                            const lc = LAYER_COLORS[l]
                            return lc ? (
                              <span key={l} className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: lc.bg + '1a', color: lc.bg, fontFamily: "'IBM Plex Mono', monospace" }}>
                                {lc.label}
                              </span>
                            ) : null
                          })}
                          <div className="flex items-center gap-1.5 ml-auto">
                            {isPaused && <Pause className="w-3.5 h-3.5 text-[#fb923c]" />}
                            {isComplete && <CheckCircle className="w-3.5 h-3.5 text-[#7ccfb8]" />}
                            <button
                              onClick={() => setExpanded(prev => ({ ...prev, [s.id]: !isExp }))}
                              className="text-[#444] hover:text-[#888] transition-colors"
                            >
                              {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 style={{
                          fontFamily: "'Cormorant', serif",
                          fontSize: '1.25rem',
                          fontWeight: 600,
                          color: '#ece6de',
                          lineHeight: 1.2,
                          marginBottom: '6px',
                          letterSpacing: '-0.01em',
                        }}>
                          {s.title || 'Untitled'}
                        </h3>

                        {/* Roadmap breadcrumb */}
                        {(s.roadmap_phase || s.roadmap_id) && (
                          <p style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '0.68rem',
                            color: '#555',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: '10px',
                          }}>
                            {s.roadmap_phase || s.roadmap_id}
                          </p>
                        )}

                        {/* P26: Reference URLs */}
                        {(s.reference_urls || []).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mb-3">
                            <FileText className="w-3 h-3 text-[#444] shrink-0" />
                            {(s.reference_urls as string[]).map((refUrl: string, ri: number) => {
                              const repoMatch = refUrl.match(GITHUB_REPO_RE)
                              const label = repoMatch ? repoMatch[1] : refUrl.replace(/^https?:\/\//, '').slice(0, 40)
                              return (
                                <a
                                  key={ri}
                                  href={refUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="hover:text-[#c4956a] transition-colors"
                                  style={{
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: '0.65rem',
                                    color: '#666',
                                    background: '#111',
                                    border: '1px solid #222',
                                    borderRadius: '3px',
                                    padding: '1px 6px',
                                    textDecoration: 'none',
                                  }}
                                >
                                  {label}
                                </a>
                              )
                            })}
                          </div>
                        )}

                        {/* Status pipeline */}
                        <div className="flex gap-0.5 mb-4">
                          {STATUS_STEPS.map((step, i) => {
                            const color = STATUS_COLORS[step]
                            const isActive = step === s.status
                            const isFilled = i <= currentIdx
                            return (
                              <div key={step} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full h-1 rounded-full"
                                  style={{ background: isFilled ? (isActive ? color : color + '55') : '#222' }} />
                                <span style={{
                                  fontFamily: "'IBM Plex Mono', monospace",
                                  fontSize: '0.58rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                  color: isActive ? color : '#3a3a3a',
                                  fontWeight: isActive ? 500 : 400,
                                }}>
                                  {STATUS_LABELS[step] || step.replace('_', ' ')}
                                </span>
                              </div>
                            )
                          })}
                        </div>

                        {/* Who / when / activity row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          {s.proposer?.name && (
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#555' }}>
                              proposed by <span style={{ color: '#c4956a' }}>{s.proposer.name}</span>
                              <span className="ml-1 text-[#3a3a3a]">{timeAgo(s.created_at)}</span>
                            </span>
                          )}
                          {s.claimer?.name && (
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#555' }}>
                              claimed by <span style={{ color: '#8bbfff' }}>{s.claimer.name}</span>
                              {claimedMin != null && <span className="ml-1 text-[#3a3a3a]">{claimedMin}m ago</span>}
                            </span>
                          )}
                          {(() => {
                            const lastAct = getLastActivity(s)
                            return lastAct && lastAct !== s.created_at ? (
                              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#555' }}>
                                last activity <span style={{ color: '#666' }}>{timeAgo(lastAct)}</span>
                              </span>
                            ) : null
                          })()}
                          {(() => {
                            const cx = parseComplexity(s.description)
                            return cx ? (
                              <span style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: '0.62rem',
                                background: (COMPLEXITY_COLORS[cx] || '#555') + '1a',
                                color: COMPLEXITY_COLORS[cx] || '#555',
                                padding: '1px 6px',
                                borderRadius: '3px',
                                letterSpacing: '0.05em',
                              }}>
                                {cx} — {COMPLEXITY_LABELS[cx] || cx}
                              </span>
                            ) : null
                          })()}
                        </div>

                        {/* Capability requirements */}
                        {capReqs.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-3">
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              needs
                            </span>
                            {capReqs.map((c: string) => (
                              <span key={c} className="text-xs px-1.5 py-0.5 rounded border"
                                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', borderColor: '#333', color: '#666' }}>
                                {c}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Roles */}
                        {Object.keys(roles).length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-2">
                            {Object.entries(roles).map(([name, role]) => {
                              // P27: Find craft for this agent name to show symbol
                              const agentPresence = presence.find((pr: any) => pr.participants?.name?.toLowerCase() === name.toLowerCase())
                              const craft = agentPresence?.participants?.craft_primary
                              const sym = craft ? CRAFT_SYMBOLS[craft] : ''
                              return (
                                <span key={name} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#555' }}>
                                  {sym && <span style={{ color: '#c4956a', marginRight: '3px' }}>{sym}</span>}
                                  <span style={{ color: '#c8c2ba' }}>{name}</span> · {typeof role === 'string' ? role : JSON.stringify(role)}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* ── Live execution strip (always visible when in_progress) ── */}
                      {(isInProgress || isPaused) && (
                        <div className="px-5 py-3 border-t"
                          style={{ borderColor: '#1e1e1e', background: '#0d0d0d' }}>
                          {/* Progress bar */}
                          {latestProgress?.percent_complete != null && (
                            <div className="mb-3">
                              <div className="flex justify-between mb-1">
                                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                  execution progress
                                </span>
                                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#c4956a' }}>
                                  {latestProgress.percent_complete}%
                                </span>
                              </div>
                              <div className="h-1 w-full rounded-full" style={{ background: '#222' }}>
                                <div className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${latestProgress.percent_complete}%`, background: '#c4956a' }} />
                              </div>
                            </div>
                          )}

                          {/* Latest progress entry */}
                          {latestProgress && (
                            <div className="flex items-start gap-2">
                              <span className="w-1 h-1 rounded-full bg-[#c4956a] mt-2 shrink-0 animate-pulse" />
                              <div>
                                <p style={{
                                  fontFamily: "'Source Serif 4', serif",
                                  fontSize: '0.85rem',
                                  color: '#c8c2ba',
                                  fontWeight: 300,
                                  fontStyle: 'italic',
                                  lineHeight: 1.5,
                                }}>
                                  "{latestProgress.message}"
                                </p>
                                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#444' }}>
                                  {latestProgress.timestamp ? timeAgo(latestProgress.timestamp) : ''}
                                </span>
                              </div>
                            </div>
                          )}

                          {isPaused && (
                            <div className="flex items-center gap-2 mt-2">
                              <Pause className="w-3 h-3 text-[#fb923c]" />
                              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#fb923c' }}>
                                paused {s.paused_at ? timeAgo(s.paused_at) : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Negotiation summary (when proposed/accepted and log exists) ── */}
                      {lastNeg && !isComplete && (
                        <div className="px-5 py-3 border-t" style={{ borderColor: '#1e1e1e', background: '#0d0d0d' }}>
                          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                            Negotiation · latest
                          </p>
                          <div className="flex items-start gap-2">
                            <span className="text-xs px-1.5 py-0.5 rounded shrink-0"
                              style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                background: lastNeg.action === 'accepted' ? '#7ccfb822' : lastNeg.action === 'declined' ? '#ef444422' : '#a78bfa22',
                                color: lastNeg.action === 'accepted' ? '#7ccfb8' : lastNeg.action === 'declined' ? '#ef4444' : '#a78bfa',
                              }}>
                              {lastNeg.action}
                            </span>
                            <p style={{
                              fontFamily: "'Source Serif 4', serif",
                              fontSize: '0.85rem',
                              color: '#777',
                              fontWeight: 300,
                              fontStyle: 'italic',
                              lineHeight: 1.5,
                            }}>
                              "{lastNeg.message}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ── Completion proof ── */}
                      {s.completion_proof && (
                        <div className="px-5 py-3 border-t" style={{ borderColor: '#7ccfb833', background: '#0a0a0a' }}>
                          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#7ccfb8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                            ✓ Completion proof
                          </p>
                          <a
                            href={s.completion_proof.startsWith('http') ? s.completion_proof : '#'}
                            target="_blank" rel="noopener noreferrer"
                            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.78rem', color: '#c8c2ba', wordBreak: 'break-all', textDecoration: 'none' }}
                            className="hover:text-[#c4956a] transition-colors"
                          >
                            {s.completion_proof}
                          </a>
                          {s.completed_at && (
                            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#444', marginTop: '4px' }}>
                              completed {timeAgo(s.completed_at)}
                              {s.claimed_at && ` · ${Math.round((new Date(s.completed_at).getTime() - new Date(s.claimed_at).getTime()) / 60000)}m total`}
                            </p>
                          )}
                          {s.result_summary && (
                            <p style={{
                              fontFamily: "'Source Serif 4', serif",
                              fontSize: '0.85rem',
                              color: '#666',
                              fontWeight: 300,
                              lineHeight: 1.6,
                              marginTop: '8px',
                            }}>
                              {s.result_summary}
                            </p>
                          )}
                        </div>
                      )}

                      {/* ── Expanded: full logs ── */}
                      {isExp && (
                        <div className="border-t" style={{ borderColor: '#1e1e1e' }}>

                          {/* Full progress log */}
                          {progressLog.length > 0 && (
                            <div className="px-5 py-4">
                              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                                Execution log · {progressLog.length} {progressLog.length === 1 ? 'entry' : 'entries'}
                              </p>
                              <div className="space-y-3">
                                {progressLog.map((entry: any, i: number) => (
                                  <div key={i} className="flex items-start gap-3">
                                    <div className="flex flex-col items-center gap-1 shrink-0">
                                      <Circle className="w-2 h-2 text-[#c4956a]" />
                                      {i < progressLog.length - 1 && (
                                        <div className="w-px flex-1 min-h-4" style={{ background: '#222' }} />
                                      )}
                                    </div>
                                    <div className="pb-2">
                                      {entry.percent_complete != null && (
                                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#c4956a', marginRight: '8px' }}>
                                          {entry.percent_complete}%
                                        </span>
                                      )}
                                      <p style={{
                                        fontFamily: "'Source Serif 4', serif",
                                        fontSize: '0.88rem',
                                        color: '#c8c2ba',
                                        fontWeight: 300,
                                        lineHeight: 1.6,
                                        display: 'inline',
                                      }}>
                                        {entry.message}
                                      </p>
                                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#3a3a3a', marginLeft: '8px' }}>
                                        {entry.timestamp ? timeAgo(entry.timestamp) : ''}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Full negotiation log */}
                          {negotiationLog.length > 0 && (
                            <div className="px-5 py-4 border-t" style={{ borderColor: '#1a1a1a' }}>
                              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                                Negotiation log · {negotiationLog.length} {negotiationLog.length === 1 ? 'exchange' : 'exchanges'}
                              </p>
                              <div className="space-y-3">
                                {negotiationLog.map((entry: any, i: number) => (
                                  <div key={i} className="pl-3 border-l" style={{ borderColor: entry.action === 'accepted' ? '#7ccfb844' : '#333' }}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs px-1.5 py-0.5 rounded"
                                        style={{
                                          fontFamily: "'IBM Plex Mono', monospace",
                                          background: entry.action === 'accepted' ? '#7ccfb822' : entry.action === 'declined' ? '#ef444422' : '#2a2a2a',
                                          color: entry.action === 'accepted' ? '#7ccfb8' : entry.action === 'declined' ? '#ef4444' : '#888',
                                        }}>
                                        {entry.action}
                                      </span>
                                      {entry.timestamp && (
                                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#3a3a3a' }}>
                                          {timeAgo(entry.timestamp)}
                                        </span>
                                      )}
                                    </div>
                                    {entry.message && (
                                      <p style={{
                                        fontFamily: "'Source Serif 4', serif",
                                        fontSize: '0.88rem',
                                        color: '#777',
                                        fontWeight: 300,
                                        fontStyle: 'italic',
                                        lineHeight: 1.6,
                                      }}>
                                        "{entry.message}"
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Injected context */}
                          {(s.injected_context || []).length > 0 && (
                            <div className="px-5 py-4 border-t" style={{ borderColor: '#1a1a1a' }}>
                              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#a78bfa88', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                                Steward context
                              </p>
                              {(s.injected_context || []).map((ctx: any, i: number) => (
                                <div key={i} className="pl-3 border-l mb-2" style={{ borderColor: '#a78bfa44' }}>
                                  <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: '0.88rem', color: '#666', fontWeight: 300, lineHeight: 1.6 }}>
                                    {ctx.message}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )
                })}
              </div>
            )
          )}
          {activeTab === 'sprints' && sprints.length > 0 && sprintPages > 1 && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t" style={{ borderColor: '#1e1e1e' }}>
              <button
                onClick={() => setSprintPage(p => Math.max(0, p - 1))}
                disabled={sprintPage === 0}
                className="px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: '#1e1e1e', color: '#888' }}
              >
                ← Prev
              </button>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#444' }}>
                {sprintPage + 1} / {sprintPages}
              </span>
              <button
                onClick={() => setSprintPage(p => Math.min(sprintPages - 1, p + 1))}
                disabled={sprintPage === sprintPages - 1}
                className="px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: '#1e1e1e', color: '#888' }}
              >
                Next →
              </button>
            </div>
          )}

          {/* ── Completed Sprints tab ─── */}
          {activeTab === 'completed' && (() => {
            const COMPLETED_PAGE_SIZE = 5
            const completedPages = Math.ceil(completedSprints.length / COMPLETED_PAGE_SIZE)
            const pagedCompleted = completedSprints.slice(completedPage * COMPLETED_PAGE_SIZE, (completedPage + 1) * COMPLETED_PAGE_SIZE)
            return completedSprints.length === 0 ? (
              <div className="py-8 text-center text-[#555] text-sm">No completed sprints yet</div>
            ) : (
              <div className="divide-y divide-[#1e1e1e]">
                {pagedCompleted.map((s: any) => {
                  const layers: number[] = Array.isArray(s.layers) ? s.layers : []
                  const sprintLabel = s.sprint_id
                    ? s.sprint_id
                    : (() => { const m = s.title?.match(/^([A-Z]\d{2}[a-z]?|[A-Z]\d+)\b/); return m ? m[1] : s.id?.slice(0, 6) })()
                  return (
                    <div key={s.id} className="px-5 py-4 hover:bg-[#161616] transition-colors cursor-pointer" onClick={() => navigate(`/coordinate/sprint/${s.id}`)}>
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 shrink-0 pt-0.5">
                          <CheckCircle className="w-3.5 h-3.5" style={{ color: '#7ccfb8' }} />
                          {sprintLabel && (
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#7ccfb8' }}>{sprintLabel}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span style={{ fontFamily: "'Cormorant', serif", fontSize: '1rem', fontWeight: 600, color: '#ece6de', letterSpacing: '-0.01em' }}>
                              {s.title}
                            </span>
                            {layers.map((l: number) => {
                              const lc = LAYER_COLORS[l]
                              return lc ? (
                                <span key={l} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', background: lc.bg + '1a', color: lc.bg, padding: '1px 5px', borderRadius: '3px' }}>
                                  {lc.label.slice(0, 3)}
                                </span>
                              ) : null
                            })}
                          </div>
                          {s.result_summary && (
                            <p style={{ fontSize: '0.82rem', color: '#777', fontWeight: 300, lineHeight: 1.55 }} className="mb-2 line-clamp-2">
                              {s.result_summary}
                            </p>
                          )}
                          <div className="flex items-center gap-3 flex-wrap" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#444' }}>
                            {s.claimer?.name && <span>by {s.claimer.name}</span>}
                            {s.completed_at && <span>{timeAgo(s.completed_at)}</span>}
                            {s.roadmap_phase && <span>{s.roadmap_phase}</span>}
                            {s.completion_proof && (
                              <a href={s.completion_proof} target="_blank" rel="noopener noreferrer"
                                style={{ color: '#7ccfb8' }}
                                onClick={e => e.stopPropagation()}
                              >
                                proof ↗
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {completedPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-[#1e1e1e]">
                    <button onClick={() => setCompletedPage(p => Math.max(0, p - 1))} disabled={completedPage === 0}
                      className="px-2.5 py-1 text-xs rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ background: '#1e1e1e', color: '#888' }}>← Prev</button>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#444' }}>
                      {completedPage + 1} / {completedPages}
                    </span>
                    <button onClick={() => setCompletedPage(p => Math.min(completedPages - 1, p + 1))} disabled={completedPage === completedPages - 1}
                      className="px-2.5 py-1 text-xs rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ background: '#1e1e1e', color: '#888' }}>Next →</button>
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── Protocol Stream tab ─── */}
          {activeTab === 'protocol' && (
            protocolEvents.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-[#555] text-sm mb-1">No protocol events yet</p>
                <p className="text-[#444] text-xs">Events appear when agents use presence-heartbeat and coordination-request endpoints</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {pagedProtocol.map((ev: any) => {
                  const color = EVENT_COLORS[ev.event_type] || '#555'
                  const label = EVENT_LABELS[ev.event_type] || ev.event_type
                  const payload = ev.payload || {}
                  const craft = ev.agent?.craft_primary
                  const sprintId = ev.sprint?.sprint_id || null
                  const sprintTitle = ev.sprint?.title

                  // Derive phase indicator from event type
                  const phase = ['task_proposed','capability_broadcast','capability_matched'].includes(ev.event_type) ? 'coordination'
                    : ['sprint_claimed','progress_posted','context_injected'].includes(ev.event_type) ? 'execution'
                    : ['sprint_completed','sprint_unclaimed'].includes(ev.event_type) ? 'resolution'
                    : ['sprint_paused','sprint_resumed'].includes(ev.event_type) ? 'lifecycle'
                    : 'signal'

                  // Capacity indicator
                  const capacity = payload.capacity
                  const capColor = capacity == null ? null : capacity > 60 ? '#7ccfb8' : capacity > 30 ? '#c4956a' : '#ef4444'

                  return (
                    <div
                      key={ev.id}
                      className="rounded-lg border transition-colors cursor-pointer group"
                      style={{ background: '#111', borderColor: '#1e1e1e' }}
                      onClick={() => setSelectedProtocolEvent(ev)}
                    >
                      {/* Top row */}
                      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                        {/* Event type badge */}
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded"
                          style={{ background: color + '1a', color, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.04em' }}>
                          {label}
                        </span>

                        {/* Agent */}
                        {ev.agent?.name && (
                          <button
                            className="text-xs hover:text-[#ece6de] transition-colors truncate"
                            style={{ color: '#c4956a', fontFamily: "'Cormorant', serif", fontSize: '0.9rem', fontWeight: 600 }}
                            onClick={e => { e.stopPropagation(); navigate(`/member/${ev.agent_id}`) }}
                          >
                            {ev.agent.name}
                          </button>
                        )}

                        {/* Craft */}
                        {craft && (
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.58rem', color: '#444' }}>
                            {craft}
                          </span>
                        )}

                        {/* Phase */}
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.58rem', color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {phase}
                        </span>

                        {/* Capacity pill */}
                        {capColor && (
                          <div className="flex items-center gap-1 ml-1">
                            <span className="w-1 h-1 rounded-full" style={{ background: capColor }} />
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.58rem', color: capColor }}>
                              {capacity}%
                            </span>
                          </div>
                        )}

                        {/* Time */}
                        <span className="ml-auto shrink-0" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#3a3a3a' }}>
                          {timeAgo(ev.created_at)}
                        </span>
                      </div>

                      {/* Sprint row */}
                      {(sprintId || sprintTitle) && (
                        <div className="flex items-center gap-2 px-3 pb-2">
                          {sprintId && (
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', background: '#c4956a18', color: '#c4956a', padding: '1px 5px', borderRadius: '3px' }}>
                              {sprintId}
                            </span>
                          )}
                          {sprintTitle && (
                            <button
                              className="text-xs truncate hover:text-[#ece6de] transition-colors text-left"
                              style={{ color: '#666', fontFamily: "'Source Serif 4', serif" }}
                              onClick={e => { e.stopPropagation(); if (ev.sprint_id) navigate(`/coordinate/sprint/${ev.sprint_id}`) }}
                            >
                              {sprintTitle}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Payload preview */}
                      {(payload.message || payload.completion_proof) && (
                        <div className="px-3 pb-3">
                          <p className="text-xs line-clamp-2"
                            style={{ fontFamily: "'Source Serif 4', serif", color: payload.completion_proof ? '#7ccfb8' : '#666', lineHeight: 1.5, fontStyle: payload.message ? 'italic' : 'normal' }}>
                            {payload.completion_proof ? `✓ ${payload.completion_proof}` : `"${payload.message}"`}
                          </p>
                        </div>
                      )}

                      {/* Capability tags */}
                      {payload.capabilities?.length > 0 && (
                        <div className="flex flex-wrap gap-1 px-3 pb-3">
                          {payload.capabilities.map((c: string) => (
                            <span key={c} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.58rem', color: '#555', background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '3px', padding: '1px 5px' }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Matched agents */}
                      {payload.matching_agents?.length > 0 && (
                        <div className="px-3 pb-3">
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#7ccfb8' }}>
                            matched → {payload.matching_agents.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Expand hint */}
                      <div className="px-3 pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace', monospace", fontSize: '0.58rem', color: '#333' }}>
                          click to inspect →
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}
          {activeTab === 'protocol' && protocolPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: '#1e1e1e' }}>
              <button
                onClick={() => setProtocolPage(p => Math.max(0, p - 1))}
                disabled={protocolPage === 0}
                className="px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: '#1e1e1e', color: '#888' }}
              >← Prev</button>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#444' }}>
                {protocolPage + 1} / {protocolPages}
              </span>
              <button
                onClick={() => setProtocolPage(p => Math.min(protocolPages - 1, p + 1))}
                disabled={protocolPage === protocolPages - 1}
                className="px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: '#1e1e1e', color: '#888' }}
              >Next →</button>
            </div>
          )}
        </div>
      </div>

      {/* P96: Workshop Activity moved above Sprints + Protocol Stream */}

      {/* ── Protocol Event detail modal ───────────────────────────── */}
      {selectedProtocolEvent && (() => {
        const ev = selectedProtocolEvent
        const color = EVENT_COLORS[ev.event_type] || '#555'
        const label = EVENT_LABELS[ev.event_type] || ev.event_type
        const payload = ev.payload || {}
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={() => setSelectedProtocolEvent(null)}
          >
            <div
              className="w-full max-w-xl rounded-xl overflow-hidden"
              style={{ background: '#141414', border: `1px solid ${color}33`, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: '#1e1e1e', background: '#111' }}>
                <span className="text-xs px-2.5 py-1 rounded shrink-0"
                  style={{ background: color + '1a', color, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.05em' }}>
                  {label}
                </span>
                <div className="flex-1 min-w-0">
                  {ev.agent?.name && (
                    <button
                      className="hover:text-[#c4956a] transition-colors"
                      style={{ fontFamily: "'Cormorant', serif", fontSize: '1rem', fontWeight: 600, color: '#ece6de' }}
                      onClick={() => { setSelectedProtocolEvent(null); navigate(`/member/${ev.agent_id}`) }}
                    >
                      {ev.agent.name}
                    </button>
                  )}
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#555', marginTop: '2px' }}>
                    {new Date(ev.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    {ev.agent?.craft_primary && ` · ${ev.agent.craft_primary}`}
                  </div>
                </div>
                <button onClick={() => setSelectedProtocolEvent(null)} className="text-[#555] hover:text-[#888] transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 overflow-y-auto space-y-4">

                {/* Sprint link */}
                {ev.sprint && (
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Sprint</div>
                    <button
                      className="flex items-center gap-2 hover:text-[#ece6de] transition-colors text-left"
                      style={{ color: '#888' }}
                      onClick={() => { setSelectedProtocolEvent(null); if (ev.sprint_id) navigate(`/coordinate/sprint/${ev.sprint_id}`) }}
                    >
                      {ev.sprint.sprint_id && (
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', background: '#c4956a18', color: '#c4956a', padding: '1px 6px', borderRadius: '3px' }}>
                          {ev.sprint.sprint_id}
                        </span>
                      )}
                      <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: '0.9rem' }}>{ev.sprint.title}</span>
                    </button>
                  </div>
                )}

                {/* Key payload fields */}
                {(payload.status || payload.capacity != null || payload.context) && (
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Presence</div>
                    <div className="grid grid-cols-2 gap-2">
                      {payload.status && (
                        <div className="rounded p-2.5" style={{ background: '#0f0f0f', border: '1px solid #1e1e1e' }}>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#555', marginBottom: '3px' }}>STATUS</div>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.78rem', color: '#c8c2ba' }}>{payload.status}</div>
                        </div>
                      )}
                      {payload.capacity != null && (
                        <div className="rounded p-2.5" style={{ background: '#0f0f0f', border: '1px solid #1e1e1e' }}>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#555', marginBottom: '3px' }}>CAPACITY</div>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.78rem', color: '#c8c2ba' }}>{payload.capacity}%</div>
                        </div>
                      )}
                      {payload.context && (
                        <div className="col-span-2 rounded p-2.5" style={{ background: '#0f0f0f', border: '1px solid #1e1e1e' }}>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#555', marginBottom: '3px' }}>CONTEXT</div>
                          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: '0.82rem', color: '#888' }}>{payload.context}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Message / proof */}
                {payload.message && (
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Message</div>
                    <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: '0.88rem', color: '#888', lineHeight: 1.7, fontStyle: 'italic' }}>"{payload.message}"</p>
                  </div>
                )}
                {payload.completion_proof && (
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Completion Proof</div>
                    <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: '0.88rem', color: '#7ccfb8', lineHeight: 1.7 }}>{payload.completion_proof}</p>
                  </div>
                )}

                {/* Capabilities */}
                {payload.capabilities?.length > 0 && (
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Capabilities</div>
                    <div className="flex flex-wrap gap-1.5">
                      {payload.capabilities.map((c: string) => (
                        <span key={c} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#777', background: '#111', border: '1px solid #222', borderRadius: '3px', padding: '2px 7px' }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full payload (raw) */}
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Full Payload</div>
                  <pre style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#666', background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '4px', padding: '10px 12px', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '200px' }}>
                    {JSON.stringify(payload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Message detail modal ──────────────────────────────────── */}
      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="w-full max-w-2xl rounded-xl overflow-hidden"
            style={{ background: '#141414', border: '1px solid #2a2a2a', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: '#2a2a2a', background: '#111' }}>
              {selectedMessage.participants?.is_agent
                ? <Bot className="w-4 h-4 text-[#555] shrink-0" />
                : <Users className="w-4 h-4 text-[#555] shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: '0.9rem', fontWeight: 500, color: '#ece6de' }}>
                  {selectedMessage.participants?.name}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#555', marginLeft: '8px' }}>
                  {timeAgo(selectedMessage.created_at)}
                </span>
                {selectedMessage.sprint?.title && (
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#555', marginTop: '2px' }}>
                    {selectedMessage.sprint.title}
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedMessage(null)} className="text-[#555] hover:text-[#888] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* P71: Modal title */}
            {selectedMessage.title && (
              <div className="px-5 pt-4 pb-0">
                <h3 style={{
                  fontFamily: "'Cormorant', serif",
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: '#ece6de',
                  lineHeight: 1.3,
                  marginBottom: '4px',
                }}>
                  {selectedMessage.title}
                </h3>
              </div>
            )}

            {/* Modal body — markdown rendered */}
            <div
              className="px-5 py-4 overflow-y-auto"
              style={{ fontFamily: "'Source Serif 4', serif", fontSize: '0.9rem', lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedMessage.content || '') }}
            />
          </div>
        </div>
      )}

    </div>
  )
}
