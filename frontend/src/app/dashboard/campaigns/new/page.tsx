'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { createCampaign, APIException } from '@/lib/api';
import type { CampaignCreate } from '@/types';
import { ArrowLeft, Loader2, Calendar, User, Hash, Type, Gift, Clock, Users, Banknote, Percent, SplitSquareVertical, Megaphone } from 'lucide-react';

export default function NewCampaignPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CampaignCreate>({
    name: '',
    slug: '',
    twitter_account_to_follow: '',
    start_date: null,
    end_date: null,
    // Airtime Reward
    reward_amount: 0,
    currency: 'NGN',
    // Distribution
    distribution_strategy: 'INSTANT',
    distribution_split_immediate_percentage: 100,
    distribution_delay_min_minutes: null,
    distribution_delay_max_minutes: null,
    distribution_winners_count: 1,
    type: 'STANDARD',
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
      toast.success('Campaign created successfully!');
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
  const inputClass = "w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all duration-200";
  const inputWithIconClass = "w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all duration-200";

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors text-sm font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-purple-400" />
          Create Campaign
        </h1>
        <p className="text-slate-400 mt-1">Set up a new airtime giveaway campaign</p>
      </div>

      <div className="card shadow-xl shadow-sky-500/5 border-t border-white/10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="name">
              Campaign Name <span className="text-red-400">*</span>
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
                placeholder="Ex. Summer Giveaway 2024"
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
                placeholder="summer-giveaway-2024"
                value={formData.slug}
                onChange={handleChange}
                pattern="^[a-z0-9-]+$"
                title="Only lowercase letters, numbers, and hyphens"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-1 pl-1">
              Your campaign will be at: <span className="text-sky-400">/join/{formData.slug || 'your-slug'}</span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="twitter_account_to_follow">
              Twitter Account to Follow <span className="text-red-400">*</span>
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
            <p className="text-xs text-slate-500 mt-1 pl-1">
              Enter the username without the @ symbol
            </p>
          </div>

          {/* Airtime Reward Configuration */}
          <div className="space-y-4 pt-4 border-t border-slate-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Banknote className="w-5 h-5 text-green-400" />
              Airtime Reward
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white" htmlFor="reward_amount">Amount per Participant (₦)</label>
                <input
                  type="number"
                  id="reward_amount"
                  name="reward_amount"
                  className={inputClass}
                  placeholder="e.g. 100"
                  min="0"
                  value={formData.reward_amount || ''}
                  onChange={handleChange}
                />
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
                    placeholder="e.g. 10"
                    min="1"
                    value={formData.distribution_winners_count}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Distribution Strategy */}
          <div className="space-y-4 pt-4 border-t border-slate-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-sky-400" />
              Distribution Strategy
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div 
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  formData.distribution_strategy === 'INSTANT' 
                    ? 'bg-sky-500/20 border-sky-500 ring-1 ring-sky-500' 
                    : 'bg-slate-800/50 border-slate-600 hover:border-slate-500'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, distribution_strategy: 'INSTANT', distribution_split_immediate_percentage: 100 }))}
              >
                <div className="flex items-center gap-2 font-medium text-white mb-1">
                  <Gift className="w-4 h-4" /> Instant
                </div>
                <p className="text-xs text-slate-400">100% sent immediately after verification.</p>
              </div>

              <div 
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  formData.distribution_strategy === 'SPLIT' 
                    ? 'bg-sky-500/20 border-sky-500 ring-1 ring-sky-500' 
                    : 'bg-slate-800/50 border-slate-600 hover:border-slate-500'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, distribution_strategy: 'SPLIT', distribution_split_immediate_percentage: 50 }))}
              >
                <div className="flex items-center gap-2 font-medium text-white mb-1">
                  <SplitSquareVertical className="w-4 h-4" /> Split
                </div>
                <p className="text-xs text-slate-400">A % now, the rest after a delay window.</p>
              </div>
            </div>

            {formData.distribution_strategy === 'SPLIT' && (
              <div className="space-y-4 animate-fade-in p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white" htmlFor="distribution_split_immediate_percentage">
                    Immediate Percentage
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Percent className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      id="distribution_split_immediate_percentage"
                      name="distribution_split_immediate_percentage"
                      className={inputWithIconClass}
                      placeholder="e.g. 50"
                      min="0"
                      max="100"
                      value={formData.distribution_split_immediate_percentage}
                      onChange={handleChange}
                    />
                  </div>
                  <p className="text-xs text-slate-500">e.g., 50 means 50% now, 50% later.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white" htmlFor="distribution_delay_min_minutes">
                      Delay Start (Minutes)
                    </label>
                    <div className="relative">
                       <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Clock className="w-4 h-4" />
                      </div>
                      <input
                        type="number"
                        id="distribution_delay_min_minutes"
                        name="distribution_delay_min_minutes"
                        className={inputWithIconClass}
                        placeholder="e.g. 1440 (24h)"
                        min="0"
                        value={formData.distribution_delay_min_minutes || ''}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white" htmlFor="distribution_delay_max_minutes">
                      Delay End (Minutes)
                    </label>
                     <div className="relative">
                       <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Clock className="w-4 h-4" />
                      </div>
                      <input
                        type="number"
                        id="distribution_delay_max_minutes"
                        name="distribution_delay_max_minutes"
                        className={inputWithIconClass}
                        placeholder="e.g. 2880 (48h)"
                        min="0"
                        value={formData.distribution_delay_max_minutes || ''}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-700">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white" htmlFor="start_date">
                Start Date
              </label>
              <div className="relative">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Calendar className="w-5 h-5" />
                </div>
                <input
                  type="datetime-local"
                  id="start_date"
                  name="start_date"
                  className={inputWithIconClass + " [color-scheme:dark]"}
                  value={formData.start_date || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white" htmlFor="end_date">
                End Date
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Calendar className="w-5 h-5" />
                </div>
                <input
                  type="datetime-local"
                  id="end_date"
                  name="end_date"
                  className={inputWithIconClass + " [color-scheme:dark]"}
                  value={formData.end_date || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
            <button
              type="submit"
              className="btn btn-primary flex-1 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Campaign'
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
