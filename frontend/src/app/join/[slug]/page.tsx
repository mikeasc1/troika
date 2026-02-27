'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getCampaignInfo, joinCampaign, APIException } from '@/lib/api';
import type { CampaignPublicInfo, ParticipantJoin } from '@/types';
import { Twitter, ArrowRight, Loader2, PartyPopper, Phone, AtSign, CheckCircle2 } from 'lucide-react';

export default function JoinCampaignPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const referer = searchParams.get('ref');

  const [campaign, setCampaign] = useState<CampaignPublicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<ParticipantJoin>({
    twitter_username: '',
    phone_number: '',
    referrer_twitter: referer || null,
  });

  useEffect(() => {
    getCampaignInfo(slug)
      .then(setCampaign)
      .catch((err) => {
        if (err instanceof APIException) {
          setError(err.detail);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await joinCampaign(slug, formData);
      setSuccess(true);
    } catch (err) {
      if (err instanceof APIException) {
        setError(err.detail);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="page-center">
        <div className="max-w-md w-full card text-center">
          <h1 className="text-2xl font-bold mb-2">Campaign Not Found</h1>
          <p className="text-muted">This campaign may have ended or doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="page-center">
        <div className="max-w-md w-full animate-fade-in">
          <div className="card text-center border-primary/20 shadow-2xl shadow-primary/10">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <PartyPopper className="w-10 h-10 text-green-500" />
            </div>
            
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-primary bg-clip-text text-transparent">You&apos;re In!</h1>
            <p className="text-slate-300 mb-8 max-w-sm mx-auto">
              You've successfully joined the giveaway. Now complete your entry by following us.
            </p>
            
            <a
              href={`https://twitter.com/intent/follow?screen_name=${campaign.twitter_account_to_follow}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#1DA1F2] hover:bg-[#1a91da] text-white px-8 py-3 rounded-full font-semibold inline-flex items-center gap-2 transition-all hover:scale-105 mb-8 shadow-lg shadow-[#1DA1F2]/30"
            >
              <Twitter className="w-5 h-5" />
              Follow @{campaign.twitter_account_to_follow}
            </a>

            <div className="bg-surface/50 rounded-xl p-4 border border-border/50 text-left mb-6">
              <p className="text-sm font-medium text-slate-300 mb-2">Share & Boost Your Chances</p>
              <div className="bg-background rounded-lg p-3 border border-border flex items-center gap-2">
                <code className="text-xs text-slate-400 truncate flex-1 block">
                    {typeof window !== 'undefined' 
                      ? `${window.location.origin}/join/${slug}?ref=${formData.twitter_username}`
                      : ''}
                </code>
              </div>
            </div>

            <Link href={`/status/${slug}/${formData.twitter_username}`} className="text-sm text-primary hover:text-primary-hover hover:underline">
              Check verification status →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-center">
      <div className="max-w-md w-full animate-fade-in my-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-primary/20 transform -rotate-6">
            <Twitter className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white">{campaign.name}</h1>
          <p className="text-slate-400 max-w-xs mx-auto">
            Join the exclusive giveaway by following <span className="text-white font-medium">@{campaign.twitter_account_to_follow}</span>
          </p>
        </div>

        <div className="card shadow-2xl shadow-primary/5 border-t border-white/10 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
          
          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-error inline-block"></span>
              {error}
            </div>
          )}

          {referer && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Referred by @{referer}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="twitter_username">
                Twitter Username <span className="text-error">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <AtSign className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  id="twitter_username"
                  name="twitter_username"
                  className="input-field py-3"
                  placeholder="your_handle"
                  value={formData.twitter_username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="phone_number">
                Phone Number <span className="text-error">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  className="input-field py-3"
                  placeholder="08012345678"
                  value={formData.phone_number}
                  onChange={handleChange}
                  required
                  minLength={10}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-3 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 group mt-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  Join Giveaway
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            By joining, you agree to follow @{campaign.twitter_account_to_follow}
          </p>
        </div>
      </div>
    </div>
  );
}
