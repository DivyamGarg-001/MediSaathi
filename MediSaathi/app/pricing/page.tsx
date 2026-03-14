import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X } from "lucide-react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-blue-50 to-green-50 dark:from-slate-950 dark:to-slate-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple, Transparent Pricing</h1>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Choose the plan that fits your needs. Whether you're an individual, a family, or a healthcare provider.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Free Plan */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">Basic</CardTitle>
                  <CardDescription>Essential features for individuals</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">Free</span>
                    <span className="text-muted-foreground">/forever</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="grid gap-4 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Digital Health Records</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Basic Symptom Checker</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Medication Reminders</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Single User Profile</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <X className="h-4 w-4" />
                      <span>AI Health Predictions</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <X className="h-4 w-4" />
                      <span>Priority Doctor Support</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-transparent" variant="outline" asChild>
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Premium Plan */}
              <Card className="flex flex-col border-primary relative shadow-lg scale-105 z-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most Popular
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">Premium</CardTitle>
                  <CardDescription>Advanced care for families</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$9.99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="grid gap-4 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Up to 5 Family Profiles</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Advanced AI Health Insights</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Priority Video Consultations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Unlimited OCR Document Scans</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Health Risk Predictions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>24/7 Emergency Support</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/signup?plan=premium">Upgrade Now</Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Enterprise Plan */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">Enterprise</CardTitle>
                  <CardDescription>For Hospitals & Clinics</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">Custom</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="grid gap-4 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Full Hospital Management Suite</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Unlimited Doctor Accounts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Advanced Analytics Dashboard</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>API Integration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Dedicated Account Manager</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Custom Branding</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-transparent" variant="outline" asChild>
                    <Link href="/contact">Contact Sales</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="mt-16 text-center space-y-4">
              <h3 className="text-2xl font-bold">Frequently Asked Questions</h3>
              <div className="grid gap-8 md:grid-cols-2 max-w-[800px] mx-auto text-left">
                <div>
                  <h4 className="font-semibold mb-2">Can I cancel my subscription?</h4>
                  <p className="text-muted-foreground text-sm">
                    Yes, you can cancel your Premium subscription at any time. Your benefits will continue until the end
                    of your billing period.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Is my health data secure?</h4>
                  <p className="text-muted-foreground text-sm">
                    Absolutely. We use bank-grade encryption and comply with all major healthcare data protection
                    regulations (HIPAA, etc.).
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">How does the AI symptom checker work?</h4>
                  <p className="text-muted-foreground text-sm">
                    Our AI is trained on millions of medical records to provide preliminary assessments. However, it is
                    not a replacement for professional medical advice.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Do you offer discounts for non-profits?</h4>
                  <p className="text-muted-foreground text-sm">
                    Yes, we offer special pricing for non-profit healthcare organizations. Please contact our sales team
                    for details.
                  </p>
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
