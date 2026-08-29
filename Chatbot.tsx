import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Bună! Eu sunt Mia, asistenta ta virtuală pentru masaj și relaxare. 🌸 Pentru programări telefonice ne poți apela la 0745 240 799. Cu ce te pot ajuta?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Generăm un ID de sesiune simplu pentru logs
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const logToFirebase = async (role: string, content: string) => {
    try {
      await addDoc(collection(db, 'chat_logs'), {
        sessionId,
        role,
        content,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Firebase logging error", e);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.volume = 0.4;
        audioRef.current.play().catch(e => console.warn('Audio blocked', e));
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    // Salvează în Firebase asincron
    logToFirebase('user', userMsg);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(1) // fără primul mesaj de salut
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
        logToFirebase('model', data.reply);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: `Eroare: ${data.error}` }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: 'Ne pare rău, a apărut o problemă de conexiune.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-sage-600 to-gold-400 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 hover:shadow-gold-400/20 transition-all z-40 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Background Audio (Hidden) - Pixabay relaxing track */}
      <audio 
        ref={audioRef} 
        loop 
        src="https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3" 
        preload="auto"
      />

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[360px] max-w-[calc(100vw-48px)] h-[520px] max-h-[calc(100vh-100px)] bg-white shadow-2xl rounded-2xl z-50 flex flex-col border border-sage-100 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-sage-700 via-sage-600 to-gold-500 text-white p-4 flex items-center justify-between shadow-md relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=400")', backgroundSize: 'cover' }}></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-sm shadow-inner relative">
                  <Sparkles size={14} className="absolute -top-1 -right-1 text-gold-200 animate-pulse" />
                  <Bot size={20} />
                </div>
                <div>
                  <h4 className="font-serif font-medium text-lg leading-tight">Mia</h4>
                  <p className="text-[11px] text-sage-100 uppercase tracking-wider font-medium">Asistent Terapie</p>
                </div>
              </div>
              <div className="flex items-center gap-2 relative z-10">
                <button 
                  onClick={toggleAudio} 
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                  title={isAudioPlaying ? "Oprește muzica de relaxare" : "Pornește muzica de relaxare"}
                >
                  {isAudioPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-cream-50 to-white custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 mr-2 flex-shrink-0 mt-1">
                      <Bot size={12} />
                    </div>
                  )}
                  <div className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-sage-600 text-white rounded-2xl rounded-br-sm shadow-md' 
                      : 'bg-white border border-sage-100 text-sage-800 rounded-2xl rounded-bl-sm shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 mr-2 flex-shrink-0 mt-1">
                    <Bot size={12} />
                  </div>
                  <div className="bg-white border border-sage-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-sage-100 flex gap-2">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Scrie un mesaj..."
                className="flex-1 bg-sage-50/50 border border-sage-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-300/50 focus:border-gold-400 rounded-xl text-sage-900 transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-gold-500 text-white w-11 h-11 rounded-xl flex items-center justify-center hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                <Send size={18} className="ml-1" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}