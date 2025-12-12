import React, { useEffect, useRef, useState } from 'react';
import { Mic, X, Volume2, Send, MessageSquare, Radio } from 'lucide-react';
import { connectLiveSession, base64ToFloat32Array, float32ToPCM16, chatWithCoach, transcribeAudio, speakText, pcmToAudioBuffer } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CoachOverlay: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'chat'>('voice');
  
  // Voice State
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'error'>('connecting');
  const [volume, setVolume] = useState(0);
  
  // Chat State
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);

  // Audio Refs (Live API)
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionActionsRef = useRef<{ sendAudio: (b: Blob) => void, close: () => void } | null>(null);
  
  // --- Voice Mode Effects ---
  useEffect(() => {
    if (isOpen && activeTab === 'voice') {
      startSession();
    } else {
      stopSession();
    }
    return () => stopSession();
  }, [isOpen, activeTab]);

  const startSession = async () => {
    try {
      setStatus('connecting');
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = ctx;

      const actions = await connectLiveSession(
        (base64Audio) => {
            const pcmData = base64ToFloat32Array(base64Audio);
            audioQueueRef.current.push(pcmData);
            setStatus('speaking');
            playQueue();
        },
        () => setStatus('error')
      );
      sessionActionsRef.current = actions;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 }});
      streamRef.current = stream;
      
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = float32ToPCM16(inputData);
        const blob = new Blob([pcm16], { type: 'audio/pcm' });
        actions.sendAudio(blob);
        
        let sum = 0;
        for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
        setVolume(Math.min((sum / inputData.length) * 500, 100));
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
      processorRef.current = processor;
      setStatus('listening');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const stopSession = () => {
    sessionActionsRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    processorRef.current?.disconnect();
    audioContextRef.current?.close();
    sessionActionsRef.current = null;
    audioContextRef.current = null;
    audioQueueRef.current = [];
  };

  const playQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0 || !audioContextRef.current) return;
    
    isPlayingRef.current = true;
    const audioData = audioQueueRef.current.shift()!;
    const buffer = audioContextRef.current.createBuffer(1, audioData.length, 24000);
    buffer.getChannelData(0).set(audioData);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => {
        isPlayingRef.current = false;
        if(audioQueueRef.current.length === 0) setStatus('listening');
        playQueue();
    };
    source.start();
  };

  // --- Chat Mode Functions ---
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const newMsg = { role: 'user' as const, text: inputText };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsChatting(true);

    // Format history for API
    const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    const responseText = await chatWithCoach(newMsg.text, history);
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsChatting(false);
  };

  const handleTranscribe = async () => {
    setIsTranscribing(true);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' }); 
            const text = await transcribeAudio(audioBlob);
            if (text) setInputText(prev => prev + " " + text);
            setIsTranscribing(false);
            stream.getTracks().forEach(t => t.stop());
        };

        mediaRecorder.start();
        setTimeout(() => mediaRecorder.stop(), 3000); // Record for 3 seconds snippet
    } catch (e) {
        console.error(e);
        setIsTranscribing(false);
    }
  };

  const handleTTS = async (text: string) => {
      const buffer = await speakText(text);
      if (buffer) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContextClass();
          try {
             const audioBuffer = await pcmToAudioBuffer(buffer, ctx, 24000);
             const source = ctx.createBufferSource();
             source.buffer = audioBuffer;
             source.connect(ctx.destination);
             source.start(0);
          } catch(e) {
             console.error("Audio decode error", e);
          }
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <div className="flex space-x-2 bg-slate-900 rounded-lg p-1">
              <button 
                onClick={() => setActiveTab('voice')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'voice' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                  <Radio size={16} /> Live Voice
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                  <MessageSquare size={16} /> Text Chat
              </button>
          </div>
          <button onClick={onClose} className="text-white bg-slate-800 p-2 rounded-full hover:bg-slate-700">
            <X size={20} />
          </button>
      </div>

      {/* Voice Mode */}
      {activeTab === 'voice' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <div className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 ${status === 'speaking' ? 'bg-green-500 scale-110 shadow-[0_0_60px_rgba(34,197,94,0.6)]' : 'bg-gradient-to-br from-orange-500 to-red-600 shadow-[0_0_40px_rgba(249,115,22,0.4)]'}`}>
                {status === 'connecting' && <div className="absolute inset-0 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>}
                
                {status === 'listening' && (
                    <div 
                        className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping" 
                        style={{ transform: `scale(${1 + volume/80})` }}
                    ></div>
                )}
                
                <Mic className="text-white w-16 h-16 relative z-10" />
            </div>

            <div className="text-center px-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                    {status === 'connecting' ? 'Connecting...' : 
                    status === 'listening' ? 'Listening...' : 
                    status === 'speaking' ? 'Coach Speaking...' : 'Connection Error'}
                </h3>
                <p className="text-slate-400 text-sm">
                    "Hey coach, I'm craving pizza. What should I do?"
                </p>
            </div>

            {status === 'speaking' && (
                <div className="flex gap-1.5 h-10 items-center">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-1.5 bg-green-400 rounded-full animate-bounce" style={{ height: '100%', animationDelay: `${i*0.1}s` }}></div>
                    ))}
                </div>
            )}
        </div>
      )}

      {/* Chat Mode */}
      {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                          <MessageSquare size={48} className="opacity-20" />
                          <p>Ask me anything about your diet.</p>
                      </div>
                  )}
                  {messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'}`}>
                              <p>{msg.text}</p>
                              {msg.role === 'model' && (
                                  <button onClick={() => handleTTS(msg.text)} className="mt-2 text-slate-400 hover:text-white flex items-center gap-1 text-xs">
                                      <Volume2 size={12} /> Read Aloud
                                  </button>
                              )}
                          </div>
                      </div>
                  ))}
                  {isChatting && (
                       <div className="flex justify-start">
                          <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-700">
                              <div className="flex gap-1">
                                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
              
              <div className="p-4 bg-slate-900 border-t border-slate-800">
                  <div className="flex gap-2">
                      <button 
                        onClick={handleTranscribe}
                        className={`p-3 rounded-full transition-colors ${isTranscribing ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                      >
                          <Mic size={20} />
                      </button>
                      <div className="flex-1 relative">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type or record..."
                            className="w-full h-full bg-slate-800 rounded-full pl-4 pr-4 border border-slate-700 focus:border-blue-500 outline-none text-white text-sm"
                        />
                      </div>
                      <button 
                        onClick={handleSendMessage}
                        disabled={!inputText.trim() || isChatting}
                        className="p-3 bg-blue-600 rounded-full text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send size={20} />
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CoachOverlay;