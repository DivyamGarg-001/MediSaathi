'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function DashboardPage() {
  const { user, loading, updateUserType } = useAuth()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Check if we need to update user type from localStorage (for Google OAuth)
    const handleUserTypeUpdate = async () => {
      const pendingUserType = localStorage.getItem('pendingUserType')
      
      if (pendingUserType && pendingUserType !== user.user_type && (pendingUserType === 'patient' || pendingUserType === 'doctor' || pendingUserType === 'hospital')) {
        setIsUpdating(true)
        setError(null)

        try {
          // Use the auth context's updateUserType method
          await updateUserType(pendingUserType as 'patient' | 'doctor' | 'hospital')
          
          // Clear the pending user type
          localStorage.removeItem('pendingUserType')
          
          // Redirect to appropriate dashboard
          router.push(`/${pendingUserType}/dashboard`)
        } catch (error) {
          console.error('Failed to update user type:', error)
          setError('Failed to update profile. Please try again.')
          
          // Clear pending type and fallback to current user type
          localStorage.removeItem('pendingUserType')
          
          // Wait a bit then redirect to current dashboard
          setTimeout(() => {
            router.push(`/${user.user_type}/dashboard`)
          }, 3000)
        }
        
        setIsUpdating(false)
      } else {
        // No pending update, redirect to current dashboard
        router.push(`/${user.user_type}/dashboard`)
      }
    }

    handleUserTypeUpdate()
  }, [user, loading, router, updateUserType])

  const handleRetry = () => {
    setError(null)
    window.location.reload()
  }

  const handleSkip = () => {
    localStorage.removeItem('pendingUserType')
    if (user) {
      router.push(`/${user.user_type}/dashboard`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-80">
          <CardContent className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold">Setup Error</h3>
                <p className="text-sm text-gray-600">Failed to complete account setup</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            
            <div className="flex space-x-3">
              <Button onClick={handleRetry} className="flex-1">
                Retry Setup
              </Button>
              <Button onClick={handleSkip} variant="outline" className="flex-1">
                Skip & Continue
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-3">
              Redirecting to your dashboard automatically in 3 seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isUpdating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-80">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Setting up your account...</h3>
            <p className="text-sm text-gray-600 text-center">
              We're configuring your profile and preparing your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}