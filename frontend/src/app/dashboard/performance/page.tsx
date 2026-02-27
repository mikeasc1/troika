'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Loader2, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getVerificationLogs, getDeliveryLogs } from '@/lib/api';
import type { VerificationLog, DeliveryLog } from '@/types/logs';

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState<'verification' | 'delivery'>('verification');
  const [loading, setLoading] = useState(true);
  const [verLogs, setVerLogs] = useState<VerificationLog[]>([]);
  const [delLogs, setDelLogs] = useState<DeliveryLog[]>([]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      if (activeTab === 'verification') {
        const data = await getVerificationLogs();
        setVerLogs(data);
      } else {
        const data = await getDeliveryLogs();
        setDelLogs(data);
      }
    } catch (error) {
      toast.error('Failed to load logs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Logs</h1>
          <p className="text-gray-500">View real-time verification and reward delivery activity.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('verification')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'verification'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Verification Logs
        </button>
        <button
          onClick={() => setActiveTab('delivery')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'delivery'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Delivery Logs
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading && (verLogs.length === 0 && delLogs.length === 0) ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : activeTab === 'verification' ? (
          <VerificationTable logs={verLogs} />
        ) : (
          <DeliveryTable logs={delLogs} />
        )}
      </div>
    </div>
  );
}

function VerificationTable({ logs }: { logs: VerificationLog[] }) {
  if (logs.length === 0) {
    return <div className="p-8 text-center text-gray-500">No verification logs found.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 font-medium text-gray-500">Time</th>
            <th className="px-6 py-3 font-medium text-gray-500">Campaign</th>
            <th className="px-6 py-3 font-medium text-gray-500">Participant</th>
            <th className="px-6 py-3 font-medium text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                {new Date(log.checked_at).toLocaleString()}
              </td>
              <td className="px-6 py-4 font-medium text-gray-900">{log.campaign}</td>
              <td className="px-6 py-4 text-indigo-600">@{log.participant}</td>
              <td className="px-6 py-4">
                {log.was_following ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Following
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <XCircle className="w-3.5 h-3.5" />
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
  if (logs.length === 0) {
    return <div className="p-8 text-center text-gray-500">No delivery logs found.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 font-medium text-gray-500">Time</th>
            <th className="px-6 py-3 font-medium text-gray-500">Participant</th>
            <th className="px-6 py-3 font-medium text-gray-500">Phase</th>
            <th className="px-6 py-3 font-medium text-gray-500">Reward</th>
            <th className="px-6 py-3 font-medium text-gray-500">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                {new Date(log.created_at).toLocaleString()}
              </td>
              <td className="px-6 py-4">
                <div className="text-gray-900 font-medium">@{log.participant}</div>
                <div className="text-xs text-gray-500">{log.recipient}</div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  Phase {log.phase}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="text-gray-900">{log.amount.toLocaleString()}</div>
                <div className="text-xs text-gray-500 uppercase">{log.reward_type}</div>
              </td>
              <td className="px-6 py-4">
                {log.success ? (
                  <div className="flex flex-col">
                    <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Success
                    </span>
                    {log.transaction_ref && log.transaction_ref !== 'manual' && (
                      <span className="text-[10px] text-gray-400 mt-1 font-mono">Ref: {log.transaction_ref}</span>
                    )}
                  </div>
                ) : (
                  <div className="max-w-[200px]">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 mb-1">
                      <XCircle className="w-3.5 h-3.5" />
                      Failed (Attempt {log.curr_attempt})
                    </span>
                    {log.error_message && (
                      <p className="text-xs text-red-600 truncate" title={log.error_message}>
                        {log.error_message}
                      </p>
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
