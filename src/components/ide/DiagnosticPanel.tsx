'use client';

import { useState } from 'react';
import { X, CheckCircle, XCircle, CircleNotch, Flask } from '@phosphor-icons/react';

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

type Status = 'idle' | 'running' | 'done';

interface DiagnosticPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DiagnosticPanel({ isOpen, onClose }: DiagnosticPanelProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [allOk, setAllOk] = useState<boolean | null>(null);

  const runChecks = async () => {
    setStatus('running');
    setChecks([]);
    setAllOk(null);

    try {
      const res = await fetch('/api/health');
      const data = await res.json();

      // Reveal checks one by one for the satisfying tick effect
      for (let i = 0; i < data.checks.length; i++) {
        await new Promise((r) => setTimeout(r, 350));
        setChecks((prev) => [...prev, data.checks[i]]);
      }

      setAllOk(data.ok);
    } catch (e) {
      setChecks([{ name: 'Health endpoint', ok: false, detail: String(e) }]);
      setAllOk(false);
    } finally {
      setStatus('done');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-canvas rounded-3xl shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-bone">
          <div className="flex items-center gap-2">
            <Flask weight="fill" className="w-5 h-5 text-signal-light" />
            <span className="font-500 text-ink">System Diagnostics</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-bone transition-colors">
            <X className="w-4 h-4 text-slate" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3 min-h-[220px]">
          {status === 'idle' && (
            <div className="flex flex-col items-center justify-center h-36 gap-3">
              <p className="text-sm text-slate text-center">
                Validates workspace, file system, and Codebuff API connectivity.
              </p>
            </div>
          )}

          {checks.map((check, i) => (
            <div
              key={i}
              className="flex items-start gap-3 animate-fade-in"
            >
              {check.ok ? (
                <CheckCircle weight="fill" className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle weight="fill" className="w-5 h-5 text-signal flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-500 text-ink">{check.name}</p>
                <p className="text-xs text-slate truncate">{check.detail}</p>
              </div>
            </div>
          ))}

          {status === 'running' && (
            <div className="flex items-center gap-3">
              <CircleNotch className="w-5 h-5 text-signal-light animate-spin flex-shrink-0" />
              <p className="text-sm text-slate">Running checks…</p>
            </div>
          )}

          {status === 'done' && allOk !== null && (
            <div className={`mt-4 px-4 py-3 rounded-2xl text-sm font-500 text-center ${allOk ? 'bg-green-50 text-green-700' : 'bg-red-50 text-signal'}`}>
              {allOk ? '✅ All systems go — ready to build' : '⚠️ Some checks failed — see details above'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-bone flex justify-end gap-3">
          {status !== 'idle' && (
            <button
              onClick={() => { setStatus('idle'); setChecks([]); setAllOk(null); }}
              className="px-4 py-2 rounded-full text-sm text-slate hover:bg-bone transition-colors"
            >
              Reset
            </button>
          )}
          <button
            onClick={runChecks}
            disabled={status === 'running'}
            className="px-5 py-2 rounded-full bg-ink text-canvas text-sm font-500 hover:bg-ink/90 disabled:opacity-50 transition-colors"
          >
            {status === 'running' ? 'Running…' : status === 'done' ? 'Run Again' : 'Run Checks'}
          </button>
        </div>
      </div>
    </div>
  );
}
