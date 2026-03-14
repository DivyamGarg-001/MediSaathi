'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import Link from 'next/link'
import { Activity, Eye, EyeOff } from 'lucide-react'

export default function SignUpPage() {
  const { signInWithGoogle, signUpWithEmail } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('patient')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleGoogleSignIn = () => {
    localStorage.setItem('pendingUserType', activeTab)
    signInWithGoogle()
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const result = await signUpWithEmail({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      full_name: formData.get('name') as string,
      user_type: activeTab as 'patient' | 'doctor' | 'hospital',
      specialty: activeTab === 'doctor' ? formData.get('specialty') as string : undefined,
      license_number: activeTab !== 'patient' ? formData.get('license') as string : undefined,
    })

    if (!result.success) {
      setError(result.error || 'Failed to create account')
    } else {
      router.push(`/${activeTab}/dashboard`)
    }

    setIsLoading(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center py-12 bg-muted/30">
        <div className="w-full max-w-md px-4">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center size-12 rounded-lg bg-primary text-primary-foreground">
                  <Activity className="size-8" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
              <CardDescription className="text-center">Choose your account type to get started</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="patient">Patient</TabsTrigger>
                  <TabsTrigger value="doctor">Doctor</TabsTrigger>
                  <TabsTrigger value="hospital">Hospital</TabsTrigger>
                </TabsList>

                <form onSubmit={handleSignUp}>
                  <TabsContent value="patient" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input name="name" id="name" placeholder="John Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input name="email" id="email" type="email" placeholder="m@example.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input name="password" id="password" type={showPassword ? 'text' : 'password'} minLength={6} required />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : 'Create Patient Account'}
                    </Button>
                  </TabsContent>

                  <TabsContent value="doctor" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="doc-name">Full Name</Label>
                      <Input name="name" id="doc-name" placeholder="Dr. John Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specialty">Specialty</Label>
                      <Input name="specialty" id="specialty" placeholder="Cardiologist" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doc-email">Email</Label>
                      <Input name="email" id="doc-email" type="email" placeholder="dr@hospital.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license">Medical License</Label>
                      <Input name="license" id="license" placeholder="MD-123456" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doc-password">Password</Label>
                      <div className="relative">
                        <Input name="password" id="doc-password" type={showPassword ? 'text' : 'password'} minLength={6} required />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : 'Create Doctor Account'}
                    </Button>
                  </TabsContent>

                  <TabsContent value="hospital" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="hosp-name">Hospital Name</Label>
                      <Input name="name" id="hosp-name" placeholder="City General Hospital" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hosp-email">Admin Email</Label>
                      <Input name="email" id="hosp-email" type="email" placeholder="admin@hospital.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hosp-license">Hospital License</Label>
                      <Input name="license" id="hosp-license" placeholder="HOSP-123456" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hosp-password">Password</Label>
                      <div className="relative">
                        <Input name="password" id="hosp-password" type={showPassword ? 'text' : 'password'} minLength={6} required />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : 'Create Hospital Account'}
                    </Button>
                  </TabsContent>
                </form>
              </Tabs>

              <div className="mt-6 relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
