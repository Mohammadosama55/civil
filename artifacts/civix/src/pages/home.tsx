import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Play, Star, MapPin } from "lucide-react";
import Layout from "@/components/layout/Layout";

export default function Home() {
  return (
    <Layout>
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24 gap-12">
        <div className="flex-1 flex flex-col items-start space-y-8 max-w-2xl">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Report Local Issues. <br/>
            <span className="text-primary">Make Your City Better.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-lg">
            Civix is the civic engagement platform connecting citizens with local government. Report problems, vote on community priorities, and track improvements in real-time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button size="lg" className="text-base h-14 px-8 font-semibold" asChild>
              <Link href="/register" data-testid="button-get-started">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base h-14 px-8 font-semibold" asChild>
              <Link href="/about" className="flex items-center gap-2" data-testid="button-watch-demo">
                <Play className="w-5 h-5" />
                Watch Demo
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center text-amber-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-white">4.8/5</strong> from 2,500+ users
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full max-w-xl relative">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 aspect-[4/3] bg-slate-100 dark:bg-slate-800">
            {/* Placeholder for city photo */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-slate-900/40 mix-blend-multiply z-10" />
            <img 
              src="https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80&w=1000" 
              alt="City Aerial" 
              className="w-full h-full object-cover"
            />
            
            {/* Mock UI Overlay */}
            <div className="absolute bottom-6 left-6 right-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20 dark:border-slate-700/50 z-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Pothole on Main St</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Reported 2 hours ago • In Progress</p>
                </div>
              </div>
            </div>

            <div className="absolute top-6 right-6 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md z-20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Live Demo
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl -z-10" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -z-10" />
        </div>
      </div>
    </Layout>
  );
}