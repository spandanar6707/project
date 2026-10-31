import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  HelpCircle,
  Clock,
  FileText,
  ChevronRight,
  Maximize2,
  Minimize2,
  AlertCircle,
  CheckCircle2,
  Flame,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Institutional & Priority Knowledge Base for AI Copilot
const KNOWLEDGE_BASE = [
  {
    keywords: ['priority', 'urgent', 'expedite', 'fast-track', 'fast', 'quick'],
    answer:
      '⚡ **AI Priority Triage System:**\nApplications are automatically scored and prioritized based on:\n\n1. **P1: Urgent (75-100 pts):** Imminent visa/passport appointments, university counseling deadlines, job joining dates.\n2. **P2: High (55-74 pts):** Education loans, scholarship deadlines, Transfer Certificates.\n3. **P3: Medium (35-54 pts):** Standard academic verification.\n4. **P4: Normal (10-34 pts):** Routine requests.\n\n*Tip:* To receive high-priority queueing, explicitly mention your deadline date and reason (e.g., "Visa appointment on Monday") in your stated purpose!',
  },
  {
    keywords: ['study certificate', 'study'],
    answer:
      '📄 **Study Certificate:**\nVerifies active academic enrollment.\n- **Requirements:** Student ID card & current semester fee receipt.\n- **Turnaround SLA:** 1-2 business days.\n- **Priority:** Medium (escalates to Urgent if an upcoming deadline is stated).',
  },
  {
    keywords: ['bonafide', 'visa', 'passport', 'loan'],
    answer:
      '🛂 **Bonafide Certificate:**\nCertifies genuine student status for passports, visas, scholarships, or bank loans.\n- **Requirements:** Student ID Card and proof of requirement (appointment slip or loan form).\n- **Turnaround SLA:** 1-2 business days.\n- **AI Priority:** Automatically classified as High / Urgent when appointment dates are provided.',
  },
  {
    keywords: ['transfer certificate', 'tc', 'transfer', 'migration'],
    answer:
      '🎓 **Transfer Certificate (TC):**\nIssued upon course completion or college transfer.\n- **Requirements:** Library No-Dues clearance, Department Proctor sign-off, and all semester grade cards.\n- **Turnaround SLA:** 3-5 business days.\n- **AI Priority:** High priority by default.',
  },
  {
    keywords: ['character certificate', 'conduct'],
    answer:
      '🎖️ **Character & Conduct Certificate:**\nEndorses discipline, academic integrity, and good moral standing.\n- **Requirements:** Proctor/Mentor recommendation and Department HOD approval.\n- **Turnaround SLA:** 2-3 business days.',
  },
  {
    keywords: ['bulk', 'multiple'],
    answer:
      '📦 **Bulk Document Requests:**\nYou can request multiple document types at once (e.g. 2 Study Certificates + 1 Bonafide + 1 Character Certificate) via the **"Bulk Document Request"** link in your sidebar! Each document can have its own stated purpose and is tracked seamlessly.',
  },
  {
    keywords: ['rejection', 'rejected', 'why rejected', 'mistake'],
    answer:
      '⚠️ **Top Rejection Prevention Tips:**\n1. Ensure uploaded fee receipts or ID cards are clear and uncropped.\n2. Verify your USN and name match college enrollment records exactly.\n3. Clear any pending department library or tuition dues.\n4. State a specific purpose rather than generic one-word entries.',
  },
  {
    keywords: ['track', 'status', 'where is my application'],
    answer:
      '🔍 **Application Tracking:**\nNavigate to **"My Applications"** in your sidebar. Real-time statuses proceed through:\n- `PENDING` ➔ Under review by office staff.\n- `ANSWERED` ➔ Verified and approved (with downloadable signed digital document).\n- `ACKNOWLEDGED` ➔ Confirmed and finalized.',
  },
];

export const CampusDocsAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hello ${
        user?.full_name ? user.full_name.split(' ')[0] : 'there'
      }! 👋 I am the **CampusDocs AI Copilot**.\n\nI can assist you with:\n- ⚡ **AI Priority Triage** (how urgent requests are scored & expedited)\n- 📋 **Certificate Requirements & SLAs**\n- 📦 **Bulk Application Guidance**\n- 🔍 **Application Tracking & Status Updates**`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');

    // Generate intelligent response from knowledge base
    setTimeout(() => {
      const lower = text.toLowerCase();
      let matched = null;

      for (const entry of KNOWLEDGE_BASE) {
        if (entry.keywords.some((kw) => lower.includes(kw))) {
          matched = entry.answer;
          break;
        }
      }

      let reply = matched;
      if (!reply) {
        if (lower.includes('hello') || lower.includes('hi')) {
          reply = `Hello! How can I assist your document desk workflow today? Ask me about certificate requirements, turnaround SLAs, or how to get priority review!`;
        } else if (lower.includes('status') || lower.includes('check status')) {
          reply = `You can view the live status of all your requests directly in the **"My Applications"** dashboard. High priority requests are processed within 24-48 hours.`;
        } else {
          reply = `I can help you navigate institutional procedures! Try asking:\n- "How does AI prioritize applications?"\n- "What documents are required for Bonafide Certificate?"\n- "How long does a Transfer Certificate take?"\n- "How to submit a bulk request?"`;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 350);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-navy-950 text-white rounded-full shadow-2xl hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 group"
          title="Open CampusDocs AI Copilot"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-xs font-bold tracking-wide">CampusDocs AI Copilot</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-300 opacity-90 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Interactive AI Assistant Drawer */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 ${
            isExpanded
              ? 'w-[95vw] sm:w-[600px] h-[82vh] max-h-[750px]'
              : 'w-[92vw] sm:w-[410px] h-[550px] max-h-[88vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-navy-950 via-slate-900 to-indigo-950 text-white rounded-t-2xl flex items-center justify-between shadow-md border-b border-navy-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold flex items-center gap-1.5">
                  <span>CampusDocs AI Copilot</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Live
                  </span>
                </h3>
                <p className="text-[10px] text-slate-300">Priority Triage & Institutional Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title={isExpanded ? 'Minimize' : 'Maximize'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <button
              type="button"
              onClick={() => handleSendMessage('How does the AI prioritize urgent applications?')}
              className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shrink-0 font-medium flex items-center gap-1 transition-colors"
            >
              <Zap className="w-3 h-3 text-indigo-600" />
              <span>How AI Priority Works</span>
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('What are the requirements for a Bonafide Certificate?')}
              className="px-2.5 py-1 rounded-full bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shrink-0 font-medium transition-colors"
            >
              Bonafide Requirements
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('How long does Transfer Certificate processing take?')}
              className="px-2.5 py-1 rounded-full bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shrink-0 font-medium transition-colors"
            >
              Turnaround SLAs
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('How do I submit a Bulk Document Request?')}
              className="px-2.5 py-1 rounded-full bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shrink-0 font-medium transition-colors"
            >
              Bulk Requests
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 shadow-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 rounded-b-2xl flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question about certificates, priority, or tracking..."
              className="flex-1 px-3 py-2 text-xs bg-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm disabled:opacity-40 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
