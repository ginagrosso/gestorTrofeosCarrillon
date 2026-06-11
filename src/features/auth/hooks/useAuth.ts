import { useContext } from 'react'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '@/shared/config/firebase'
import { AuthContext } from '@/shared/lib/auth-context'

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }

  const login = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password)

  const logout = () => signOut(auth)

  return { ...context, login, logout }
}
