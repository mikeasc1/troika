'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register, login, APIException } from '@/lib/api';
import type { UserCreate } from '@/types';
import { Mail, Lock, User, AtSign, Loader2, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<UserCreate>({
    email: '',
    password: '',
    full_name: '',
    twitter_username: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      // Auto-login after registration
      await login(formData.email, formData.password);
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

      <div className="w-full max-w-md animate-fade-in my-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Create Account</h1>
          <p className="text-muted">Start automating your Twitter campaigns</p>
        </div>

        <div className="card shadow-2xl shadow-primary/5 border-t border-white/10">
          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-error inline-block"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="email">
                Email Address <span className="text-error">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="password">
                Password <span className="text-error">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="input-field"
                  placeholder="Min 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300" htmlFor="full_name">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                     className="input-field"
                    placeholder="John Doe"
                    value={formData.full_name || ''}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300" htmlFor="twitter_username">
                  Twitter User
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <AtSign className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    id="twitter_username"
                    name="twitter_username"
                     className="input-field"
                    placeholder="username"
                    value={formData.twitter_username || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-2.5 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
