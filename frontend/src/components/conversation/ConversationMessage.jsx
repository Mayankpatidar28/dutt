import React from 'react';
import { Volume2 } from 'lucide-react';
import Avatar from '../common/Avatar';

export default function ConversationMessage({
  message,
  onSpeak,
  userName = 'Learner',
}) {
  const isDutt = message.sender === 'DUTT';

  return (
    <div className={`flex gap-3 mb-4 ${isDutt ? 'justify-start' : 'justify-end'}`}>
      {isDutt && <Avatar isDutt size="sm" className="mt-1 flex-shrink-0" />}

      <div
        className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-md ${
          isDutt
            ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-sm shadow-indigo-500/10'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className={`text-[11px] font-semibold tracking-wide ${isDutt ? 'text-indigo-400' : 'text-indigo-200'}`}>
            {isDutt ? 'Dutt' : userName}
          </span>

          {isDutt && onSpeak && (
            <button
              onClick={() => onSpeak(message.messageText)}
              title="Listen to Dutt's pronunciation"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.messageText}</p>
      </div>

      {!isDutt && <Avatar name={userName} size="sm" className="mt-1 flex-shrink-0" />}
    </div>
  );
}
