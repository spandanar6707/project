import React from 'react';
import { Sparkles, AlertCircle, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { evaluateApplicationPriority } from '../../utils/aiPriorityAssistant';

export const AIPriorityCard = ({ request }) => {
  if (!request) return null;

  const priority = evaluateApplicationPriority(request);

  return (
    <div className={`p-4 rounded-xl border shadow-sm transition-all ${priority.bgClass}`}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/80 shadow-xs">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">
            AI Application Priority Assessment
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/90 shadow-xs border border-current">
          <span className={`w-2 h-2 rounded-full ${priority.dotClass}`} />
          <span>{priority.badge} ({priority.score}/100)</span>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <span className="font-semibold text-slate-700 block mb-1">
            Detected Urgency Factors:
          </span>
          <ul className="pl-5 list-disc space-y-1 text-slate-600">
            {priority.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>

        <div className="pt-2 border-t border-current/15 flex items-start gap-1.5 text-slate-700">
          <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="text-[11px] font-medium">
            <strong>AI Recommendation:</strong> {priority.recommendation}
          </span>
        </div>
      </div>
    </div>
  );
};
