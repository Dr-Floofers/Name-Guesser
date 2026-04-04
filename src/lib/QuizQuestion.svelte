<script lang="ts">
  import { playQuestionExit } from '../main'

  const { title = '', answers = [], onAnswer }: {
    title?: string
    answers?: string[]
    onAnswer?: (index: number, value: string) => void
  } = $props()

  let selected = $state<number | null>(null)

  function choose(index: number) {
    selected = index
    playQuestionExit()
    onAnswer?.(index, answers[index])
  }
</script>

<div id="quiz-question" class="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 animate__animated animate__rollIn">
  <p
    class="text-white text-3xl md:text-4xl font-extrabold text-center leading-tight"
    style="font-family: 'Comic Sans MS', 'Comic Neue', 'Segoe UI', sans-serif;
           text-shadow: 4px 4px 0 rgba(0,0,0,0.45), -2px -2px 0 rgba(255,255,255,0.04);">
    {title}
  </p>

  <div class="grid grid-cols-2 gap-3 w-full max-w-xl">
    {#each answers as answer, i}
      <button
        onclick={() => choose(i)}
        class="px-6 py-3 rounded-lg font-extrabold text-white transition-all duration-150
               {selected === i
                 ? 'bg-[#d65b5b] scale-95 ring-4 ring-white/40'
                 : 'bg-[#eb6c6c] hover:bg-[#d65b5b]'}
               focus:outline-none"
        style="font-family: 'Comic Sans MS', 'Comic Neue', 'Segoe UI', sans-serif;">
        {answer}
      </button>
    {/each}
  </div>
</div>
