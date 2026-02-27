'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { createCampaign, APIException } from '@/lib/api';
import type { CampaignCreate } from '@/types';
import { ArrowLeft, Loader2, User, Hash, Type, Users, Dices, Banknote } from 'lucide-react';

export default function NewSpinnerPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CampaignCreate>({
    name: '',
    slug: '',
    twitter_account_to_follow: '',
    start_date: null,
    end_date: null,
    // Prize Pool for Spinner
    prize_pool_amount: 0,
    // Distribution
    distribution_strategy: 'INSTANT',
    distribution_winners_count: 1,
    type: 'SPINNER', // Fixed type
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : null) : (value || null)
    }));
  };

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createCampaign(formData);
      toast.success('Spinner created successfully!');
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof APIException) {
        toast.error(err.detail);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper for high-contrast input classes
  const inputClass = "w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all duration-200";
  const inputWithIconClass = "w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all duration-200";

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-400 transition-colors text-sm font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
            <Dices className="w-8 h-8 text-pink-400" />
            Create Prize Spinner
        </h1>
        <p className="text-slate-400 mt-1">Generate a lucky spin link for your community to win airtime!</p>
      </div>

      <div className="card shadow-xl shadow-purple-500/5 border-t border-white/10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="name">
              Spinner Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Type className="w-5 h-5" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                className={inputWithIconClass}
                placeholder="Ex. Weekly Community Drop"
                value={formData.name}
                onChange={handleNameChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="slug">
              URL Slug <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Hash className="w-5 h-5" />
              </div>
              <input
                type="text"
                id="slug"
                name="slug"
                className={inputWithIconClass}
                placeholder="weekly-drop-1"
                value={formData.slug}
                onChange={handleChange}
                pattern="^[a-z0-9-]+$"
                title="Only lowercase letters, numbers, and hyphens"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-1 pl-1">
              Link: <span className="text-purple-400">/spin/{formData.slug || 'your-slug'}</span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="twitter_account_to_follow">
              Host Twitter Account <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                id="twitter_account_to_follow"
                name="twitter_account_to_follow"
                className={inputWithIconClass}
                placeholder="elonmusk"
                value={formData.twitter_account_to_follow}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Airtime Prize Pool */}
          <div className="space-y-4 pt-4 border-t border-slate-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Banknote className="w-5 h-5 text-green-400" />
              Airtime Prize Pool
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white" htmlFor="prize_pool_amount">Total Prize Pool (₦)</label>
                <input
                  type="number"
                  id="prize_pool_amount"
                  name="prize_pool_amount"
                  className={inputClass}
                  placeholder="e.g. 10000"
                  min="0"
                  value={formData.prize_pool_amount || ''}
                  onChange={handleChange}
                />
                <p className="text-xs text-slate-500">Total airtime to be distributed among winners.</p>
              </div>
               <div className="space-y-2">
                <label className="text-sm font-medium text-white" htmlFor="distribution_winners_count">Max Winners</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    id="distribution_winners_count"
                    name="distribution_winners_count"
                    className={inputWithIconClass}
                    placeholder="e.g. 50"
                    min="1"
                    value={formData.distribution_winners_count}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
            <button
              type="submit"
              className="btn bg-purple-600 hover:bg-purple-700 text-white flex-1 shadow-lg shadow-purple-500/20"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Spinner...
                </>
              ) : (
                'Generate Spinner Link'
              )}
            </button>
            <Link 
              href="/dashboard" 
              className="btn btn-secondary px-6"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
