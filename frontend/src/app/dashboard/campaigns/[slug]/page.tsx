'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCampaign, getVerificationLogs, getDeliveryLogs, APIException } from '@/lib/api';
import type { CampaignResponse } from '@/types';
import type { VerificationLog, DeliveryLog } from '@/types/logs';
import { 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  Calendar, 
  Twitter, 
  Share2, 
  BarChart3,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

export default function CampaignDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [campaign, setCampaign] = useState<CampaignResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Logs state
  const [logType, setLogType] = useState<'verification' | 'delivery'>('verification');
  const [verLogs, setVerLogs] = useState<VerificationLog[]>([]);
  const [delLogs, setDelLogs] = useState<DeliveryLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    getCampaign(slug)
      .then(setCampaign)
      .catch((err) => {
        if (err instanceof APIException) {
          setError(err.detail);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (campaign) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 30000);
      return () => clearInterval(interval);
    }
  }, [campaign, logType]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      if (logType === 'verification') {
        const data = await getVerificationLogs(0, 100, slug);
        setVerLogs(data);
      } else {
        const data = await getDeliveryLogs(0, 100, slug);
        setDelLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/join/${slug}`;
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(getShareUrl());
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="bg-error/10 text-error px-6 py-4 rounded-lg inline-block mb-6">
          {error || 'Campaign not found'}
        </div>
        <br />
        <Link href="/dashboard" className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-foreground">{campaign.name}</h1>
          <span className={`badge ${campaign.is_active ? 'badge-success' : 'badge-warning'} self-start`}>
            {campaign.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Sharing & Details
            </h2>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-400 mb-2 block">Campaign URL</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-surface/50 border border-border rounded-lg px-4 py-2.5 text-sm text-slate-300 font-mono truncate">
                    {getShareUrl()}
                  </div>
                  <button 
                    onClick={copyLink} 
                    className="btn btn-primary"
                    title="Copy Link"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                  <a 
                    href={getShareUrl()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    title="Open Public Page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="pt-6 border-t border-border/50">
                <label className="text-sm font-medium text-slate-400 mb-2 block">Target Account</label>
                <a
                  href={`https://twitter.com/${campaign.twitter_account_to_follow}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/20"
                >
                  <Twitter className="w-4 h-4" />
                  @{campaign.twitter_account_to_follow}
                </a>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Performance Logs
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-800/50 border border-border rounded-lg p-1">
                  <button 
                    onClick={() => setLogType('verification')} 
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${logType === 'verification' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    Verification
                  </button>
                  <button 
                    onClick={() => setLogType('delivery')} 
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${logType === 'delivery' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    Delivery
                  </button>
                </div>
                <button 
                  onClick={fetchLogs} 
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
                  title="Refresh Logs"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="border border-border/50 rounded-lg overflow-hidden bg-surface/30">
              {loadingLogs && (verLogs.length === 0 && delLogs.length === 0) ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : (logType === 'verification' && verLogs.length === 0) || (logType === 'delivery' && delLogs.length === 0) ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No {logType} logs found for this campaign yet.
                </div>
              ) : logType === 'verification' ? (
                <VerificationTable logs={verLogs} />
              ) : (
                <DeliveryTable logs={delLogs} />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold mb-4 text-slate-200">Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="bg-surface p-2 rounded-lg h-fit">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Start Date</p>
                  <p className="text-sm font-medium">{formatDate(campaign.start_date)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-surface p-2 rounded-lg h-fit">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">End Date</p>
                  <p className="text-sm font-medium">{formatDate(campaign.end_date)}</p>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-border/50">
                <p className="text-xs text-slate-500">
                  Created on {new Date(campaign.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationTable({ logs }: { logs: VerificationLog[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-800/50 border-b border-border/50 text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Time</th>
            <th className="px-4 py-3 font-medium">Participant</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
              <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                {new Date(log.checked_at).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-sky-400">@{log.participant}</td>
              <td className="px-4 py-3">
                {log.was_following ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-3 h-3" />
                    Following
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                    <XCircle className="w-3 h-3" />
                    Not Following
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeliveryTable({ logs }: { logs: DeliveryLog[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-800/50 border-b border-border/50 text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Time</th>
            <th className="px-4 py-3 font-medium">Recipient</th>
            <th className="px-4 py-3 font-medium">Reward</th>
            <th className="px-4 py-3 font-medium">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
              <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                {new Date(log.created_at).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <div className="text-slate-200">@{log.participant}</div>
                <div className="text-xs text-slate-500">{log.recipient}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-slate-200">{log.amount.toLocaleString()}</div>
                <div className="text-xs text-slate-500 uppercase">{log.reward_type} (Ph {log.phase})</div>
              </td>
              <td className="px-4 py-3">
                {log.success ? (
                  <div className="flex flex-col">
                    <span className="inline-flex w-fit items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" />
                      Success
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col max-w-[150px]">
                    <span className="inline-flex w-fit items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 mb-1">
                      <XCircle className="w-3 h-3" />
                      Failed
                    </span>
                    {log.error_message && (
                      <span className="text-[10px] text-red-400/80 truncate" title={log.error_message}>
                        {log.error_message}
                      </span>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
