// I found this online.

export const SESSION_STORAGE_KEY = 'alp_session_id'
export const LOCAL_STORAGE_KEY = 'alp_sessions'
export const CHANNEL_NAME = 'alp_quiz_channel'

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

export type ChannelMessage =
  | { type: 'sessionUpdate'; sessionId: string }
  | { type: 'sessionEnd'; sessionId: string }
  | { type: 'nameUpdate'; sessionId: string; name: string | null }
  | { type: 'signal'; sessionId: string }
  | { type: 'signalOff'; sessionId: string }
  | { type: 'adminPresence' }
  | { type: 'adminPing' }
  | { type: 'adminGone' }
  | { type: 'adminJoined' }

export function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_STORAGE_KEY, id)
  }
  return id
}

export function getAllSessions(): QuizSession[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as QuizSession[]) : []
  } catch {
    return []
  }
}

export function upsertSession(session: QuizSession): void {
  const sessions = getAllSessions()
  const idx = sessions.findIndex(s => s.id === session.id)
  if (idx >= 0) {
    sessions[idx] = session
  } else {
    sessions.push(session)
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions))
}

export function deleteSession(id: string): void {
  const sessions = getAllSessions().filter(s => s.id !== id)
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions))
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
