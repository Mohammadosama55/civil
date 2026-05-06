import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Shield, Globe } from "lucide-react";
import { Layout } from "@/components/layout/Layout";

export default function About() {
  return (
    <Layout>
      <div className="flex-1 w-full bg-white dark:bg-slate-950 relative overflow-hidden">
        {/* Animated Particles (simplified CSS representation) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-4 h-4 bg-primary/30 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
          <div className="absolute top-40 right-1/4 w-6 h-6 bg-primary/20 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-20 left-1/3 w-8 h-8 bg-primary/10 rounded-full animate-bounce" style={{ animationDuration: '5s' }} />
          <div className="absolute bottom-40 right-1/3 w-3 h-3 bg-primary/40 rounded-full animate-pulse" style={{ animationDuration: '2.5s' }} />
        </div>

        <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center rounded-full px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold mb-8 border border-primary/20" data-testid="badge-empowering">
            <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
            Empowering Citizens
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-6">
            Report Local Issues. <br/>
            <span className="text-primary">Make Your City Better.</span>
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Civix is built on the belief that the best cities are shaped by the people who live in them. We provide the tools for citizens to voice concerns, propose solutions, and collaborate with local government.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Button size="lg" className="h-14 px-8 text-base font-semibold w-full sm:w-auto" asChild>
              <Link href="/register" data-testid="link-about-get-started">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base font-semibold w-full sm:w-auto" asChild>
              <Link href="/voting-system" className="flex items-center gap-2" data-testid="link-about-learn-more">
                Learn More
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-16">
            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Community Driven</h3>
              <p className="text-slate-600 dark:text-slate-400">Everything on Civix is powered by real citizens who care about their neighborhoods.</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Authoritative</h3>
              <p className="text-slate-600 dark:text-slate-400">Directly connected with local municipal systems to ensure issues actually get fixed.</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Modern Platform</h3>
              <p className="text-slate-600 dark:text-slate-400">A seamless, accessible experience designed for everyone in the community.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}