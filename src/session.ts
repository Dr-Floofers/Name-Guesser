export const SESSION_STORAGE_KEY = 'alp_session_id'

export interface QuizSession {
  id: string
  createdAt: number
  lastSeen: number
  questionIndex: number
  started: boolean
  showDrumRoll: boolean
  showResult: boolean
  nameOverride: string | null
}

export function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_STORAGE_KEY, id)
  }
  return id
}

export function getStatusLabel(session: QuizSession): string {
  if (!session.started) return 'Start screen'
  if (session.showResult) return 'Viewing results'
  if (session.showDrumRoll) return 'Drum roll...'
  return `Question ${session.questionIndex + 1} of 11`
}

export function getStatusColor(session: QuizSession): string {
  if (session.showResult) return '#6BF863'
  if (session.showDrumRoll) return '#F8F063'
  if (session.started) return '#63F8E8'
  return 'rgba(255,255,255,0.5)'
}
