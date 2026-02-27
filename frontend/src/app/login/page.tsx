'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, APIException } from '@/lib/api';
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof APIException) {
        setError(err.detail);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center">
      <Link href="/" className="absolute top-8 left-8 text-muted hover:text-white transition-colors flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
      
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Welcome Back</h1>
          <p className="text-muted">Sign in to manage your campaigns</p>
        </div>

        <div className="card shadow-2xl shadow-primary/5 border-t border-white/10">
          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-error inline-block"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  id="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  id="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-2.5 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:text-primary-hover font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
