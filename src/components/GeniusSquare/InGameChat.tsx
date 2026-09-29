import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../../types/lobby';
import { sounds } from '../../services/audio';
import { Send, MessageSquare, Smile } from 'lucide-react';

interface InGameChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
}

const QUICK_EMOTES = [
  'Good luck!',
  'Thinking...',
  'Nice move!',
  'Almost there!',
  'GG! Well played!',
  'Rematch?',
];

export const InGameChat: React.FC<InGameChatProps> = ({
  messages,
  currentUserId,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sounds.playChat();
    onSendMessage(inputText);
    setInputText('');
  };

  const handleQuickEmote = (emote: string) => {
    sounds.playChat();
    onSendMessage(emote);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col shadow-xl text-slate-100 h-80 sm:h-96">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Table Chat
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-semibold">
          {messages.length} messages
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
        {messages.map((m) => {
          const isMe = m.senderId === currentUserId;
          if (m.isSystem) {
            return (
              <div
                key={m.id}
                className="text-center py-1 text-[11px] text-amber-400/90 italic bg-amber-500/5 rounded-lg border border-amber-500/10 px-2"
              >
                {m.text}
              </div>
            );
          }

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1 mb-0.5 text-[10px] text-slate-400">
                <span>{m.senderAvatar}</span>
                <span className="font-semibold text-slate-300">
                  {isMe ? 'You' : m.senderName}
                </span>
              </div>
              <div
                className={`px-3 py-1.5 rounded-xl max-w-[85%] break-words font-medium ${
                  isMe
                    ? 'bg-amber-500 text-slate-950 font-semibold rounded-tr-none'
                    : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emote Buttons */}
      <div className="px-3 py-1.5 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {QUICK_EMOTES.map((em) => (
          <button
            key={em}
            onClick={() => handleQuickEmote(em)}
            className="shrink-0 px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-semibold text-slate-300 hover:text-white transition cursor-pointer"
          >
            {em}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <form
        onSubmit={handleSend}
        className="p-2.5 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send message to table..."
          maxLength={150}
          className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-amber-400 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 text-slate-950 transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
