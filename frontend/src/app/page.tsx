import Link from 'next/link';
import { ArrowRight, Twitter, CheckCircle2, Zap, LayoutTemplate } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0F172A] to-black text-white selection:bg-primary/30">
      
      {/* Navbar */}
      <nav className="border-b border-white/5 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/20">
                <LayoutTemplate className="w-5 h-5 text-primary" />
             </div>
             <span className="font-bold text-xl tracking-tight">TwitterOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="btn btn-primary text-sm py-2 px-4 rounded-full">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-32 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm mb-8 animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
          v2.0 Now Available
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent max-w-4xl mx-auto leading-tight">
          Supercharge Your Twitter <br className="hidden md:block"/> Giveaways
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          The all-in-one operating system for viral campaigns. 
          Automate verification, reward followers instantly, and watch your engagement soar.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
          <Link href="/register" className="btn btn-primary text-lg px-8 py-4 h-auto rounded-full group">
            Start Building Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="px-8 py-4 text-slate-300 font-medium hover:text-white transition-colors">
            View Live Demo
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
          <div className="card group hover:bg-slate-800/50 transition-colors">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-blue-500/20">
              <LayoutTemplate className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Viral Campaigns</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Create stunning landing pages for your giveaways in seconds. Optimized for conversion and sharing.
            </p>
          </div>
          
          <div className="card group hover:bg-slate-800/50 transition-colors">
             <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-green-500/20">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Smart Verification</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Automatically verify follows, retweets, and likes. No more manual checking or fake entries.
            </p>
          </div>
          
          <div className="card group hover:bg-slate-800/50 transition-colors">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-purple-500/20">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Instant Rewards</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Deliver airtime, crypto, or digital goods instantly to verified winners. Zero friction.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center">
        <p className="text-slate-500 text-sm">
          © 2024 TwitterOS. Built for the modern web.
        </p>
      </footer>
    </div>
  );
}
