import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  RotateCcw, 
  Minimize2, 
  Maximize2,
  Copy,
  Check,
  User,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { callGroqChat, getSystemKnowledgeContext } from '../lib/ai';
import FormattedMarkdown from './FormattedMarkdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  '📊 Thống kê sĩ số học sinh các lớp',
  '👨‍🏫 Ai đang làm giáo viên chủ nhiệm?',
  '📝 Soạn tin nhắn Zalo gửi phụ huynh đầu tuần',
  '💡 Gợi ý câu nhận xét học sinh tiến bộ'
];

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! Tôi là **Everest AI Assistant** 🤖\n\nTôi có thể giúp bạn tra cứu thông tin học sinh, lớp học, giáo viên hoặc soạn thảo các văn bản sư phạm, tin nhắn gửi phụ huynh. Bạn cần tôi hỗ trợ điều gì hôm nay?',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized, messages]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const systemContext = getSystemKnowledgeContext();
      
      // Build history for Groq
      const historyPayload = [
        { role: 'system' as const, content: systemContext },
        ...messages.slice(-6).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        { role: 'user' as const, content: textToSend.trim() }
      ];

      const aiReply = await callGroqChat(historyPayload, 0.4);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiReply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      toast.error('Trợ lý AI đang bận hoặc gặp sự cố kết nối. Vui lòng thử lại!');
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ Rất tiếc, tôi đang gặp sự cố kết nối tới máy chủ AI. Bạn hãy thử lại sau ít giây nhé!',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: 'Cuộc trò chuyện đã được làm mới. Tôi sẵn sàng hỗ trợ các câu hỏi tiếp theo của bạn! ✨',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Đã sao chép phản hồi!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 select-none">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setIsMinimized(false); }}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          title="Hỏi Everest AI"
        >
          <Sparkles className="animate-pulse" size={24} />
          
          {/* Subtle Online Badge */}
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-zinc-900"></span>
          </span>

          {/* Hover Tooltip */}
          <span className="absolute right-16 px-3 py-1.5 bg-black/85 text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Trợ lý Everest AI (Groq Qwen 27B)
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`w-[92vw] sm:w-[420px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden transition-all duration-300 ${
          isMinimized ? 'h-14' : 'h-[580px] max-h-[85vh]'
        }`}>
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white border border-white/30">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                  Everest AI
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-normal">Qwen 27B</span>
                </h3>
                <p className="text-[11px] text-white/80">Trợ lý Sổ theo dõi học sinh</p>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-white/80">
              {!isMinimized && (
                <button
                  onClick={handleResetChat}
                  title="Làm mới cuộc trò chuyện"
                  className="p-1.5 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                >
                  <RotateCcw size={15} />
                </button>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
              >
                {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Đóng chat"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Body */}
          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-gray-50/50 dark:bg-zinc-950/40">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 shadow-sm relative group leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-black dark:bg-white text-white dark:text-black rounded-br-xs whitespace-pre-wrap'
                          : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 rounded-bl-xs border border-gray-100 dark:border-zinc-700/60'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <FormattedMarkdown content={msg.content} />
                      )}

                      {/* Copy Action for AI Messages */}
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          title="Sao chép câu trả lời"
                          className="absolute bottom-1.5 right-1.5 p-1 rounded bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-black dark:hover:text-white"
                        >
                          {copiedId === msg.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 p-2 bg-white dark:bg-zinc-800 rounded-xl w-fit border border-gray-100 dark:border-zinc-700 shadow-sm">
                    <Sparkles className="animate-spin text-purple-600" size={14} />
                    <span>Everest AI đang suy nghĩ...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              {messages.length <= 2 && (
                <div className="p-2.5 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 flex flex-wrap gap-1.5 shrink-0">
                  {QUICK_PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSend(prompt)}
                      className="text-[11px] px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 rounded-full transition-colors text-left flex items-center gap-1 text-gray-600 dark:text-gray-300 cursor-pointer"
                    >
                      {prompt}
                      <ChevronRight size={11} className="opacity-50" />
                    </button>
                  ))}
                </div>
              )}

              {/* Input Box */}
              <div className="p-3 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Hỏi AI về sĩ số, học sinh, soạn tin nhắn..."
                    disabled={loading}
                    className="flex-1 bg-gray-100 dark:bg-zinc-800 text-black dark:text-white placeholder-gray-400 text-sm px-3.5 py-2.5 rounded-xl border border-transparent focus:border-purple-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 text-white rounded-xl shadow-md transition-all cursor-pointer flex-shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
