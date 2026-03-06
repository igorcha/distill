import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  FileText,
  Upload,
  Youtube,
  Check,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.svg";

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing Navbar                                                     */
/* ------------------------------------------------------------------ */

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "/contact" },
];

function LandingNavbar({ authed }: { authed: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-6 lg:px-10 transition-all duration-300 ${
        scrolled
          ? "bg-[#0f1117]/80 backdrop-blur-lg border-b border-[#2a2f42]"
          : "bg-transparent"
      }`}
    >
      <a href="#" className="flex items-center gap-2.5">
        <img src={logo} width={28} height={28} alt="Distill" />
        <span className="text-lg font-bold text-white">Distill</span>
      </a>

      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((l) =>
          l.href.startsWith("#") ? (
            <a
              key={l.label}
              href={l.href}
              className="text-sm text-[#8b92a5] hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ) : (
            <Link
              key={l.label}
              to={l.href}
              className="text-sm text-[#8b92a5] hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          )
        )}
      </div>

      <div className="flex items-center gap-3">
        {authed ? (
          <Link to="/dashboard">
            <Button className="bg-[#3B5BDB] hover:bg-[#2645c7] text-white cursor-pointer">
              Dashboard
            </Button>
          </Link>
        ) : (
          <>
            <Link to="/auth">
              <Button
                variant="ghost"
                className="text-[#8b92a5] hover:text-white hover:bg-[#1a1f2e] cursor-pointer"
              >
                Log In
              </Button>
            </Link>
            <Link to="/auth?tab=register">
              <Button className="bg-[#3B5BDB] hover:bg-[#2645c7] text-white cursor-pointer">
                Sign Up Free
              </Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero({ authed }: { authed: boolean }) {
  return (
    <section className="relative pt-36 pb-20 px-6 overflow-hidden">
      {/* Radial glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(59,91,219,0.15)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-4xl text-center">
        <FadeUp>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white">
            Turn Anything Into{" "}
            <span className="text-[#3B5BDB]">Flashcards</span> Instantly
          </h1>
        </FadeUp>

        <FadeUp delay={0.1}>
          <p className="mt-6 text-lg sm:text-xl text-[#8b92a5] max-w-2xl mx-auto leading-relaxed">
            Paste text, upload a PDF, or drop in a YouTube URL. Your AI study
            assistant generates flashcards in seconds.
          </p>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={authed ? "/dashboard" : "/auth?tab=register"}>
              <Button className="h-12 px-7 text-base bg-[#3B5BDB] hover:bg-[#2645c7] text-white cursor-pointer">
                {authed ? "Go to Dashboard" : "Get Started for Free"}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button
                variant="ghost"
                className="h-12 px-7 text-base text-[#8b92a5] hover:text-white hover:bg-[#1a1f2e] border border-[#2a2f42] cursor-pointer"
              >
                See How It Works
              </Button>
            </a>
          </div>
        </FadeUp>

        <FadeUp delay={0.35}>
          <div className="relative mt-16">
            {/* Blue glow beneath screenshot */}
            <div className="pointer-events-none absolute -bottom-12 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-[radial-gradient(ellipse_at_center,rgba(59,91,219,0.25)_0%,transparent_70%)]" />
            <div className="rounded-xl border border-[#2a2f42] overflow-hidden shadow-2xl">
              <img
                src="/hero.png"
                alt="Distill app screenshot"
                className="w-full"
              />
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features                                                           */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: FileText,
    title: "Paste Text",
    description:
      "Paste any text — lecture notes, articles, book excerpts — and get a full study deck generated instantly.",
  },
  {
    icon: Upload,
    title: "Upload PDF",
    description:
      "Upload a PDF document and let AI extract the key concepts and turn them into study-ready flashcards.",
  },
  {
    icon: Youtube,
    title: "YouTube Videos",
    description:
      "Drop in a YouTube URL and we'll pull the transcript, then distill it into concise flashcards.",
    badge: "Unique",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Three ways to create flashcards
            </h2>
          </div>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.1} className="h-full">
              <div className="relative group rounded-xl border border-[#2a2f42] bg-[#1a1f2e] p-7 h-full transition-all duration-300 hover:-translate-y-1 hover:border-[#3B5BDB]/50 hover:shadow-[0_4px_32px_rgba(59,91,219,0.12)]">
                {f.badge && (
                  <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider bg-[#3B5BDB]/15 text-[#3B5BDB] px-2.5 py-1 rounded-full">
                    {f.badge}
                  </span>
                )}
                <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-[#3B5BDB]/10 mb-5">
                  <f.icon className="size-5 text-[#3B5BDB]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-[#8b92a5] leading-relaxed">
                  {f.description}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How It Works                                                       */
/* ------------------------------------------------------------------ */

const steps = [
  { number: 1, title: "Add your source", description: "Paste text, upload a PDF, or provide a YouTube link." },
  { number: 2, title: "AI generates cards", description: "Claude reads your content and creates flashcard pairs." },
  { number: 3, title: "Study and retain", description: "Review your deck with an interactive flip-card interface." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <FadeUp>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              How It Works
            </h2>
          </div>
        </FadeUp>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-7 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-[#2a2f42]" />

          {steps.map((s, i) => {
            const isActive = s.number === 2;
            return (
              <FadeUp key={s.number} delay={i * 0.12}>
                <div className="relative flex flex-col items-center text-center">
                  <div
                    className={`relative z-10 flex items-center justify-center w-14 h-14 rounded-full text-lg font-bold mb-5 transition-colors ${
                      isActive
                        ? "bg-[#3B5BDB] text-white"
                        : "bg-[#1a1f2e] border border-[#2a2f42] text-[#8b92a5]"
                    }`}
                  >
                    {s.number}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-[#8b92a5] leading-relaxed max-w-[260px]">
                    {s.description}
                  </p>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Pricing                                                            */
/* ------------------------------------------------------------------ */

function Pricing() {
  const [annual, setAnnual] = useState(true);

  const proPrice = annual ? "$4.99" : "$6.99";
  const billingNote = annual ? "Billed as $59.88/year" : "Billed monthly";

  const freePlan = [
    "10 credits/month",
    "Text, PDF & YouTube support",
    "Unlimited decks",
    "Flip-card study mode",
  ];

  const proPlan = [
    "200 credits/month",
    "Text, PDF & YouTube support",
    "Up to 10 PDF pages per generation",
    "Unlimited decks",
    "Priority support",
  ];

  const creditNote = "1 credit per text/PDF generation, 3 credits per YouTube generation.";

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <FadeUp>
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Simple, transparent pricing
            </h2>
          </div>
        </FadeUp>

        {/* Toggle */}
        <FadeUp delay={0.05}>
          <div className="relative flex items-center justify-center mb-12">
            <div className="relative flex items-center bg-[#1a1f2e] rounded-full p-1 border border-[#2a2f42]">
              <button
                onClick={() => setAnnual(false)}
                className={`relative z-10 px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  !annual ? "text-white" : "text-[#8b92a5]"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`relative z-10 px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  annual ? "text-white" : "text-[#8b92a5]"
                }`}
              >
                Annual
              </button>
              {/* Sliding pill */}
              <motion.div
                className="absolute top-1 bottom-1 rounded-full bg-[#2a2f42]"
                style={{ width: "calc(50% - 4px)" }}
                animate={{ left: annual ? "calc(50% + 2px)" : "4px" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            </div>
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: annual ? 1 : 0, x: annual ? 0 : -8 }}
              className="absolute left-[calc(50%+110px)] text-xs font-semibold bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full whitespace-nowrap"
            >
              Save 28%
            </motion.span>
          </div>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <FadeUp delay={0.1}>
            <div className="rounded-xl border border-[#2a2f42] bg-[#1a1f2e] p-7 flex flex-col h-full">
              <h3 className="text-lg font-semibold text-white">Free</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-[#8b92a5] ml-1">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {freePlan.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#8b92a5]">
                    <Check className="size-4 text-[#3B5BDB] mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/auth?tab=register">
                <Button
                  variant="outline"
                  className="w-full h-11 border-[#2a2f42] text-[#8b92a5] hover:bg-[#2a2f42] hover:text-white cursor-pointer"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </FadeUp>

          {/* Pro */}
          <FadeUp delay={0.2}>
            <div className="relative rounded-xl border border-[#3B5BDB]/50 bg-[#1a1f2e] p-7 flex flex-col h-full shadow-[0_0_40px_rgba(59,91,219,0.08)]">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold uppercase tracking-wider bg-[#3B5BDB] text-white px-4 py-1 rounded-full">
                Most Popular
              </span>
              <h3 className="text-lg font-semibold text-white">Pro</h3>
              <div className="mt-4 mb-1">
                <span className="text-4xl font-bold text-white">{proPrice}</span>
                <span className="text-[#8b92a5] ml-1">/mo</span>
              </div>
              <p className="text-xs text-[#555b6e] mb-6">{billingNote}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {proPlan.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#8b92a5]">
                    <Check className="size-4 text-[#3B5BDB] mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/auth?tab=register">
                <Button className="w-full h-11 bg-[#3B5BDB] hover:bg-[#2645c7] text-white cursor-pointer">
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          </FadeUp>
        </div>

        <p className="text-center text-xs text-[#555b6e] mt-6">{creditNote}</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA Banner                                                         */
/* ------------------------------------------------------------------ */

function CTABanner({ authed }: { authed: boolean }) {
  return (
    <section className="py-24 px-6">
      <FadeUp>
        <div className="mx-auto max-w-5xl rounded-2xl bg-gradient-to-r from-[#2645c7] to-[#3B5BDB] px-8 py-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Start learning smarter today
          </h2>
          <p className="mt-4 text-lg text-white/70 max-w-xl mx-auto">
            Built for students and professionals who want to study more
            effectively.
          </p>
          <Link to={authed ? "/dashboard" : "/auth?tab=register"}>
            <Button className="mt-8 h-12 px-8 text-base bg-white text-[#2645c7] hover:bg-white/90 font-semibold cursor-pointer">
              {authed ? "Go to Dashboard" : "Get Started for Free"}
            </Button>
          </Link>
        </div>
      </FadeUp>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="border-t border-[#2a2f42] bg-[#0f1117] px-6 pt-16 pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <img src={logo} width={24} height={24} alt="Distill" />
              <span className="text-base font-bold text-white">Distill</span>
            </div>
            <p className="text-sm text-[#8b92a5] leading-relaxed">
              AI-powered flashcard generation for faster, smarter studying.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#555b6e] mb-4">
              Product
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "How It Works", href: "#how-it-works" },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-[#8b92a5] hover:text-white transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#555b6e] mb-4">
              Support
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Contact", to: "/contact" },
                { label: "Privacy Policy", to: "/privacy" },
                { label: "Terms of Service", to: "/terms" },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm text-[#8b92a5] hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#555b6e] mb-4">
              Social
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#8b92a5] hover:text-white transition-colors"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#8b92a5] hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2a2f42] pt-6 text-center">
          <p className="text-xs text-[#555b6e]">
            &copy; {new Date().getFullYear()} Distill. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <LandingNavbar authed={isAuthenticated} />
      <Hero authed={isAuthenticated} />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTABanner authed={isAuthenticated} />
      <Footer />
    </div>
  );
}
