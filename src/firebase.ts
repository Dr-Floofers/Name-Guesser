import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyDDWIxJ5EObohy4hIOGfqnf23ooJrzk8yY",
  authDomain: "name-guesser-alp.firebaseapp.com",
  databaseURL: "https://name-guesser-alp-default-rtdb.firebaseio.com",
  projectId: "name-guesser-alp",
  storageBucket: "name-guesser-alp.firebasestorage.app",
  messagingSenderId: "212250011060",
  appId: "1:212250011060:web:b153e61c1941d56841bee1"
}

export const db = getDatabase(initializeApp(firebaseConfig))
