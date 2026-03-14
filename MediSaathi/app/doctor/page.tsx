import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"
import {
  Stethoscope,
  FileText,
  Brain,
  Calendar,
  Upload,
  Users,
  Clock,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
} from "lucide-react"

export default function DoctorPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
                <Stethoscope className="size-4 text-secondary" />
                <span>For Doctors</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Transform Your Medical Practice with AI
              </h1>

              <p className="text-xl text-muted-foreground text-balance leading-relaxed">
                Access patient histories instantly, create e-prescriptions, and leverage AI insights to provide better
                care while saving valuable time.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" asChild>
                  <Link href="/auth/signup">
                    Join as Doctor
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">View Features</Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-primary">10K+</div>
                  <div className="text-sm text-muted-foreground">Active Doctors</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-secondary">50K+</div>
                  <div className="text-sm text-muted-foreground">Consultations/Month</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-accent">40%</div>
                  <div className="text-sm text-muted-foreground">Time Saved</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl border bg-gradient-to-br from-secondary/20 via-primary/20 to-accent/20 flex items-center justify-center">
                <img
                  src="/doctor-dashboard-with-patient-records.jpg"
                  alt="Doctor Dashboard Interface"
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
              <h2 className="text-3xl md:text-5xl font-bold text-balance">Doctor Portal Features</h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Powerful tools designed to enhance your practice efficiency
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <FileText className="size-10 text-secondary mb-3" />
                  <CardTitle>Patient History Timeline</CardTitle>
                  <CardDescription>
                    View complete patient medical history in a chronological timeline. Access past visits, diagnoses,
                    and treatments instantly.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Brain className="size-10 text-primary mb-3" />
                  <CardTitle>AI Medical Summaries</CardTitle>
                  <CardDescription>
                    Get AI-generated patient summaries highlighting key medical information, trends, and potential
                    concerns automatically.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <FileText className="size-10 text-accent mb-3" />
                  <CardTitle>E-Prescription</CardTitle>
                  <CardDescription>
                    Create digital prescriptions quickly with drug interaction checks and patient allergy alerts
                    built-in.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Upload className="size-10 text-secondary mb-3" />
                  <CardTitle>Upload Lab Reports</CardTitle>
                  <CardDescription>
                    Upload and share lab reports with patients instantly. Track test results over time for better
                    diagnosis.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Calendar className="size-10 text-primary mb-3" />
                  <CardTitle>Appointment Management</CardTitle>
                  <CardDescription>
                    Manage your schedule efficiently with automated appointment booking, reminders, and rescheduling.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="size-10 text-accent mb-3" />
                  <CardTitle>Patient Analytics</CardTitle>
                  <CardDescription>
                    Track patient outcomes, treatment effectiveness, and practice metrics with detailed analytics.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Clock className="size-10 text-secondary mb-3" />
                  <CardTitle>Time Tracking</CardTitle>
                  <CardDescription>
                    Monitor consultation times and optimize your schedule for maximum efficiency.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="size-10 text-primary mb-3" />
                  <CardTitle>HIPAA Compliant</CardTitle>
                  <CardDescription>
                    Rest assured with enterprise-grade security and full HIPAA compliance for patient data protection.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="size-10 text-accent mb-3" />
                  <CardTitle>Practice Insights</CardTitle>
                  <CardDescription>
                    Get actionable insights about your practice performance, patient satisfaction, and growth
                    opportunities.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">Why Doctors Choose MediSaathi</h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Join thousands of doctors who have transformed their practice
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <Zap className="size-12 text-primary mb-4" />
                  <CardTitle className="text-2xl">Increased Efficiency</CardTitle>
                  <CardDescription className="text-base">
                    Save up to 40% of your time with automated patient history, AI summaries, and digital prescriptions.
                    Spend more time on patient care, less on paperwork.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Brain className="size-12 text-secondary mb-4" />
                  <CardTitle className="text-2xl">Better Patient Insights</CardTitle>
                  <CardDescription className="text-base">
                    AI-powered analytics help you identify trends, predict potential health risks, and make more
                    informed treatment decisions backed by data.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="size-12 text-accent mb-4" />
                  <CardTitle className="text-2xl">Enhanced Patient Communication</CardTitle>
                  <CardDescription className="text-base">
                    Share reports, prescriptions, and follow-up instructions instantly. Improve patient engagement and
                    satisfaction with seamless communication.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="size-12 text-primary mb-4" />
                  <CardTitle className="text-2xl">Secure & Compliant</CardTitle>
                  <CardDescription className="text-base">
                    Enterprise-grade security with full HIPAA compliance. All patient data is encrypted and stored
                    securely with regular backups.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-t bg-muted/30 py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">What Doctors Say</h2>
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
                    "MediSaathi has completely transformed my practice. The AI summaries save me hours every day!"
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
                    "The patient history timeline is invaluable. I can see everything at a glance and make better
                    decisions."
                  </p>
                  <div>
                    <p className="font-semibold">Dr. Meera Patel</p>
                    <p className="text-sm text-muted-foreground">General Physician, Mumbai</p>
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
                    "My patients love the digital prescriptions and instant report sharing. It's a game changer!"
                  </p>
                  <div>
                    <p className="font-semibold">Dr. Amit Sharma</p>
                    <p className="text-sm text-muted-foreground">Pediatrician, Bangalore</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-gradient-to-br from-secondary/10 via-primary/10 to-accent/10 py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">Ready to Transform Your Practice?</h2>
              <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                Join thousands of doctors using MediSaathi to provide better care
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" asChild>
                  <Link href="/auth/signup">
                    Join as Doctor
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
