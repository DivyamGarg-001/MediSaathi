import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"
import {
  FileText,
  Brain,
  Upload,
  Calendar,
  Bell,
  Wallet,
  AlertCircle,
  Shield,
  Zap,
  Users,
  Stethoscope,
  Building2,
  Camera,
  MessageSquare,
  Phone,
  Video,
  BarChart3,
  Activity,
  Heart,
  Thermometer,
  Weight,
  Clock,
  CheckCircle2,
  Star,
  Globe,
  Languages,
  Smartphone,
  ArrowRight,
  Sparkles,
} from "lucide-react"

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-20 md:py-28">
          <div className="mx-auto max-w-5xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
              <Sparkles className="size-4 text-primary" />
              <span>Complete Healthcare Solution</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
              Powerful Features for Modern Healthcare
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto text-balance leading-relaxed">
              Discover all the innovative features that make MediSaathi the most comprehensive healthcare management platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild className="text-base">
                <Link href="/auth/signup">
                  Try All Features Free
                  <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base bg-transparent">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="border-t bg-muted/30 py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">Core Features</h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Essential healthcare management tools for everyone
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="card-hover">
                <CardHeader>
                  <div className="p-3 bg-primary/10 rounded-lg w-fit">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Family Health Records</CardTitle>
                  <CardDescription>
                    Centralized digital health records for your entire family. Store medical history, prescriptions, 
                    lab results, and more in one secure, easily accessible location.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Unlimited storage for medical documents
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Secure cloud synchronization
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Easy sharing with healthcare providers
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="p-3 bg-secondary/10 rounded-lg w-fit">
                    <Brain className="h-8 w-8 text-secondary" />
                  </div>
                  <CardTitle className="mt-4">AI Medical Insights</CardTitle>
                  <CardDescription>
                    Advanced AI analyzes your health data to provide personalized insights, risk assessments, 
                    and early warnings for potential health issues.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Symptom analysis and recommendations
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Risk prediction models
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Personalized health summaries
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="p-3 bg-accent/10 rounded-lg w-fit">
                    <Upload className="h-8 w-8 text-accent" />
                  </div>
                  <CardTitle className="mt-4">OCR Document Scanning</CardTitle>
                  <CardDescription>
                    Intelligent document recognition automatically extracts and organizes data from medical reports, 
                    prescriptions, and test results.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Automatic data extraction
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Support for multiple languages
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      High accuracy recognition
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="p-3 bg-blue-100 rounded-lg w-fit">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="mt-4">Smart Appointment Booking</CardTitle>
                  <CardDescription>
                    Find doctors, check real-time availability, book appointments instantly, and manage your 
                    healthcare schedule efficiently.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Real-time doctor availability
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Automated reminders
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Telemedicine integration
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="p-3 bg-green-100 rounded-lg w-fit">
                    <Wallet className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="mt-4">Health Wallet</CardTitle>
                  <CardDescription>
                    Track medical expenses, manage insurance claims, and maintain a comprehensive 
                    overview of your healthcare spending.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Expense tracking and categorization
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Insurance claim management
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Budget alerts and insights
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="p-3 bg-red-100 rounded-lg w-fit">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <CardTitle className="mt-4">Emergency SOS</CardTitle>
                  <CardDescription>
                    Quick access to emergency contacts, critical health information, and immediate 
                    assistance when you need it most.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      One-tap emergency calling
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Critical health info sharing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Location-based emergency services
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Health Monitoring */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">Health Monitoring & Analytics</h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Advanced health tracking and data visualization tools
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Activity className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Vital Signs Tracking</h3>
                        <p className="text-sm text-muted-foreground">Monitor blood pressure, heart rate, and more</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-secondary/10 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Health Analytics</h3>
                        <p className="text-sm text-muted-foreground">Comprehensive health trends and insights</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <Bell className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Smart Reminders</h3>
                        <p className="text-sm text-muted-foreground">Never miss medications or appointments</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="relative">
                <div className="aspect-square rounded-2xl border bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                  <img
                    src="/modern-healthcare-dashboard-interface-with-charts-.jpg"
                    alt="Health Analytics Dashboard"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Professional Features */}
        <section className="border-t bg-muted/30 py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">For Healthcare Professionals</h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Advanced tools for doctors and hospitals to improve patient care
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border bg-secondary/10 px-4 py-1.5 text-sm mb-6">
                  <Stethoscope className="size-4 text-secondary" />
                  <span>For Doctors</span>
                </div>

                <div className="space-y-4">
                  <Card className="card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">Patient Management</h4>
                          <p className="text-sm text-muted-foreground">Complete patient history at your fingertips</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-secondary" />
                        <div>
                          <h4 className="font-medium">E-Prescriptions</h4>
                          <p className="text-sm text-muted-foreground">Digital prescriptions with drug interaction alerts</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Brain className="h-5 w-5 text-accent" />
                        <div>
                          <h4 className="font-medium">AI Diagnostic Support</h4>
                          <p className="text-sm text-muted-foreground">AI-powered insights for better diagnosis</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Video className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">Telemedicine</h4>
                          <p className="text-sm text-muted-foreground">Secure video consultations with patients</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full border bg-accent/10 px-4 py-1.5 text-sm mb-6">
                  <Building2 className="size-4 text-accent" />
                  <span>For Hospitals</span>
                </div>

                <div className="space-y-4">
                  <Card className="card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">Doctor Management</h4>
                          <p className="text-sm text-muted-foreground">Manage schedules, performance, and workload</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-secondary" />
                        <div>
                          <h4 className="font-medium">Analytics Dashboard</h4>
                          <p className="text-sm text-muted-foreground">Comprehensive hospital performance metrics</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-accent" />
                        <div>
                          <h4 className="font-medium">Appointment System</h4>
                          <p className="text-sm text-muted-foreground">Centralized appointment management</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">Compliance Management</h4>
                          <p className="text-sm text-muted-foreground">HIPAA compliance and data security</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Privacy */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">Security & Privacy First</h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Your health data is protected with enterprise-grade security
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center card-hover">
                <CardContent className="p-6">
                  <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">HIPAA Compliant</h3>
                  <p className="text-sm text-muted-foreground">Full compliance with healthcare privacy regulations</p>
                </CardContent>
              </Card>

              <Card className="text-center card-hover">
                <CardContent className="p-6">
                  <div className="p-4 bg-secondary/10 rounded-full w-fit mx-auto mb-4">
                    <Zap className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="font-semibold mb-2">End-to-End Encryption</h3>
                  <p className="text-sm text-muted-foreground">Military-grade encryption for all data transmission</p>
                </CardContent>
              </Card>

              <Card className="text-center card-hover">
                <CardContent className="p-6">
                  <div className="p-4 bg-accent/10 rounded-full w-fit mx-auto mb-4">
                    <Globe className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">Global Infrastructure</h3>
                  <p className="text-sm text-muted-foreground">99.9% uptime with redundant cloud storage</p>
                </CardContent>
              </Card>

              <Card className="text-center card-hover">
                <CardContent className="p-6">
                  <div className="p-4 bg-green-100 rounded-full w-fit mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Regular Audits</h3>
                  <p className="text-sm text-muted-foreground">Third-party security audits and certifications</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Platform Features */}
        <section className="border-t bg-muted/30 py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">Platform Features</h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Built for modern healthcare with cutting-edge technology
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="card-hover">
                <CardContent className="p-6 text-center">
                  <Smartphone className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Mobile First</h3>
                  <p className="text-sm text-muted-foreground">
                    Native iOS and Android apps with offline capabilities
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-6 text-center">
                  <Languages className="h-12 w-12 text-secondary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Multi-Language</h3>
                  <p className="text-sm text-muted-foreground">
                    Support for multiple languages including Hindi and English
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-6 text-center">
                  <Zap className="h-12 w-12 text-accent mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Real-time Sync</h3>
                  <p className="text-sm text-muted-foreground">
                    Instant synchronization across all your devices
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-6 text-center">
                  <Camera className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Document Scanning</h3>
                  <p className="text-sm text-muted-foreground">
                    Built-in camera scanning with OCR text recognition
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 text-secondary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">In-App Communication</h3>
                  <p className="text-sm text-muted-foreground">
                    Secure messaging between patients and doctors
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-6 text-center">
                  <Star className="h-12 w-12 text-accent mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Reviews & Ratings</h3>
                  <p className="text-sm text-muted-foreground">
                    Rate and review healthcare providers and services
                  </p>
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
                Ready to Experience All Features?
              </h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Start your free trial today and discover how MediSaathi can transform your healthcare experience
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" asChild className="text-base">
                  <Link href="/auth/signup">
                    Start Free Trial
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base bg-transparent">
                  <Link href="/contact">Schedule Demo</Link>
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
