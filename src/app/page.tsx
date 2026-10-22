"use client";

import { useState } from "react";
import { GitBranch, Globe, Database, CheckCircle2, ShieldCheck, ArrowRight, Zap, RefreshCw, Terminal, Layers } from "lucide-react";

export default function Home() {
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<string | null>(null);

  const testSupabaseConnection = async () => {
    setTestingSupabase(true);
    setSupabaseStatus("Testing connection...");
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key || url.includes("placeholder")) {
        setSupabaseStatus("Configured with placeholder credentials. Add your live Supabase credentials in .env.local to query tables.");
      } else {
        setSupabaseStatus("Supabase URL and Anon Key are configured and ready!");
      }
    } catch {
      setSupabaseStatus("Error verifying credentials");
    } finally {
      setTestingSupabase(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col selection:bg-indigo-500/30">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-emerald-500/10 via-indigo-600/15 to-cyan-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              DH
            </div>
            <div>
              <div className="font-semibold text-sm tracking-wide text-white">Dining Hyderabad Hackathon</div>
              <div className="text-xs text-slate-400 font-mono">dinning_hyd • Full-Stack Hub</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected Trio Active
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300 mb-5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            GitHub + Vercel + Supabase CI/CD Ecosystem
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Unified Hackathon <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">Power Stack</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Every commit automatically deploys through GitHub to Vercel, connected with Supabase real-time database, auth, and backend services.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* GitHub Pillar */}
          <div className="group rounded-2xl bg-slate-900/70 border border-slate-800/90 p-6 hover:border-slate-700 transition-all shadow-xl hover:shadow-indigo-500/5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200 group-hover:scale-105 transition-transform">
                <GitBranch className="w-6 h-6 text-white" />
              </div>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Linked
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">1. GitHub Repository</h2>
            <p className="text-xs text-slate-400 mb-4">Codebase source of truth with automated branch tracking and triggers.</p>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-xs text-slate-300 break-all mb-4">
              mokashkumar1/dinning_hyd
            </div>
            <a
              href="https://github.com/mokashkumar1/dinning_hyd"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Open GitHub Repo <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Vercel Pillar */}
          <div className="group rounded-2xl bg-slate-900/70 border border-slate-800/90 p-6 hover:border-slate-700 transition-all shadow-xl hover:shadow-indigo-500/5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200 group-hover:scale-105 transition-transform">
                <Globe className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">2. Vercel Continuous Deployment</h2>
            <p className="text-xs text-slate-400 mb-4">Edge network hosting with zero-config preview and production pipelines.</p>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-xs text-slate-300 break-all mb-4">
              Account: mokashs-projects
            </div>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Vercel Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Supabase Pillar */}
          <div className="group rounded-2xl bg-slate-900/70 border border-slate-800/90 p-6 hover:border-slate-700 transition-all shadow-xl hover:shadow-indigo-500/5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200 group-hover:scale-105 transition-transform">
                <Database className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> SSR Ready
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">3. Supabase Backend</h2>
            <p className="text-xs text-slate-400 mb-4">PostgreSQL database, authentication, storage, and real-time sockets.</p>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-xs text-slate-300 break-all mb-4">
              src/lib/supabase/(client|server).ts
            </div>
            <button
              onClick={testSupabaseConnection}
              disabled={testingSupabase}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {testingSupabase ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Verify Supabase Config
            </button>
          </div>
        </div>

        {/* Interactive Status Notice */}
        {supabaseStatus && (
          <div className="mb-10 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-300 flex items-start gap-3">
            <Terminal className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white text-xs uppercase tracking-wider mb-0.5">Status Check Output</div>
              <div>{supabaseStatus}</div>
            </div>
          </div>
        )}

        {/* Quick Instructions & Architecture */}
        <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4 text-white font-semibold text-base">
            <Layers className="w-5 h-5 text-indigo-400" />
            Workflow & Self-Healing Pipeline
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <span className="font-semibold text-white block mb-1">1. Push to GitHub</span>
              Run <code className="text-indigo-300">git push origin main</code> anytime you make changes. Antigravity can directly push and verify changes for you.
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <span className="font-semibold text-white block mb-1">2. Vercel Auto-Deploys</span>
              Vercel picks up the new commit, runs the Next.js build, and exposes preview & production URLs instantly.
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <span className="font-semibold text-white block mb-1">3. Supabase Synced</span>
              Supabase handles database queries and authentication seamlessly via the server and client helpers.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        Dining Hyderabad Hackathon • Next.js 16 + Tailwind CSS + Supabase + Vercel
      </footer>
    </div>
  );
}
