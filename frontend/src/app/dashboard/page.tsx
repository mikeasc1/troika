'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listCampaigns, deleteCampaign, APIException } from '@/lib/api';
import type { CampaignResponse } from '@/types';
import { Plus, Copy, Trash2, ExternalLink, Activity, Users, Zap, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<CampaignResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCampaigns = async () => {
    try {
      const data = await listCampaigns();
      setCampaigns(data);
    } catch (err) {
      if (err instanceof APIException) {
        setError(err.detail);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      await deleteCampaign(slug);
      setCampaigns((prev) => prev.filter((c) => c.slug !== slug));
    } catch (err) {
      if (err instanceof APIException) {
        setError(err.detail);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getShareUrl = (slug: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/join/${slug}`;
  };

  const copyLink = async (slug: string) => {
    await navigator.clipboard.writeText(getShareUrl(slug));
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">My Campaigns</h1>
          <p className="text-slate-400 text-sm mt-1">Manage all your active giveaways</p>
        </div>
        <Link href="/dashboard/campaigns/new" className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Create Campaign
        </Link>
      </div>

      {error && <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">{error}</div>}

      {campaigns.length === 0 ? (
        <div className="card text-center py-20 flex flex-col items-center">
          <div className="bg-accent-alt/10 p-4 rounded-full mb-6">
            <Zap className="w-12 h-12 text-accent-alt" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">No campaigns yet</h3>
          <p className="text-slate-400 mb-8 max-w-sm">
            Create your first viral Twitter giveaway campaign and start growing your audience.
          </p>
          <Link href="/dashboard/campaigns/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="card group hover:border-primary/30 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-lg font-semibold truncate text-foreground group-hover:text-primary transition-colors">{campaign.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    For @{campaign.twitter_account_to_follow}
                  </p>
                </div>
                <span className={`badge ${campaign.is_active ? 'badge-success' : 'badge-warning'}`}>
                  {campaign.is_active ? 'Active' : 'Paused'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Activity className="w-3 h-3" />
                    Status
                  </div>
                  <div className="font-medium text-foreground text-sm">Running</div>
                </div>
                <div className="bg-surface/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Users className="w-3 h-3" />
                    Created
                  </div>
                  <div className="font-medium text-foreground text-sm">{formatDate(campaign.created_at)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                <button
                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  onClick={() => copyLink(campaign.slug)}
                  title="Copy Link"
                >
                  <Copy className="w-4 h-4" />
                </button>
                
                <Link
                  href={`/dashboard/campaigns/${campaign.slug}`}
                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="View Details"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
                
                <div className="flex-1"></div>
                
                <button
                  className="p-2 text-muted-foreground hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                  onClick={() => handleDelete(campaign.slug)}
                  title="Delete Campaign"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
