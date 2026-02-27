'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Settings, Key, Phone, Loader2, Save, ShieldCheck, Trash2, Plus, Copy } from 'lucide-react';
import { getCredentials, addApifyKey, deleteApifyKey, saveVtuCredentials, APIException } from '@/lib/api';
import type { CredentialInfo } from '@/types';

export default function SettingsPage() {
  const [apifyKeys, setApifyKeys] = useState<CredentialInfo[]>([]);
  const [newApifyKey, setNewApifyKey] = useState('');
  const [newApifyLabel, setNewApifyLabel] = useState('');
  
  const [vtuUsername, setVtuUsername] = useState('');
  const [vtuPassword, setVtuPassword] = useState('');
  const [vtuMasked, setVtuMasked] = useState('');
  
  const [savingApify, setSavingApify] = useState(false);
  const [savingVtu, setSavingVtu] = useState(false);
  const [loadingCreds, setLoadingCreds] = useState(true);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = () => {
    setLoadingCreds(true);
    getCredentials()
      .then((creds) => {
        setApifyKeys(creds.apify);
        if (creds.vtu.length > 0) {
          setVtuMasked(creds.vtu[0].masked_value);
        }
      })
      .catch(() => {
        // Silently fail — user may not have credentials yet
      })
      .finally(() => setLoadingCreds(false));
  };

  const handleAddApify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApifyKey) return;
    
    setSavingApify(true);
    try {
      const res = await addApifyKey({ api_key: newApifyKey, label: newApifyLabel || 'My Key' });
      toast.success(res.message);
      setNewApifyKey('');
      setNewApifyLabel('');
      fetchCredentials(); // Refresh list
    } catch (err) {
      if (err instanceof APIException) {
        toast.error(err.detail);
      } else {
        toast.error('Failed to add Apify API Key');
      }
    } finally {
      setSavingApify(false);
    }
  };

  const handleDeleteApify = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this API key? This cannot be undone.')) return;
    
    try {
      await deleteApifyKey(id);
      toast.success('API Key deleted successfully');
      setApifyKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete API Key');
    }
  };

  const handleSaveVtu = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVtu(true);
    try {
      const res = await saveVtuCredentials({ username: vtuUsername, password: vtuPassword });
      toast.success(res.message);
      setVtuMasked('***' + vtuUsername.slice(-4));
      setVtuUsername('');
      setVtuPassword('');
    } catch (err) {
      if (err instanceof APIException) {
        toast.error(err.detail);
      } else {
        toast.error('Failed to save VTU credentials');
      }
    } finally {
      setSavingVtu(false);
    }
  };

  const inputClass = "w-full bg-white/[0.07] border border-slate-600 rounded-lg py-2.5 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all duration-200";

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-purple-400" />
          Settings
        </h1>
        <p className="text-slate-400 mt-2">Manage your API credentials for Twitter verification and Airtime delivery.</p>
      </div>

      <div className="space-y-8">
        {/* Apify Credentials */}
        <div className="card shadow-xl shadow-sky-500/5 border-t border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-amber-400" />
            Apify Credentials
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Add multiple Apify keys to rotate usage and avoid rate limits. Get your keys from <a href="https://console.apify.com/account#/integrations" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">Apify Console</a>.
          </p>

          {/* List of Keys */}
          {apifyKeys.length > 0 && (
            <div className="space-y-3 mb-8">
              {apifyKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Key className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{key.label || 'Unnamed Key'}</p>
                      <p className="text-xs font-mono text-slate-400">{key.masked_value}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteApify(key.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Key Form */}
          <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-400" />
              Add New Key
            </h3>
            <form onSubmit={handleAddApify} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Label (Optional)</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Personal Key"
                    value={newApifyLabel}
                    onChange={(e) => setNewApifyLabel(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">API Key</label>
                  <input
                    type="password"
                    className={inputClass}
                    placeholder="apify_api_..."
                    value={newApifyKey}
                    onChange={(e) => setNewApifyKey(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn btn-primary shadow-lg shadow-sky-500/20 w-full sm:w-auto text-sm"
                  disabled={savingApify || !newApifyKey}
                >
                  {savingApify ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
                  ) : (
                    'Add Key'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* VTU.ng Credentials */}
        <div className="card shadow-xl shadow-green-500/5 border-t border-white/10">
          <form onSubmit={handleSaveVtu} className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-400" />
              VTU.ng Credentials
            </h2>
            <p className="text-sm text-slate-400">
              Connect your VTU.ng account for automatic airtime delivery. Sign up at <a href="https://vtu.ng" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">vtu.ng</a>.
            </p>
            {vtuMasked && (
              <div className="text-sm text-slate-400 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700 mb-2">
                Current user: <code className="text-emerald-400">{vtuMasked}</code>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white" htmlFor="vtu_username">Username</label>
                <input
                  type="text"
                  id="vtu_username"
                  name="vtu_username"
                  className={inputClass}
                  placeholder="Your VTU.ng username"
                  value={vtuUsername}
                  onChange={(e) => setVtuUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white" htmlFor="vtu_password">Password</label>
                <input
                  type="password"
                  id="vtu_password"
                  name="vtu_password"
                  className={inputClass}
                  placeholder="Your VTU.ng password"
                  value={vtuPassword}
                  onChange={(e) => setVtuPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 w-full sm:w-auto"
                disabled={savingVtu || !vtuUsername || !vtuPassword}
              >
                {savingVtu ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save VTU Credentials</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security Note */}
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">Your credentials are encrypted</p>
            <p className="text-xs text-slate-400 mt-1">All API keys and passwords are stored securely using industry-standard encryption. We never store your credentials in plain text.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
