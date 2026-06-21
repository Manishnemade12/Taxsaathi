import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { FileText, Brain, Shield, TrendingUp, Upload, Landmark, ArrowRight, CheckCircle2 } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: Upload,
    title: "Smart Document Upload",
    description: "Upload Form 16, salary slips, investment proofs — our AI reads them instantly.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Brain,
    title: "AI Tax Analysis",
    description: "Get personalized deduction suggestions under 80C, 80D, HRA, NPS and more.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: TrendingUp,
    title: "Old vs New Regime",
    description: "Side-by-side comparison to choose the tax regime that saves you the most.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Landmark,
    title: "Scheme Finder",
    description: "Discover PPF, ELSS, Sukanya Samriddhi and more schemes you're eligible for.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your financial data stays encrypted and accessible only to you.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: FileText,
    title: "Tax Summary Report",
    description: "Download a consolidated report with income, deductions, and estimated tax.",
    color: "bg-accent/10 text-accent",
  },
];

const steps = [
  { step: "1", title: "Sign Up & Tell Us About You", desc: "Quick onboarding about your income and employment." },
  { step: "2", title: "Upload Your Documents", desc: "PDFs, images, or spreadsheets — we handle them all." },
  { step: "3", title: "Get AI-Powered Guidance", desc: "Deductions, schemes, and regime comparison in seconds." },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display font-bold text-lg">
              T
            </div>
            <span className="font-display font-bold text-xl text-foreground">TaxSathi</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Log in</Link>
            </Button>
            <Button asChild className="rounded-full px-6" style={{ background: "var(--gradient-primary)" }}>
              <Link to="/auth?tab=signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32" style={{ background: "var(--gradient-hero)" }}>
        <div className="container relative z-10">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <CheckCircle2 className="h-4 w-4" />
              AI-Powered for Indian Taxpayers
            </span>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl leading-[1.1]">
              Your Smartest{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
                Tax Filing
              </span>{" "}
              Companion
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
              Upload your documents, get AI-powered deduction suggestions, compare tax regimes, and discover government schemes — all in one place.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="rounded-full px-8 text-base h-12" style={{ background: "var(--gradient-primary)" }}>
                <Link to="/auth?tab=signup">
                  Start Saving on Taxes <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full px-8 text-base h-12">
                <a href="#features">See How It Works</a>
              </Button>
            </div>
          </motion.div>
        </div>
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="container">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Everything You Need for{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-secondary)" }}>
                Smarter Tax Filing
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
              From document analysis to scheme recommendations — we've got you covered.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className="group h-full border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}>
                      <f.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display font-semibold text-lg text-foreground mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">Three simple steps to smarter tax filing</p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <motion.div key={s.step} className="text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-display font-bold text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {s.step}
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div
            className="mx-auto max-w-2xl rounded-3xl p-10 md:p-14 text-center text-primary-foreground relative overflow-hidden"
            style={{ background: "var(--gradient-primary)" }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="font-display text-3xl font-bold md:text-4xl mb-4">
              Ready to Maximize Your Tax Savings?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Join thousands of Indian taxpayers who save smarter with AI-powered guidance.
            </p>
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="rounded-full px-8 text-base h-12 bg-card text-foreground hover:bg-card/90"
            >
              <Link to="/auth?tab=signup">
                Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-display font-bold text-sm">
              T
            </div>
            <span className="font-display font-semibold text-foreground">TaxSathi</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 TaxSathi. For guidance only — not a substitute for professional tax advice.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
