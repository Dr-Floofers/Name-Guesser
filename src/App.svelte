<script lang="ts">
  import 'animate.css'
  import logo from './assets/logo.svg'
  import Question from './lib/QuizQuestion.svelte';
  import TextQuestion from './lib/QuizTextQuestion.svelte';
  import { startRocking, playStartScreenExit, newRandQM, popAllQMs, startConfetti, stopConfetti, playDrumRoll, playTaDa } from './main'
  import { getSessionId, getAllSessions, upsertSession, deleteSession, CHANNEL_NAME, type ChannelMessage } from './session'

  let started = $state(false)
  let showDrumRoll = $state(false)
  let showResult = $state(false)
  let logoImg = $state<HTMLImageElement | undefined>(undefined)
  let pickedAnswers = $state<{ index: number; value: string }[]>([])
  let questionIndex = $state(0)

  const sessionId = getSessionId()
  const existingSession = getAllSessions().find(s => s.id === sessionId)
  const sessionCreatedAt = existingSession?.createdAt ?? Date.now()
  let nameOverride = $state<string | null>(existingSession?.nameOverride ?? null)
  let displayName = $derived(nameOverride ?? 'John Smith')

  const channel = new BroadcastChannel(CHANNEL_NAME)

  let adminOnline = $state(false)
  let adminTimeoutId: ReturnType<typeof setTimeout> | null = null
  const ADMIN_TIMEOUT_MS = 7000

  function resetAdminTimer() {
    if (adminTimeoutId) clearTimeout(adminTimeoutId)
    adminOnline = true
    adminTimeoutId = setTimeout(() => { adminOnline = false }, ADMIN_TIMEOUT_MS)
  }

  channel.postMessage({ type: 'adminPing' } satisfies ChannelMessage)

  channel.addEventListener('message', (e: MessageEvent<ChannelMessage>) => {
    if (e.data.type === 'nameUpdate' && e.data.sessionId === sessionId) {
      nameOverride = e.data.name
    } else if (e.data.type === 'adminPresence') {
      resetAdminTimer()
    } else if (e.data.type === 'adminGone') {
      if (adminTimeoutId) clearTimeout(adminTimeoutId)
      if (!started) adminOnline = false
    } else if (e.data.type === 'adminJoined') {
      channel.postMessage({ type: 'sessionUpdate', sessionId } satisfies ChannelMessage)
    }
  })

  setInterval(() => {
    const current = getAllSessions().find(s => s.id === sessionId)
    if (current) {
      upsertSession({ ...current, lastSeen: Date.now() })
      channel.postMessage({ type: 'sessionUpdate', sessionId } satisfies ChannelMessage)
    }
  }, 30_000)

  window.addEventListener('keydown', (e) => {
    if (e.key === '=' && !e.repeat &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
      channel.postMessage({ type: 'signal', sessionId } satisfies ChannelMessage)
    }
  })
  window.addEventListener('keyup', (e) => {
    if (e.key === '=') {
      channel.postMessage({ type: 'signalOff', sessionId } satisfies ChannelMessage)
    }
  })

  window.addEventListener('beforeunload', () => {
    deleteSession(sessionId)
    channel.postMessage({ type: 'sessionEnd', sessionId } satisfies ChannelMessage)
    channel.close()
  })

  $effect(() => {
    upsertSession({
      id: sessionId,
      createdAt: sessionCreatedAt,
      lastSeen: Date.now(),
      questionIndex,
      started,
      showDrumRoll,
      showResult,
      nameOverride
    })
    channel.postMessage({ type: 'sessionUpdate', sessionId } satisfies ChannelMessage)
  })

  $effect(() => {
    if (!started && logoImg) startRocking(logoImg)
  })

  function start() {
    playStartScreenExit()
    setTimeout(() => {
      started = true
      newRandQM()
    }, 1000)
  }

  const LAST_QUESTION = 10

  function onAnswer(index: number, value: string) {
    pickedAnswers = [...pickedAnswers, { index, value }]
    setTimeout(() => {
      questionIndex++
      if (questionIndex > LAST_QUESTION) {
        const popDuration = popAllQMs()
        setTimeout(() => {
          showDrumRoll = true
          playDrumRoll(() => {
            const latest = getAllSessions().find(s => s.id === sessionId)
            if (latest?.nameOverride !== undefined) nameOverride = latest.nameOverride
            showResult = true
            startConfetti()
            playTaDa()
          })
        }, popDuration)
      } else {
        newRandQM()
      }
    }, 1000)
  }

  function restart() {
    stopConfetti()
    showDrumRoll = false
    showResult = false
    questionIndex = 0
    pickedAnswers = []
    started = false
  }
