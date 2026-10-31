/**
 * AI Application Priority & Triage Assistant
 * 
 * Intelligently computes the urgency of student document requests by evaluating:
 * 1. Urgency keywords in student statement of need (Visa, loan, passport, admission deadlines).
 * 2. Document type criticality (Transfer Certificates, Bonafide have higher stakes).
 * 3. Pending wait time / SLA aging (preventing older applications from being overlooked).
 * 4. Target Turnaround (TAT) deadline proximity or overdue status.
 */

// High-impact urgency keywords
const URGENT_KEYWORDS = [
  'urgent',
  'emergency',
  'visa',
  'embassy',
  'passport',
  'interview',
  'joining date',
  'deadline tomorrow',
  'last date',
  'immediate',
  'medical',
  'court',
  'appointment',
  'joining',
  'consulate',
];

const HIGH_PRIORITY_KEYWORDS = [
  'admission',
  'counseling',
  'scholarship',
  'bank loan',
  'education loan',
  'job',
  'offer letter',
  'exam registration',
  'submission',
  'tatkal',
  'relocation',
];

// Document Type Stakes
const DOC_TYPE_WEIGHTS = {
  'transfer certificate': 25,
  'bonafide certificate': 20,
  'course completion certificate': 20,
  'study certificate': 15,
  'character certificate': 10,
  'conduct certificate': 10,
  'medium of instruction certificate': 10,
};

export function evaluateApplicationPriority(request) {
  if (!request) {
    return {
      level: 'NORMAL',
      score: 30,
      badge: 'P4: Normal',
      bgClass: 'bg-slate-50 text-slate-600 border-slate-200',
      dotClass: 'bg-slate-400',
      reasons: ['Standard routine application'],
      recommendation: 'Process through standard workflow.',
    };
  }

  let score = 20; // Base baseline score
  const reasons = [];

  // 1. Analyze Stated Purpose & Urgency Keywords
  const reasonText = (request.reason || '').toLowerCase();
  const foundUrgent = [];
  const foundHigh = [];

  URGENT_KEYWORDS.forEach((kw) => {
    if (reasonText.includes(kw)) foundUrgent.push(kw);
  });
  HIGH_PRIORITY_KEYWORDS.forEach((kw) => {
    if (reasonText.includes(kw)) foundHigh.push(kw);
  });

  if (foundUrgent.length > 0) {
    score += 45;
    reasons.push(
      `Time-critical purpose detected: "${foundUrgent.slice(0, 2).join(', ')}"`
    );
  } else if (foundHigh.length > 0) {
    score += 25;
    reasons.push(
      `Deadline or milestone indicated: "${foundHigh.slice(0, 2).join(', ')}"`
    );
  }

  // 2. Document Type Criticality Weight
  const docTypeName = (request.doc_type_name || '').toLowerCase();
  for (const [dt, wt] of Object.entries(DOC_TYPE_WEIGHTS)) {
    if (docTypeName.includes(dt)) {
      score += wt;
      if (wt >= 20) {
        reasons.push(`High-stakes certificate category (${request.doc_type_name})`);
      }
      break;
    }
  }

  // 3. Pending Duration (Aging SLA Boost)
  if (request.created_at) {
    const created = new Date(request.created_at);
    const now = new Date();
    const waitHours = Math.round((now - created) / (1000 * 60 * 60));
    const waitDays = Math.round(waitHours / 24);

    if (request.status === 'pending') {
      if (waitDays >= 5) {
        score += 35;
        reasons.push(`Pending for ${waitDays} days (SLA escalation alert)`);
      } else if (waitDays >= 2) {
        score += 15;
        reasons.push(`Awaiting review for ${waitDays} days`);
      }
    }
  }

  // 4. Turnaround (TAT) Deadline Proximity
  if (request.tat?.expected_by) {
    const tatDate = new Date(request.tat.expected_by);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    tatDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((tatDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0 && request.status === 'pending') {
      score += 45;
      reasons.push(`Target completion was ${request.tat.expected_by} (OVERDUE)`);
    } else if (diffDays <= 1 && request.status === 'pending') {
      score += 25;
      reasons.push(`Target completion due within 24-48 hours`);
    }
  }

  // Clamp final score 0-100
  const finalScore = Math.max(10, Math.min(100, score));

  // Determine Level & Palette
  if (finalScore >= 75) {
    return {
      level: 'URGENT',
      score: finalScore,
      badge: 'P1: Urgent',
      bgClass: 'bg-rose-50 text-rose-700 border-rose-200',
      dotClass: 'bg-rose-500',
      reasons: reasons.length > 0 ? reasons : ['High priority requirement identified by AI'],
      recommendation: 'Fast-track: Immediate review required within 24 hours.',
    };
  } else if (finalScore >= 55) {
    return {
      level: 'HIGH',
      score: finalScore,
      badge: 'P2: High',
      bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500',
      reasons: reasons.length > 0 ? reasons : ['Time-sensitive documentation needed'],
      recommendation: 'Priority queue: Process within 1-2 business days.',
    };
  } else if (finalScore >= 35) {
    return {
      level: 'MEDIUM',
      score: finalScore,
      badge: 'P3: Medium',
      bgClass: 'bg-blue-50 text-blue-700 border-blue-200',
      dotClass: 'bg-blue-500',
      reasons: reasons.length > 0 ? reasons : ['Standard institutional verification'],
      recommendation: 'Standard queue: Process within regular turnaround schedule.',
    };
  } else {
    return {
      level: 'NORMAL',
      score: finalScore,
      badge: 'P4: Normal',
      bgClass: 'bg-slate-50 text-slate-600 border-slate-200',
      dotClass: 'bg-slate-400',
      reasons: reasons.length > 0 ? reasons : ['Routine document request'],
      recommendation: 'Routine queue: Standard turnaround.',
    };
  }
}
