import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"
import {
  Building2,
  Users,
  Calendar,
  BarChart3,
  Shield,
  Zap,
  Clock,
  FileText,
  CheckCircle2,
  ArrowRight,
  Settings,
  TrendingUp,
} from "lucide-react"

export default function HospitalPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
                <Building2 className="size-4 text-accent" />
                <span>For Hospitals</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Streamline Hospital Operations with Smart Management
              </h1>

              <p className="text-xl text-muted-foreground text-balance leading-relaxed">
                Manage doctors, appointments, patient flow, and analytics on one unified platform. Improve efficiency
                and patient satisfaction.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" asChild>
                  <Link href="/auth/signup">
                    Request Demo
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">View Features</Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Hospitals</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-secondary">5M+</div>
                  <div className="text-sm text-muted-foreground">Patients Managed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-accent">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl border bg-gradient-to-br from-accent/20 via-primary/20 to-secondary/20 flex items-center justify-center">
                <img
                  src="/hospital-management-dashboard-analytics.jpg"
                  alt="Hospital Admin Dashboard"
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
              <h2 className="text-3xl md:text-5xl font-bold text-balance">Hospital Management Features</h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Comprehensive tools to manage your healthcare facility efficiently
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <Users className="size-10 text-accent mb-3" />
                  <CardTitle>Doctor Management</CardTitle>
                  <CardDescription>
                    Add, manage, and monitor doctors across departments. Track availability, schedules, and performance
                    metrics.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Calendar className="size-10 text-primary mb-3" />
                  <CardTitle>Appointment System</CardTitle>
                  <CardDescription>
                    Centralized appointment management with automated scheduling, queue management, and patient
                    notifications.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="size-10 text-secondary mb-3" />
                  <CardTitle>Analytics Dashboard</CardTitle>
                  <CardDescription>
                    Real-time insights into hospital operations, patient flow, revenue, and departmental performance.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <FileText className="size-10 text-accent mb-3" />
                  <CardTitle>Patient Records</CardTitle>
                  <CardDescription>
                    Centralized electronic health records system with secure access for authorized medical staff.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Settings className="size-10 text-primary mb-3" />
                  <CardTitle>Department Management</CardTitle>
                  <CardDescription>
                    Organize and manage multiple departments, OPDs, IPDs, and specialized units efficiently.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <TrendingUp className="size-10 text-secondary mb-3" />
                  <CardTitle>Revenue Tracking</CardTitle>
                  <CardDescription>
                    Monitor billing, payments, insurance claims, and financial performance with detailed reports.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Clock className="size-10 text-accent mb-3" />
                  <CardTitle>Queue Management</CardTitle>
                  <CardDescription>
                    Reduce wait times with intelligent queue management and real-time patient flow optimization.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="size-10 text-primary mb-3" />
                  <CardTitle>Security & Compliance</CardTitle>
                  <CardDescription>
                    Enterprise-grade security with HIPAA compliance, role-based access, and audit trails.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="size-10 text-secondary mb-3" />
                  <CardTitle>Integration Ready</CardTitle>
                  <CardDescription>
                    Seamless integration with existing hospital systems, lab equipment, and third-party services.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Subscription Pricing */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">Enterprise Pricing</h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Flexible pricing based on your hospital size and needs
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Small Clinic</CardTitle>
                  <CardDescription>Perfect for small clinics</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">$199</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Up to 5 doctors</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>500 patients/month</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Basic analytics</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Email support</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary shadow-lg">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Popular
                  </span>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl">Medium Hospital</CardTitle>
                  <CardDescription>For growing hospitals</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">$499</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Up to 25 doctors</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Unlimited patients</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Advanced analytics</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Priority support</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Custom integrations</span>
                    </li>
                  </ul>
                  <Button className="w-full" asChild>
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Enterprise</CardTitle>
                  <CardDescription>For large hospitals</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">Custom</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Unlimited doctors</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Unlimited patients</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Custom analytics</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>24/7 dedicated support</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>On-premise deployment</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <span>Custom features</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <Link href="/contact">Contact Sales</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-gradient-to-br from-accent/10 via-primary/10 to-secondary/10 py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">Ready to Modernize Your Hospital?</h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Join hundreds of hospitals using MediSaathi to improve operations and patient care
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" asChild>
                  <Link href="/auth/signup">
                    Request Demo
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
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
