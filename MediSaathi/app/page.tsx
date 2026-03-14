import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"
import {
  Users,
  Building2,
  Stethoscope,
  FileText,
  Brain,
  Bell,
  Wallet,
  AlertCircle,
  Upload,
  Calendar,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-20 md:py-28">
          <div className="mx-auto max-w-5xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
              <Sparkles className="size-4 text-primary" />
              <span className="text-balance">AI-Powered Healthcare Management</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
              Your Smart Health Companion
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto text-balance leading-relaxed">
              Connect patients, doctors, and hospitals on one unified platform. Manage health records, book
              appointments, and access AI medical insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild className="text-base">
                <Link href="/auth/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base bg-transparent">
                <Link href="/features">View Features</Link>
              </Button>
            </div>
          </div>

          <div className="mt-16 rounded-2xl border bg-muted/30 p-2 md:p-4">
            <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
              <img
                src="/modern-healthcare-dashboard-interface-with-charts-.jpg"
                alt="MediSaathi Dashboard Preview"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>
        </section>

        {/* What is MediSaathi */}
        <section className="border-t bg-muted/30 py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">What is MediSaathi?</h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                A unified digital platform that revolutionizes healthcare management by connecting all stakeholders with
                intelligent features and seamless communication.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
                    <Users className="size-8 text-primary" />
                  </div>
                  <CardTitle className="mt-4">For Patients</CardTitle>
                  <CardDescription>
                    Manage family health records, track vitals, book appointments, and access AI health insights
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary/10">
                    <Stethoscope className="size-8 text-secondary" />
                  </div>
                  <CardTitle className="mt-4">For Doctors</CardTitle>
                  <CardDescription>
                    Access patient history, create e-prescriptions, view AI summaries, and manage appointments
                    efficiently
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent/10">
                    <Building2 className="size-8 text-accent" />
                  </div>
                  <CardTitle className="mt-4">For Hospitals</CardTitle>
                  <CardDescription>
                    Manage doctors, appointments, analytics, and streamline hospital operations
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Overview */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">Powerful Features</h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Everything you need to manage healthcare in one intelligent platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <FileText className="size-8 text-primary mb-2" />
                  <CardTitle>Family Health Records</CardTitle>
                  <CardDescription>
                    Store and manage health records for your entire family in one secure place
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Brain className="size-8 text-secondary mb-2" />
                  <CardTitle>AI Medical Insights</CardTitle>
                  <CardDescription>
                    Get AI-powered symptom analysis, risk predictions, and health summaries
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Upload className="size-8 text-accent mb-2" />
                  <CardTitle>OCR Document Scanning</CardTitle>
                  <CardDescription>
                    Extract data from medical reports automatically with intelligent OCR
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Calendar className="size-8 text-primary mb-2" />
                  <CardTitle>Appointment Booking</CardTitle>
                  <CardDescription>Book and manage appointments with doctors seamlessly online</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Bell className="size-8 text-secondary mb-2" />
                  <CardTitle>Smart Reminders</CardTitle>
                  <CardDescription>
                    Never miss medications or appointments with intelligent notifications
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Wallet className="size-8 text-accent mb-2" />
                  <CardTitle>Health Wallet</CardTitle>
                  <CardDescription>Track medical expenses and manage healthcare finances efficiently</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <AlertCircle className="size-8 text-destructive mb-2" />
                  <CardTitle>Emergency SOS</CardTitle>
                  <CardDescription>Quick access to emergency contacts and critical health information</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="size-8 text-primary mb-2" />
                  <CardTitle>Secure & Private</CardTitle>
                  <CardDescription>
                    Enterprise-grade security with encrypted data storage and HIPAA compliance
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="size-8 text-secondary mb-2" />
                  <CardTitle>Real-time Sync</CardTitle>
                  <CardDescription>
                    Access your health data anywhere, anytime with cloud synchronization
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="border-t bg-muted/30 py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">How It Works</h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Get started with MediSaathi in three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="relative">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                    1
                  </div>
                  <h3 className="text-xl font-semibold">Create Account</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Sign up and create profiles for your family members in minutes
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-2xl font-bold">
                    2
                  </div>
                  <h3 className="text-xl font-semibold">Add Health Data</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Upload medical records, prescriptions, and track vitals regularly
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground text-2xl font-bold">
                    3
                  </div>
                  <h3 className="text-xl font-semibold">Access AI Insights</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Get personalized health insights and book appointments with doctors
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">What Our Users Say</h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Trusted by thousands of patients, doctors, and healthcare providers
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <CheckCircle2 key={i} className="size-5 text-primary fill-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    "MediSaathi has transformed how I manage my family's health. The AI insights are incredibly
                    accurate!"
                  </p>
                  <div>
                    <p className="font-semibold">Priya Sharma</p>
                    <p className="text-sm text-muted-foreground">Patient, Mumbai</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <CheckCircle2 key={i} className="size-5 text-primary fill-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    "As a doctor, this platform saves me hours every day. Patient history at my fingertips!"
                  </p>
                  <div>
                    <p className="font-semibold">Dr. Rajesh Kumar</p>
                    <p className="text-sm text-muted-foreground">Cardiologist, Delhi</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <CheckCircle2 key={i} className="size-5 text-primary fill-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    "Our hospital efficiency improved by 40% after implementing MediSaathi. Highly recommended!"
                  </p>
                  <div>
                    <p className="font-semibold">Dr. Anita Desai</p>
                    <p className="text-sm text-muted-foreground">Hospital Admin, Pune</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">
                Ready to Transform Your Healthcare Experience?
              </h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Join thousands of users who trust MediSaathi for their health management
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" asChild className="text-base">
                  <Link href="/auth/signup">
                    Start Free Trial
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base bg-transparent">
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
