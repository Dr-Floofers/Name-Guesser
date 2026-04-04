<script lang="ts">
  import { playQuestionExit } from '../main'

  const { title = '', onAnswer }: {
    title?: string
    onAnswer?: (index: number, value: string) => void
  } = $props()

  let input = $state('')
  let submitted = $state(false)

  function submit() {
    if (!input.trim() || submitted) return
    submitted = true
    playQuestionExit()
    onAnswer?.(0, input.trim())
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') submit()
  }
</script>

<div id="quiz-question" class="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 animate__animated animate__rollIn">
  <p
    class="text-white text-3xl md:text-4xl font-extrabold text-center leading-tight"
    style="font-family: 'Comic Sans MS', 'Comic Neue', 'Segoe UI', sans-serif;
           text-shadow: 4px 4px 0 rgba(0,0,0,0.45), -2px -2px 0 rgba(255,255,255,0.04);">
    {title}
  </p>

  <div class="flex gap-3 w-full max-w-xl">
    <input
      type="text"
      bind:value={input}
      onkeydown={onKeydown}
      disabled={submitted}
      placeholder="Type your answer..."
      class="flex-1 px-6 py-3 rounded-lg font-extrabold text-white bg-[#eb6c6c] placeholder-white/60
             focus:outline-none focus:ring-4 focus:ring-white/40 disabled:opacity-60"
      style="font-family: 'Comic Sans MS', 'Comic Neue', 'Segoe UI', sans-serif;" />
    <button
      onclick={submit}
      disabled={submitted || !input.trim()}
      class="px-6 py-3 rounded-lg font-extrabold text-white transition-all duration-150
             {submitted
               ? 'bg-[#d65b5b] scale-95 ring-4 ring-white/40'
               : 'bg-[#eb6c6c] hover:bg-[#d65b5b]'}
             focus:outline-none disabled:opacity-60"
      style="font-family: 'Comic Sans MS', 'Comic Neue', 'Segoe UI', sans-serif;">
      Submit!
    </button>
  </div>
</div>
