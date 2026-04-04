import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import Everett from './Everett.svelte'

// Some routeing shenanigans routing
const isAdmin = window.location.pathname === '/everett'

if (isAdmin) {
  mount(Everett, { target: document.getElementById('app')! })
} else {
  mount(App, { target: document.getElementById('app')! })
}

export default {}

// everything below only runs when NOT on the admin page

// make the logo rock back and forth and stuff

const amplitude = 4
const frequency = 0.0025

let animationFrameId: number | null = null
let rockingImg: HTMLImageElement | null = null

export function startRocking(imgElement: HTMLImageElement): void {
  rockingImg = imgElement
  if (animationFrameId !== null) return

  rockingImg.style.transformOrigin = "center"

  function animate(timestamp: number): void {
    if (rockingImg) {
      const rotation = amplitude * Math.sin(frequency * timestamp)
      rockingImg.style.transform = `rotate(${rotation}deg)`
    }
    animationFrameId = requestAnimationFrame(animate)
  }

  animationFrameId = requestAnimationFrame(animate)
}

export function stopRocking(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
    if (rockingImg) rockingImg.style.transform = "rotate(0deg)"
    rockingImg = null
  }
}

// cool exit animation for start screen and questions

export function playStartScreenExit(): void {
  const el: HTMLElement | null = document.getElementById('start-screen')
  if (!el) {
    console.error('no startscreen found brotato chip')
    return
  }
  el.classList.add('animate__rollOut')
}

export function playQuestionExit(): void {
  const el: HTMLElement | null = document.getElementById('quiz-question')
  if (!el) {
    console.error('no quiz question found brotato chip')
    return
  }
  el.classList.add('animate__rollOut')
}

// THREE js stuff for question marks

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// Declared at module level so exported functions can reference them,
// but only initialized when !isAdmin (quiz page only).
let scene!: THREE.Scene
let camera!: THREE.PerspectiveCamera
let renderer!: THREE.WebGLRenderer

let questionMarks: THREE.Group[] = []

const cartoonColors = [
  0xF8A663, // orange
  0xF063F8, // pink/purple which one is it?
  0x6BF863, // lime green
  0xF86363, // coral red
  0xF8F063, // yellow
  0x63F8E8, // mint NOT CYAN EVERETT IF YOU CHANGE THIS ONE MORE TIME
  0xF8C663, // golden yellow
]
const MIN_DISTANCE = 2
let colorQueue: number[] = []

function getNextColor(): number {
  if (colorQueue.length === 0) {
    colorQueue = [...cartoonColors].sort(() => Math.random() - 0.5)
  }
  return colorQueue.pop()!
}

const loader = new GLTFLoader()

let isLoading = true
let cachedGltfScene: THREE.Group | null = null

if (!isAdmin) {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x63B5F8)
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

  renderer = new THREE.WebGLRenderer()
  renderer.setClearColor(0x63B5F8)
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0x9bbfff, 0.6)
  scene.add(ambientLight)

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
  keyLight.position.set(5, 8, 5)
  scene.add(keyLight)

  camera.position.z = 4

  loader.load('/question_mark/questionmark.gltf', function (gltf) {
    isLoading = false
    cachedGltfScene = gltf.scene
  }, undefined, function (error) {
    isLoading = false
    console.error(error)
  })

  window.addEventListener('resize', () => {
    if (resizeTimeout !== null) clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      resizeTimeout = null
    }, 150)
  })

  renderer.setAnimationLoop(animate)

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      renderer.setAnimationLoop(null)
    } else {
      renderer.setAnimationLoop(animate)
    }
  })
}

function spawnQM(template: THREE.Group): void {
  const qm = template.clone()

  const box = new THREE.Box3().setFromObject(qm)
  const center = box.getCenter(new THREE.Vector3())
  qm.position.sub(center)

  const size = box.getSize(new THREE.Vector3())
  qm.scale.setScalar(2 / Math.max(size.x, size.y, size.z))

  const randomColor = getNextColor()
  qm.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = new THREE.MeshToonMaterial({ color: randomColor })
    }
  })

  const aspect = window.innerWidth / window.innerHeight
  const visibleHeight = 2 * Math.tan((75 * Math.PI) / 180 / 2) * camera.position.z
  const visibleWidth = visibleHeight * aspect

  let position: THREE.Vector3 = new THREE.Vector3()
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = new THREE.Vector3(
      (Math.random() - 0.5) * visibleWidth * 0.8,
      (Math.random() - 0.5) * visibleHeight * 0.8,
      0
    )

    position = candidate

    const tooClose = questionMarks.some(
      (existing) => existing.position.distanceTo(candidate) < MIN_DISTANCE
    )

    if (!tooClose) break
  }

  qm.position.copy(position)
  scene.add(qm)
  questionMarks.push(qm)
}

