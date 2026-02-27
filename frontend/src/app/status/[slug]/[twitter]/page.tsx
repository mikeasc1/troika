'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { checkJoinStatus, APIException } from '@/lib/api';
import type { JoinStatusResponse } from '@/types';

export default function StatusPage() {
  const params = useParams();
  const slug = params.slug as string;
  const twitter = params.twitter as string;

  const [status, setStatus] = useState<JoinStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    try {
      const data = await checkJoinStatus(slug, twitter);
      setStatus(data);
    } catch (err) {
      if (err instanceof APIException) {
        setError(err.detail);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 30 seconds for status updates
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [slug, twitter]);

  if (loading) {
    return (
      <div className="page-center">
        <span className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-center">
        <div className="auth-container">
          <div className="card" style={{ textAlign: 'center' }}>
            <h1 style={{ marginBottom: 'var(--space-md)' }}>Not Found</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
            <Link href={`/join/${slug}`} style={{ marginTop: 'var(--space-lg)', display: 'inline-block' }}>
              Join this campaign →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-center">
      <div className="auth-container">
        <div className="card" style={{ textAlign: 'center' }}>
          {status?.is_following ? (
            <>
              <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>✅</div>
              <h1 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-success)' }}>
                Verified!
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                You&apos;re verified as a follower of @{status.twitter_account_to_follow}.
                Your rewards will be delivered automatically.
              </p>

              <div style={{ 
                padding: 'var(--space-md)',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: 'var(--radius-md)',
              }}>
                <p style={{ fontWeight: 500, color: 'var(--color-success)' }}>
                  🎁 Rewards coming soon!
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: 'var(--space-xs)' }}>
                  50% within 5 mins, 50% within 24-48 hours
                </p>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>⏳</div>
              <h1 style={{ marginBottom: 'var(--space-md)' }}>
                Pending Verification
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                {status?.message}
              </p>

              <a
                href={`https://twitter.com/intent/follow?screen_name=${status?.twitter_account_to_follow}`}
                target="_blank"
                rel="noopener noreferrer"
                className="twitter-btn"
                style={{ display: 'inline-flex', marginBottom: 'var(--space-lg)' }}
              >
                Follow @{status?.twitter_account_to_follow}
              </a>

              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Verification happens automatically within an hour.
                <br />
                This page will refresh automatically.
              </p>
            </>
          )}

          {/* Share link */}
          <div style={{ 
            marginTop: 'var(--space-xl)', 
            padding: 'var(--space-md)',
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
          }}>
            <p style={{ fontWeight: 500, marginBottom: 'var(--space-sm)' }}>
              Share & earn more chances!
            </p>
            <code style={{ 
              display: 'block',
              padding: 'var(--space-sm)',
              background: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              wordBreak: 'break-all',
            }}>
              {typeof window !== 'undefined' 
                ? `${window.location.origin}/join/${slug}?ref=${twitter}`
                : ''}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
