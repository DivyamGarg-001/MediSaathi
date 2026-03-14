'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  full_name: string
  user_type: 'patient' | 'doctor' | 'hospital'
  avatar_url?: string
}

interface SignUpData {
  email: string
  password: string
  full_name: string
  user_type: 'patient' | 'doctor' | 'hospital'
  phone?: string
  specialty?: string
  license_number?: string
}

interface AuthResult {
  success: boolean
  error?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: () => void
  logout: () => void
  signInWithGoogle: () => void
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>
  signUpWithEmail: (data: SignUpData) => Promise<AuthResult>
  updateUserType: (userType: 'patient' | 'doctor' | 'hospital') => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Listen to NextAuth session (for Google OAuth)
  useEffect(() => {
    if (status === 'loading') return

    if (session?.user?.email) {
      const s = session.user as any
      // NextAuth session callback already enriched the session with userId/userType/fullName
      // (fetched server-side via supabaseAdmin in [...nextauth].ts) — use it directly
      // to avoid a client-side Supabase read that would fail RLS (no Supabase session for Google users)
      if (s.userId && s.userType) {
        setUser({
          id: s.userId,
          email: session.user.email,
          full_name: s.fullName || session.user.name || '',
          user_type: s.userType,
          avatar_url: session.user.image || undefined
        })
        setLoading(false)
      } else {
        fetchUserData(session.user.email)
      }
    } else if (status === 'unauthenticated') {
      // Only clear user if there's also no Supabase session
      supabase.auth.getSession().then(({ data: { session: supaSession } }) => {
        if (!supaSession) {
          setUser(null)
          setLoading(false)
        } else if (supaSession.user?.email) {
          // Supabase session exists (email/password user) — load their profile
          fetchUserData(supaSession.user.email)
        }
      })
    }
  }, [session, status])

  // Listen to Supabase auth state changes (for email/password)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, supaSession) => {
        if (event === 'SIGNED_IN' && supaSession?.user?.email) {
          await fetchUserData(supaSession.user.email)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const fetchUserData = async (email: string) => {
    try {
      let { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      // If no profile found, auto-create one (upsert to avoid duplicate collisions)
      if (error || !userData) {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          await supabase.from('users').upsert({
            id: authUser.id,
            email: email,
            full_name: email.split('@')[0],
            user_type: 'patient',
          }, { onConflict: 'id' })
          // Retry fetch after creating profile
          const retry = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()
          userData = retry.data
          error = retry.error
        }
      }

      if (error || !userData) {
        setUser(null)
      } else {
        setUser({
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          user_type: userData.user_type,
          avatar_url: userData.avatar_url
        })
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  const signInWithGoogle = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        return { success: false, error: error.message }
      }
      // fetchUserData will auto-create profile if needed (also called by onAuthStateChange)
      await fetchUserData(email)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Sign in failed' }
    }
  }

  const signUpWithEmail = async (data: SignUpData): Promise<AuthResult> => {
    try {
      // Use server-side API route (service role key) to create user + profile
      // This bypasses RLS and auto-confirms the email
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          full_name: data.full_name,
          user_type: data.user_type,
          phone: data.phone || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Sign up failed' }
      }

      // Now sign in with the newly created credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        return { success: false, error: signInError.message }
      }

      await fetchUserData(data.email)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Sign up failed' }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    await signOut({ callbackUrl: '/auth/signin' })
    setUser(null)
  }

  const updateUserType = async (userType: 'patient' | 'doctor' | 'hospital') => {
    if (!user) return

    try {
      // Use the profile API route (supabaseAdmin server-side) so it works for both
      // Google OAuth users (no Supabase session) and email/password users
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_type: userType }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to update user type')
      }

      // Update local state
      setUser(prev => prev ? { ...prev, user_type: userType } : null)

      // Redirect to dashboard after updating user type
      router.push('/dashboard')
    } catch (error) {
      console.error('Error in updateUserType:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    updateUserType
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}