</script>

{#if !started}
  <div class="absolute inset-0 flex flex-col items-center justify-center animate__animated animate__rollIn" id="start-screen">
    <img bind:this={logoImg} src={logo} alt="Logo" width="900px" />
    <div class="text-center">
      <p class="text-white text-2xl md:text-3xl font-extrabold leading-tight"
        style="font-family: 'Comic Sans MS', 'Comic Neue', 'Segoe UI', sans-serif; text-shadow: 4px 4px 0 rgba(0,0,0,0.45), -2px -2px 0 rgba(255,255,255,0.04);">
        Lets see if we can guess your name!
      </p>

      <button
        onclick={start}
        disabled={!adminOnline}
        class="mt-17 px-8 py-3 rounded-lg font-extrabold text-white bg-[#eb6c6c] hover:bg-[#d65b5b] focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#eb6c6c]"
        aria-label="Start quiz">
        Start
      </button>
    </div>
  </div>
{:else if questionIndex === 0}
  <Question
    title="What most represents you right now?"
    answers={["Happy", "Sad", "Confused", "Hungry"]}
    {onAnswer}
  />
{:else if questionIndex === 1}
  <Question
    title="How many siblings do you have?"
    answers={["0", "1", "2", "3 or more"]}
    {onAnswer}
  />
{:else if questionIndex === 2}
  <TextQuestion
    title="What's your favorite book?"
    {onAnswer}
  />
{:else if questionIndex === 3}
  <Question
    title="Do you game?"
    answers={["Yes :)", "No :("]}
    {onAnswer}
  />
{:else if questionIndex === 4}
  <TextQuestion
    title="What's your favorite food?"
    {onAnswer}
  />
{:else if questionIndex === 5}
  <TextQuestion
    title="What time do you wake up?"
    {onAnswer}
  />
{:else if questionIndex === 6}
  <Question
    title="Which type of cheese is better?"
    answers={["Yellow", "White", "Moldy", "I dont eat cheese 😏🤥"]}
    {onAnswer}
  />
{:else if questionIndex === 7}
  <Question
    title="What's your favorite Family Guy character?"
    answers={["Peter", "Quagmire", "Cleveland", "Joe"]}
    {onAnswer}
  />
{:else if questionIndex === 8}
  <Question
    title="Are you a teacher?"
    answers={["Yes", "No"]}
    {onAnswer}
  />
{:else if questionIndex === 9}
  <TextQuestion
    title="If you got a pet parrot what would its name be?"
    {onAnswer}
  />
{:else if questionIndex === 10}
  <Question
    title="Do you have carpet in your bedroom?"
    answers={["Yes", "No"]}
    {onAnswer}
  />
{:else if showDrumRoll || showResult}
  <div class="absolute inset-0 flex flex-col items-center justify-center gap-6 animate__animated animate__rollIn">
    <p
      class="text-white text-3xl md:text-4xl font-extrabold text-center leading-tight"
      style="font-family: 'Comic Sans MS', 'Comic Neue', 'Segoe UI', sans-serif;
             text-shadow: 4px 4px 0 rgba(0,0,0,0.45), -2px -2px 0 rgba(255,255,255,0.04);
             transition: transform 0.6s ease-in-out;
             transform: translateY({showResult ? '-1rem' : '0'});">
      Your name is...
    </p>
    {#if showResult}
      <div class="flex flex-col items-center gap-8 animate__animated animate__zoomIn">
        <p
          class="text-white font-extrabold text-center select-none"
          style="font-family: 'Comic Sans MS', 'Comic Neue', cursive;
                 font-size: clamp(3rem, 10vw, 6rem);
                 text-shadow: 6px 6px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000,
                              0 10px 0 rgba(0,0,0,0.25);
                 letter-spacing: 0.05em;">
          {displayName}
        </p>
        <button
          onclick={restart}
          class="px-6 py-3 rounded-lg font-extrabold text-white bg-[#eb6c6c] hover:bg-[#d65b5b] focus:outline-none"
          style="font-family: 'Comic Sans MS', 'Comic Neue', 'Segoe UI', sans-serif;">
          Try Again?
        </button>
      </div>
    {/if}
  </div>
{/if}
