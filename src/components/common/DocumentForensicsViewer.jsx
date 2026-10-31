import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileSearch,
  Scan,
  Calendar,
  Type,
  Eye,
  Layers,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const DocumentForensicsViewer = ({ report, onClose }) => {
  const [showEla, setShowEla] = useState(false);
  const [showRawText, setShowRawText] = useState(false);

  if (!report) return null;

  const {
    fileName,
    verdict,
    authenticityScore,
    summary,
    anomalies = [],
    metrics = {},
    extractedData = {},
    elaImageUrl,
  } = report;

  const isAuthentic = verdict === 'AUTHENTIC';
  const isSuspicious = verdict === 'SUSPICIOUS';
  const isTampered = verdict === 'TAMPERED_OR_AI_GENERATED';

  const badgeConfig = isAuthentic
    ? {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
        label: 'Authentic Original',
        desc: 'Document meets institutional verification standards.',
      }
    : isSuspicious
    ? {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
        label: 'Suspicious / Inconsistent',
        desc: 'Minor font variance or date anomalies detected. Manual review recommended.',
      }
    : {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
        label: 'Tampered / AI Generated Risk',
        desc: 'High probability of altered dates, font splicing, or synthetic generation.',
      };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-lg p-5 space-y-5">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              AI Document Forensics & Authenticity Report
            </h4>
            <p className="text-xs text-slate-500 font-mono truncate max-w-xs sm:max-w-md">
              Target: {fileName}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-md hover:bg-slate-100 transition-all"
          >
            Close
          </button>
        )}
      </div>

      {/* Main Verdict & Gauge */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-slate-50/80 p-4 rounded-xl border border-slate-100">
        {/* Score Circle / Progress */}
        <div className="flex flex-col items-center justify-center text-center sm:border-r sm:border-slate-200/60 sm:pr-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Authenticity Index
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              className={`text-3xl font-extrabold font-mono ${
                authenticityScore >= 80
                  ? 'text-emerald-600'
                  : authenticityScore >= 55
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
            >
              {authenticityScore}%
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${
                authenticityScore >= 80
                  ? 'bg-emerald-500'
                  : authenticityScore >= 55
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${authenticityScore}%` }}
            />
          </div>
        </div>

        {/* Verdict Badge */}
        <div className="sm:col-span-2 space-y-1.5">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-semibold ${badgeConfig.bg}`}
          >
            {badgeConfig.icon}
            <span>{badgeConfig.label}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {summary}
          </p>
        </div>
      </div>

      {/* Multi-Layer Forensic Metrics */}
      <div>
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          Forensic Inspection Layers
        </h5>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 1. Font Consistency */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-medium flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-blue-500" />
                Font Uniformity
              </span>
              <span className="text-xs font-bold font-mono text-slate-700">
                {metrics.fontConsistency || 85}%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Detects spliced font sizes or mismatched kerning
            </p>
          </div>

          {/* 2. Date Integrity */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Date Chronology
              </span>
              <span className="text-xs font-bold font-mono text-slate-700">
                {metrics.dateIntegrity || 90}%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Verifies calendar syntax and future/retroactive dates
            </p>
          </div>

          {/* 3. Error Level Analysis */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-medium flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                ELA Uniformity
              </span>
              <span className="text-xs font-bold font-mono text-slate-700">
                {metrics.elaUniformity || 88}%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Detects compression artifacts from digital overlays
            </p>
          </div>

          {/* 4. OCR Confidence */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-medium flex items-center gap-1">
                <FileSearch className="w-3.5 h-3.5 text-emerald-500" />
                OCR Confidence
              </span>
              <span className="text-xs font-bold font-mono text-slate-700">
                {metrics.ocrConfidence || 92}%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Text optical clarity and character confidence
            </p>
          </div>
        </div>
      </div>

      {/* Anomalies Detected (if any) */}
      {anomalies && anomalies.length > 0 && (
        <div className="p-3.5 bg-rose-50/70 border border-rose-200/70 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Detected Forensic Anomalies ({anomalies.length}):</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc text-xs text-rose-700 font-medium">
            {anomalies.map((anom, idx) => (
              <li key={idx} className="leading-relaxed">
                {anom.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extracted Metadata (Dates, USN, Institution) */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-xs space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          Extracted OCR Intelligence
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <span className="text-slate-400 block text-[11px]">Identified Dates:</span>
            <span className="font-semibold text-slate-700 font-mono">
              {extractedData.dates && extractedData.dates.length > 0
                ? extractedData.dates.join(', ')
                : 'None detected'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Identified Student USN:</span>
            <span className="font-semibold text-slate-700 font-mono">
              {extractedData.usn || 'Not recognized in header'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Identified Institution:</span>
            <span className="font-semibold text-slate-700">
              {extractedData.institution || 'Standard template'}
            </span>
          </div>
        </div>

        {/* Raw Text Drawer */}
        {extractedData.sampleText && (
          <div className="pt-2 border-t border-slate-200/60">
            <button
              type="button"
              onClick={() => setShowRawText(!showRawText)}
              className="text-[11px] text-blue-600 font-medium flex items-center gap-1 hover:underline"
            >
              <span>{showRawText ? 'Hide' : 'View'} Extracted Text Preview</span>
              {showRawText ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showRawText && (
              <pre className="mt-2 p-2.5 bg-slate-100 rounded-lg text-[10px] font-mono text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                {extractedData.sampleText}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* ELA Heatmap Toggle (Visual Evidence) */}
      {elaImageUrl && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowEla(!showEla)}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Eye className="w-4 h-4 text-purple-600" />
            <span>{showEla ? 'Hide' : 'Inspect'} Error Level Analysis (ELA Heatmap)</span>
          </button>

          {showEla && (
            <div className="mt-3 p-3 bg-slate-900 rounded-xl text-center space-y-2">
              <p className="text-[11px] text-slate-300">
                High-frequency bright spots highlight digital text additions, date modifications, or Photoshop brush layers:
              </p>
              <img
                src={elaImageUrl}
                alt="Forensic ELA Analysis"
                className="max-h-72 mx-auto rounded-lg border border-slate-700 shadow-md"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
