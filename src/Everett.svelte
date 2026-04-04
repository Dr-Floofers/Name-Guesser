<script lang="ts">
  import {
    getAllSessions, upsertSession,
    getStatusLabel, getStatusColor, CHANNEL_NAME,
    type QuizSession, type ChannelMessage
  } from './session'

  const STALE_MS = 5 * 60 * 1000
  const HEARTBEAT_INTERVAL = 3000

  let sessions = $state<QuizSession[]>(getAllSessions())
  let nameInputs = $state<Record<string, string>>({})
  let signals = $state(new Set<string>())
  const signalTimeouts: Record<string, ReturnType<typeof setTimeout>> = {}

  function isStale(session: QuizSession): boolean {
    return Date.now() - session.lastSeen > STALE_MS
  }

  function syncInputs(sess: QuizSession[]) {
    for (const s of sess) {
      if (!(s.id in nameInputs)) {
        nameInputs[s.id] = s.nameOverride ?? 'John Smith'
      }
    }
  }

  syncInputs(getAllSessions())

  const channel = new BroadcastChannel(CHANNEL_NAME)

  function sendHeartbeat() {
    channel.postMessage({ type: 'adminPresence' } satisfies ChannelMessage)
  }

  sendHeartbeat()
  setInterval(sendHeartbeat, HEARTBEAT_INTERVAL)

  channel.postMessage({ type: 'adminJoined' } satisfies ChannelMessage)

  window.addEventListener('beforeunload', () => {
    channel.postMessage({ type: 'adminGone' } satisfies ChannelMessage)
  })

  channel.addEventListener('message', (e: MessageEvent<ChannelMessage>) => {
    const msg = e.data

    if (msg.type === 'sessionUpdate' || msg.type === 'sessionEnd') {
      const updated = getAllSessions()
      syncInputs(updated)
      sessions = updated

    } else if (msg.type === 'adminPing') {
      sendHeartbeat()

    } else if (msg.type === 'signal') {
      if (signalTimeouts[msg.sessionId]) clearTimeout(signalTimeouts[msg.sessionId])
      signalTimeouts[msg.sessionId] = setTimeout(() => {
        signals = new Set([...signals].filter(id => id !== msg.sessionId))
        delete signalTimeouts[msg.sessionId]
      }, 5000)
      signals = new Set([...signals, msg.sessionId])

    } else if (msg.type === 'signalOff') {
      if (signalTimeouts[msg.sessionId]) clearTimeout(signalTimeouts[msg.sessionId])
      delete signalTimeouts[msg.sessionId]
      signals = new Set([...signals].filter(id => id !== msg.sessionId))
    }
  })

  setInterval(() => {
    const updated = getAllSessions()
    syncInputs(updated)
    sessions = updated
  }, 5000)

  function setName(sessionId: string) {
    const name = (nameInputs[sessionId] ?? '').trim() || 'John Smith'
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return
    const nameOverride = name === 'John Smith' ? null : name
    upsertSession({ ...session, nameOverride })
    sessions = getAllSessions()
    channel.postMessage({ type: 'nameUpdate', sessionId, name: nameOverride } satisfies ChannelMessage)
  }

  function shortId(id: string) {
    return id.slice(0, 8).toUpperCase()
  }
</script>

<div
  class="min-h-screen w-full flex flex-col items-center py-12 px-4"
  style="background: #63B5F8; font-family: 'Comic Sans MS', 'Comic Neue', cursive;"
>
  <div class="text-center mb-10">
    <h1
      class="text-white font-extrabold"
      style="font-size: clamp(2rem, 8vw, 3.5rem);
             text-shadow: 4px 4px 0 rgba(0,0,0,0.4), -2px -2px 0 rgba(255,255,255,0.04);"
    >
      Everett Panel
    </h1>
    <p
      class="text-white text-lg mt-2"
      style="opacity: 0.8; text-shadow: 2px 2px 0 rgba(0,0,0,0.3);"
    >
      If your not Everett you shouldn't be here
    </p>
  </div>

  {#if sessions.length === 0}
    <div
      class="text-center mt-8"
      style="color: rgba(255,255,255,0.75); text-shadow: 2px 2px 0 rgba(0,0,0,0.3);"
    >
      <p class="text-2xl font-extrabold">No active sessions</p>
      <p class="text-base mt-2" style="opacity: 0.7;">
        Its kinda boring here :(
      </p>
    </div>
  {:else}
    <div class="w-full max-w-2xl flex flex-col gap-4">
      {#each sessions as session (session.id)}
        {@const stale = isStale(session)}
        {@const signaling = signals.has(session.id)}
        <div
          class="rounded-2xl p-6 flex flex-col gap-4"
          style="background: rgba(255,255,255,0.18);
                 border: 2px solid rgba(255,255,255,0.4);
                 transition: opacity 0.4s, filter 0.4s;
                 {stale ? 'opacity: 0.4; filter: grayscale(0.65);' : ''}"
        >
          <div class="flex items-center gap-3">
            <div
              style="width: 12px; height: 12px; border-radius: 50%;
                     background: {signaling ? '#4ade80' : 'transparent'};
                     border: 2px solid {signaling ? '#4ade80' : 'rgba(255,255,255,0.3)'};
                     box-shadow: {signaling ? '0 0 8px #4ade80, 0 0 16px #4ade8088' : 'none'};
                     transition: background 0.1s, box-shadow 0.1s;"
            ></div>
            <span
              class="text-white font-extrabold text-lg"
              style="text-shadow: 2px 2px 0 rgba(0,0,0,0.3);"
            >
              Session {shortId(session.id)}
              {#if stale}
                <span class="text-sm font-normal opacity-60">(afk)</span>
              {/if}
            </span>
          </div>

          <div>
            <span
              class="text-sm font-extrabold px-3 py-1 rounded-full"
              style="background: {getStatusColor(session)}; color: #222; text-shadow: none;"
            >
              {getStatusLabel(session)}
            </span>
          </div>

          <div class="flex flex-col gap-2">
            <label
              for="name-input-{session.id}"
              class="text-white text-sm font-bold"
              style="text-shadow: 1px 1px 0 rgba(0,0,0,0.3); opacity: 0.85;"
            >
              Name:
            </label>
            <div class="flex gap-2">
              <input
                id="name-input-{session.id}"
                type="text"
                bind:value={nameInputs[session.id]}
                placeholder="John Smith"
                class="flex-1 px-4 py-2 rounded-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
                style="font-family: 'Comic Sans MS', 'Comic Neue', cursive;
                       background: rgba(255,255,255,0.92);"
                onkeydown={(e) => { if (e.key === 'Enter') setName(session.id) }}
              />
              <button
                onclick={() => setName(session.id)}
                class="px-5 py-2 rounded-lg font-extrabold text-white bg-[#eb6c6c] hover:bg-[#d65b5b] focus:outline-none"
                style="font-family: 'Comic Sans MS', 'Comic Neue', cursive;"
              >
                Set
              </button>
            </div>
            {#if session.nameOverride}
              <p
                class="text-white text-xs"
                style="opacity: 0.65; text-shadow: 1px 1px 0 rgba(0,0,0,0.3);"
              >
                Currently set to: <strong>{session.nameOverride}</strong>
              </p>
            {:else}
              <p
                class="text-white text-xs"
                style="opacity: 0.65; text-shadow: 1px 1px 0 rgba(0,0,0,0.3);"
              >
                Currently set to: <strong>John Smith</strong>
              </p>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
