import Link from 'next/link';
import {
  GitBranch,
  Layers,
  Code2,
  Play,
  Variable,
  Undo2,
  HardDrive,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/landing/AnimatedSection';
import { BlueprintGrid } from '@/components/landing/BlueprintGrid';
import { StateDiagramDivider } from '@/components/landing/StateDiagramDivider';
import { ThemeToggle } from '@/components/shared/theme-toggle';

const steps = [
  {
    step: '1',
    title: 'Draw states',
    desc: 'Add states to the canvas and organise your logic visually. Nest states inside composite states for hierarchical machines.',
  },
  {
    step: '2',
    title: 'Connect transitions',
    desc: 'Link states with transitions. Define guard conditions and entry/exit actions using the built-in expression language.',
  },
  {
    step: '3',
    title: 'Generate code',
    desc: 'Export production-ready C or Siemens SCL code at the click of a button. Ready to deploy on an S7-1500 PLC.',
  },
];

const features = [
  {
    icon: GitBranch,
    title: 'Visual Canvas',
    desc: 'Interactive drag & drop editor powered by React Flow. Pan, zoom, and multi-select with ease.',
  },
  {
    icon: Layers,
    title: 'Nested States',
    desc: 'Drag states inside composite states to build hierarchical machines that mirror real-world complexity.',
  },
  {
    icon: Code2,
    title: 'Code Generation',
    desc: 'One-click export to ANSI C or Siemens SCL — ready for Siemens S7-1500 PLCs out of the box.',
  },
  {
    icon: Play,
    title: 'Simulation',
    desc: 'Run your state machine in the browser. Step through transitions and watch active states highlight in real time.',
  },
  {
    icon: Variable,
    title: 'Variables',
    desc: 'Define typed variables (BOOL, INT, REAL, …) and reference them in conditions and actions.',
  },
  {
    icon: Zap,
    title: 'Expression Language',
    desc: 'A purpose-built syntax for conditions and actions that compiles to both C and SCL.',
  },
  {
    icon: Undo2,
    title: 'Undo / Redo',
    desc: 'Full undo/redo history powered by temporal Zustand. Never lose a change.',
  },
  {
    icon: HardDrive,
    title: 'Local-first',
    desc: 'No account needed. Projects are saved to your browser. Export JSON, C, or SCL any time.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">
              S
            </div>
            <span className="text-lg font-semibold">State-It</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/editor">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                Open Editor
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 py-24 text-center overflow-hidden">
        {/* Blueprint grid */}
        <BlueprintGrid />
        {/* Violet glow */}
        <div className="absolute left-1/2 top-1/3 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[120px] animate-glow-pulse" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Free &amp; open source
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Design state machines
            <br />
            <span className="text-violet-500">visually</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Draw states and transitions on an interactive canvas. Define conditions and
            actions with a purpose-built expression language. Generate production-ready
            C or Siemens SCL code for your S7-1500 PLC — instantly.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/editor">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white px-8 text-base">
                <GitBranch className="mr-2 h-5 w-5" />
                Open Editor
              </Button>
            </Link>
            <a href="https://github.com/maartenvanels/state-it" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="px-8 text-base">
                GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Animated state diagram divider */}
      <StateDiagramDivider />

      {/* How it works */}
      <section className="border-t border-border/50 bg-card/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <AnimatedSection>
            <h2 className="text-center text-3xl font-bold">How it works</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
              From blank canvas to deployed PLC code in three steps
            </p>
          </AnimatedSection>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map((item, i) => (
              <AnimatedSection key={item.step} delay={i * 150}>
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/10 text-2xl font-bold text-violet-500">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <AnimatedSection>
            <h2 className="text-center text-3xl font-bold">Features</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
              Everything you need to model, simulate, and ship state machines
            </p>
          </AnimatedSection>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feat, i) => (
              <AnimatedSection key={feat.title} delay={i * 80}>
                <div className="rounded-xl border border-border bg-card/50 p-5 transition-all duration-300 hover:border-violet-500/30 hover:bg-card/80 hover:shadow-[0_0_30px_-5px_rgba(124,58,237,0.2)] hover:-translate-y-1">
                  <feat.icon className="h-8 w-8 text-violet-500" />
                  <h3 className="mt-3 font-semibold">{feat.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feat.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 bg-card/30 py-24 text-center">
        <AnimatedSection className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold">Ready to model your machine?</h2>
          <p className="mt-4 text-muted-foreground">
            No sign-up required. No data leaves your browser. Just open and start designing.
          </p>
          <Link href="/editor" className="mt-8 inline-block">
            <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white px-10 text-base">
              Open State-It
            </Button>
          </Link>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} State-It</span>
          <a
            href="https://github.com/maartenvanels/state-it"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
