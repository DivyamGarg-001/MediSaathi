import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"
import {
  Users,
  FileText,
  Activity,
  Upload,
  Calendar,
  Wallet,
  Bell,
  Shield,
  Brain,
  CheckCircle2,
  ArrowRight,
  Smartphone,
} from "lucide-react"

export default function PatientPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
                <Users className="size-4 text-primary" />
                <span>For Patients</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Manage Your Family's Health in One Place
              </h1>

              <p className="text-xl text-muted-foreground text-balance leading-relaxed">
                Store health records, track vitals, book appointments, and get AI-powered health insights for your
                entire family.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" asChild>
                  <Link href="/auth/signup">
                    Start Free Trial
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">View Features</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl border bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                <img
                  src="/modern-healthcare-mobile-app-interface.jpg"
                  alt="Patient Portal Interface"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section id="features" className="border-t bg-muted/30 py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">Patient Portal Features</h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Everything you need to manage your family's health effectively
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <Users className="size-10 text-primary mb-3" />
                  <CardTitle>Family Profiles</CardTitle>
                  <CardDescription>
                    Create and manage health profiles for each family member. Track individual health histories,
                    medications, and appointments.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Upload className="size-10 text-secondary mb-3" />
                  <CardTitle>Upload Reports</CardTitle>
                  <CardDescription>
                    Easily upload medical reports, prescriptions, and lab results. Our AI extracts data automatically
                    using OCR technology.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Activity className="size-10 text-accent mb-3" />
                  <CardTitle>Track Vitals</CardTitle>
                  <CardDescription>
                    Monitor blood pressure, glucose, weight, and other vitals over time. Visualize trends with
                    interactive charts.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <FileText className="size-10 text-primary mb-3" />
                  <CardTitle>View Prescriptions</CardTitle>
                  <CardDescription>
                    Access all past and current prescriptions in one place. Never lose a prescription again.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Calendar className="size-10 text-secondary mb-3" />
                  <CardTitle>Book Appointments</CardTitle>
                  <CardDescription>
                    Find doctors, check availability, and book appointments online. Get reminders before your visit.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Wallet className="size-10 text-accent mb-3" />
                  <CardTitle>Health Wallet</CardTitle>
                  <CardDescription>
                    Track all medical expenses, insurance claims, and payments. Manage your healthcare budget
                    efficiently.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Bell className="size-10 text-primary mb-3" />
                  <CardTitle>Smart Reminders</CardTitle>
                  <CardDescription>
                    Get automated reminders for medications, appointments, and follow-ups. Never miss important health
                    tasks.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Brain className="size-10 text-secondary mb-3" />
                  <CardTitle>AI Health Insights</CardTitle>
                  <CardDescription>
                    Receive personalized health recommendations and risk assessments powered by advanced AI algorithms.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="size-10 text-accent mb-3" />
                  <CardTitle>Emergency SOS</CardTitle>
                  <CardDescription>
                    Quick access to emergency contacts and critical health information when you need it most.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Premium vs Free */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">Choose Your Plan</h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Start free and upgrade when you need advanced features
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="text-2xl">Free Plan</CardTitle>
                  <CardDescription>Perfect for getting started</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Up to 3 family profiles</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Basic health records storage</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Vital tracking</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Basic appointment booking</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Medicine reminders</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <Link href="/auth/signup">Get Started Free</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="relative border-primary shadow-lg">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Popular
                  </span>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl">Premium Plan</CardTitle>
                  <CardDescription>Full access to all features</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">$9.99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Unlimited family profiles</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Unlimited storage for records</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>AI health insights & predictions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>OCR document extraction</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Health wallet & expense tracking</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Priority appointment booking</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>24/7 emergency SOS</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Priority customer support</span>
                    </li>
                  </ul>
                  <Button className="w-full" asChild>
                    <Link href="/auth/signup">Start Premium Trial</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* App Download CTA */}
        <section className="border-t bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h2 className="text-3xl md:text-4xl font-bold text-balance">Download the MediSaathi App</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Access your health records anytime, anywhere. Available on iOS and Android.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" variant="outline" className="justify-start bg-transparent">
                      <Smartphone className="mr-2 size-5" />
                      Download for iOS
                    </Button>
                    <Button size="lg" variant="outline" className="justify-start bg-transparent">
                      <Smartphone className="mr-2 size-5" />
                      Download for Android
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                    <img
                      src="/mobile-app-mockup-healthcare.jpg"
                      alt="MediSaathi Mobile App"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
