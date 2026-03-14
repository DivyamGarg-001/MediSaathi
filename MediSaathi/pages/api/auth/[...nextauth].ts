import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { createClient } from '@supabase/supabase-js'

// Create a service role client that bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user profile exists in our custom users table
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single()

          if (existingUser) {
            // User already exists (e.g. signed up via email/password) — update Google profile info
            if (!existingUser.avatar_url && user.image) {
              await supabaseAdmin
                .from('users')
                .update({ avatar_url: user.image, updated_at: new Date().toISOString() })
                .eq('id', existingUser.id)
            }
            return true
          }

          // User doesn't exist in public.users — create profile
          let authUserId: string

          // Try to create a Supabase Auth user
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: user.email!,
            email_confirm: true,
            user_metadata: {
              full_name: user.name || '',
              avatar_url: user.image || '',
              provider: 'google',
            }
          })

          if (authError) {
            // If user already exists in auth.users (e.g. from email signup), find their ID
            if (authError.message?.includes('already been registered')) {
              const { data: { users: existingAuthUsers } } = await supabaseAdmin.auth.admin.listUsers()
              const found = existingAuthUsers?.find(u => u.email === user.email)
              if (!found) {
                console.error('Could not find existing auth user')
                return false
              }
              authUserId = found.id
            } else {
              console.error('Error creating auth user:', authError)
              return false
            }
          } else {
            authUserId = authUser.user.id
          }

          // Insert into the public users table
          const { error } = await supabaseAdmin
            .from('users')
            .insert({
              id: authUserId,
              email: user.email!,
              full_name: user.name || '',
              avatar_url: user.image || '',
              user_type: 'patient', // Default, will be updated
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (error) {
            console.error('Error creating user profile:', error)
            return false
          }

          return true
        } catch (error) {
          console.error('Sign-in error:', error)
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      // Add custom user data to session
      if (session?.user?.email) {
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single()

        if (userData) {
          session.user.userType = userData.user_type
          session.user.userId = userData.id
          session.user.fullName = userData.full_name
        }
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // If it's a sign-in redirect, go to the dashboard
      if (url === `${baseUrl}/api/auth/signin` || url === baseUrl) {
        return `${baseUrl}/dashboard`
      }
      
      // Custom redirect logic for other cases
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      
      if (url.startsWith(baseUrl)) {
        return url
      }
      
      // Default to dashboard for successful sign-ins
      return `${baseUrl}/dashboard`
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id
        token.email = user.email
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
})