export function newRandQM(): void {
  if (isLoading) return

  if (cachedGltfScene) {
    spawnQM(cachedGltfScene)
    return
  }

  isLoading = true
  loader.load('/question_mark/questionmark.gltf', function (gltf) {
    isLoading = false
    cachedGltfScene = gltf.scene
    spawnQM(cachedGltfScene)
  }, undefined, function (error) {
    isLoading = false
    console.error(error)
  })
}

let resizeTimeout: ReturnType<typeof setTimeout> | null = null

// Cool sound effects

export function playDrumRoll(onEnd: () => void): void {
  const audio = new Audio('/sounds/drum-roll-gaming-sound-effect-hd.mp3')
  audio.play()
  audio.addEventListener('ended', onEnd)
}

export function playTaDa(): void {
  const audio = new Audio('/sounds/ta-da_yrvBrlS.mp3')
  audio.play()
}

// --- Make the question marks pop ---

interface PoppingQM {
  qm: THREE.Group
  startTime: number
  baseScale: number
}

let poppingQMs: PoppingQM[] = []

export function popAllQMs(): number {
  const now = performance.now()
  const count = questionMarks.length
  questionMarks.forEach((qm, i) => {
    qm.traverse(child => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshToonMaterial
        mat.transparent = true
        mat.depthWrite = false
      }
    })
    poppingQMs.push({ qm, startTime: now + i * 80, baseScale: qm.scale.x })
  })
  questionMarks = []
  return count > 0 ? (count - 1) * 80 + 400 : 0
}

// YAYAYA CONFETTI!!!1!1!!

interface ConfettiParticle {
  x: number; y: number
  vx: number; vy: number
  rotation: number; rotSpeed: number
  color: string
  w: number; h: number
}

let confettiCanvas: HTMLCanvasElement | null = null
let confettiCtx: CanvasRenderingContext2D | null = null
let confettiParts: ConfettiParticle[] = []
let confettiAnimId: number | null = null

const confettiColors = ['#F8A663','#F063F8','#6BF863','#F86363','#F8F063','#63F8E8','#F8C663','#ffffff']

export function startConfetti(): void {
  if (confettiCanvas) return
  confettiCanvas = document.createElement('canvas')
  confettiCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100'
  confettiCanvas.width = window.innerWidth
  confettiCanvas.height = window.innerHeight
  document.body.appendChild(confettiCanvas)
  confettiCtx = confettiCanvas.getContext('2d')!
  for (let i = 0; i < 160; i++) confettiParts.push(makeConfetti())
  confettiLoop()
}

function makeConfetti(): ConfettiParticle {
  return {
    x: Math.random() * window.innerWidth,
    y: Math.random() * -600,
    vx: (Math.random() - 0.5) * 5,
    vy: Math.random() * 3 + 2,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.15,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    w: Math.random() * 14 + 6,
    h: Math.random() * 7 + 4,
  }
}

function confettiLoop(): void {
  if (!confettiCtx || !confettiCanvas) return
  const ctx = confettiCtx
  const cv = confettiCanvas
  ctx.clearRect(0, 0, cv.width, cv.height)
  confettiParts.forEach(p => {
    p.x += p.vx
    p.y += p.vy
    p.rotation += p.rotSpeed
    if (p.y > cv.height + 20) {
      p.x = Math.random() * cv.width
      p.y = -20
      p.vy = Math.random() * 3 + 2
    }
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)
    ctx.fillStyle = p.color
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
    ctx.restore()
  })
  confettiAnimId = requestAnimationFrame(confettiLoop)
}

export function stopConfetti(): void {
  if (confettiAnimId !== null) {
    cancelAnimationFrame(confettiAnimId)
    confettiAnimId = null
  }
  if (confettiCanvas) {
    confettiCanvas.remove()
    confettiCanvas = null
    confettiCtx = null
    confettiParts = []
  }
}

// this is where the magic happens

function animate(time: number) {
  const now = performance.now()

  poppingQMs = poppingQMs.filter(({ qm, startTime, baseScale }) => {
    const elapsed = now - startTime
    if (elapsed < 0) return true
    const t = Math.min(elapsed / 400, 1)
    const scaleFactor = t < 0.5
      ? 1 + (t / 0.5) * 1.5
      : 2.5 * (1 - (t - 0.5) / 0.5)
    const opacity = t < 0.5 ? 1 : 1 - (t - 0.5) / 0.5
    qm.scale.setScalar(baseScale * Math.max(scaleFactor, 0.001))
    qm.traverse(child => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshToonMaterial).opacity = opacity
      }
    })
    if (t >= 1) {
      scene.remove(qm)
      return false
    }
    return true
  })

  questionMarks.forEach((qm, i) => {
    qm.rotation.y = time / 2000 + i
  })
  renderer.render(scene, camera)
}
