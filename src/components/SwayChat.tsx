import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { loadThreads, saveThreads, type SwayThread } from '../sway/account';
import type { SystemCandidate } from '../data/profilesData';

interface SwayChatProps {
  person: SystemCandidate;
  onBack: () => void;
}

export const SwayChat: React.FC<SwayChatProps> = ({ person, onBack }) => {
  const [thread, setThread] = useState<SwayThread>(() => {
    const found = loadThreads()[person.candidateId];
    return found || {
      id: person.candidateId,
      alias: person.alias,
      couple: person.role === 'couple',
      messages: [],
      pending: false,
      counted: false
    };
  });
  const [text, setText] = useState('');

  const send = () => {
    const body = text.trim();
    if (!body) return;
    if (thread.couple && thread.messages.length > 0) return;
    const next: SwayThread = {
      ...thread,
      messages: [...thread.messages, { text: body, at: Date.now() }],
      pending: thread.couple ? true : thread.pending,
      counted: true
    };
    const all = loadThreads();
    all[person.candidateId] = next;
    saveThreads(all);
    setThread(next);
    setText('');
  };

  const locked = thread.couple && thread.messages.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="sway-glow pointer-events-none absolute inset-x-0 top-0 h-40" />
      <header className="relative flex items-center gap-3 border-b border-[#c4a574]/30 px-4 py-3">
        <button type="button" onClick={onBack} aria-label="Volver">
          <ChevronLeft className="h-5 w-5 text-[#c4a574]" />
        </button>
        <ChatFace alias={person.alias} photo={person.publicImage} />
        <div>
          <p className="font-sway text-2xl leading-none">{person.alias}</p>
          <p className="mt-1 text-xs text-white/50">{person.location.replace('D.C.', '').split('/')[0].trim()}</p>
        </div>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {thread.couple && (
          <p className="rounded-2xl border border-[#c4a574]/30 px-3 py-2 text-sm text-[#c4a574]">
            {locked
              ? 'Enviado. El chat se abre cuando los dos confirmen.'
              : 'Este mensaje lo ven los dos. El chat queda abierto cuando los dos aceptan.'}
          </p>
        )}
        {thread.messages.map((message) => (
          <p key={message.at} className="sway-clay ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm text-[#f7f1ea]">
            {message.text}
          </p>
        ))}
        {!thread.messages.length && !thread.couple && (
          <p className="text-sm text-white/50">Escribe el primer mensaje. Si contestan, la respuesta no se cobra.</p>
        )}
      </div>
      {!locked && (
        <form
          className="flex gap-2 border-t border-white/10 px-4 py-3"
          onSubmit={(event) => { event.preventDefault(); send(); }}
        >
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Mensaje"
            className="sway-field flex-1"
          />
          <button type="submit" className="sway-clay h-12 rounded-xl px-4">Enviar</button>
        </form>
      )}
    </div>
  );
};

function ChatFace({ alias, photo }: { alias: string; photo?: string }) {
  const [ok, setOk] = React.useState(Boolean(photo));
  const letter = alias.split(/\s+|&/).filter((word) => word && word !== '&')[0]?.[0] || 'S';
  if (ok && photo) {
    return <img src={photo} alt="" onError={() => setOk(false)} className="sway-ring h-10 w-10 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="sway-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3a241c] font-sway text-lg text-[#c4a574]">
      {letter.toUpperCase()}
    </span>
  );
}
