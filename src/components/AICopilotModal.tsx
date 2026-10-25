import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { askAiCopilot } from '../services/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  mode?: 'gemini' | 'fallback';
}

const PRELOADED_PROMPTS = [
  'Which service is most likely to fail next?',
  'Why is the payment service at high risk?',
  'What will happen if the database goes down?',
  'How can I reduce cascading failures?',
  'What is the safest recovery strategy?',
];

export const AICopilotModal: React.FC = () => {
  const { isCopilotOpen, setIsCopilotOpen, services, systemHealthScore, incidents, apiStatus } =
    useSimulation();

  const [inputQuestion, setInputQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello, I am **FailGuard Copilot**, your SRE diagnostic assistant. I am continuously monitoring your simulated 8-service distributed topology.\n\nYou can ask me about live risk trajectories, cascading failure paths, or mitigation runbooks.`,
      timestamp: 'Just now',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isCopilotOpen) return null;

  const handleSend = async (questionText?: string) => {
    const q = questionText || inputQuestion.trim();
    if (!q || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    // Build rich context snapshot
    const systemContext = {
      healthScore: systemHealthScore,
      riskLevel:
        systemHealthScore >= 80 ? 'Low' : systemHealthScore >= 50 ? 'Moderate' : 'Critical',
      atRiskCount: services.filter((s) => s.riskScore >= 60).length,
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        riskScore: s.riskScore,
        metrics: s.metrics,
        dependencies: s.dependencies,
        dependents: s.dependents,
      })),
      recentIncidents: incidents.slice(0, 3).map((i) => ({
        id: i.id,
        title: i.title,
        severity: i.severity,
        trigger: i.triggeringServiceName,
      })),
    };

    try {
      const res = await askAiCopilot(q, systemContext);
      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: res.mode,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Unable to reach diagnostic engine. Operating in local heuristic mode.',
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl h-[620px] flex flex-col shadow-2xl animate-scaleUp overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">FailGuard Copilot</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {apiStatus.aiEnabled ? 'Gemini 3.8 Flash' : 'Rule Engine Fallback'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Context-Aware SRE Observability Assistant</p>
            </div>
          </div>

          <button
            onClick={() => setIsCopilotOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl p-3.5 leading-relaxed ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-br-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-line text-xs">{msg.text}</div>
                  <div
                    className={`mt-1.5 text-[10px] font-mono flex items-center justify-between ${
                      isUser ? 'text-cyan-200' : 'text-slate-500'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.mode && (
                      <span className="capitalize text-[9px] px-1 py-0.2 rounded bg-slate-900 border border-slate-800">
                        {msg.mode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center space-x-2 text-xs text-slate-400">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>FailGuard Copilot analyzing live telemetry...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950 flex flex-wrap gap-1.5">
          {PRELOADED_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={isLoading}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-cyan-500/40 transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Ask anything about current telemetry, cascading risks, or recovery..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            disabled={isLoading}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputQuestion.trim()}
            className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
