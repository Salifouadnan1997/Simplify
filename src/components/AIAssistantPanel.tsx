import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, Mic, Square } from "lucide-react";
import { checkQuota, incrementQuota } from "../lib/quotaService";

export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
}

interface AIAssistantPanelProps {
  documentContent: string;
}

export default function AIAssistantPanel({ documentContent }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "model", text: "Bonjour ! Je suis votre assistant Simplify. Comment puis-je vous aider avec ce document ?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useHighThinking, setUseHighThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && !isLoading) return;

    const quota = await checkQuota('aiUsed');
    if (!quota.allowed) {
      alert(quota.message || "Limite atteinte pour l'IA. Veuillez souscrire à un forfait.");
      return;
    }

    const userText = input.trim();
    setInput("");
    
    const newMessage: Message = { id: Date.now().toString(), role: "user", text: userText };
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      // Choose model based on useHighThinking
      const model = useHighThinking ? "gemini-3.1-pro-preview" : "gemini-3.5-flash";
      const systemInstruction = "Vous êtes un assistant de rédaction professionnel. Utilisez le contexte du document pour aider l'utilisateur. Contexte actuel: " + documentContent;
      
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: messages.filter(m => m.id !== "1").map(m => ({ role: m.role, text: m.text })),
          model,
          systemInstruction,
          useHighThinking
        })
      });

      if (!response.ok) {
        throw new Error("Erreur de connexion au chatbot");
      }

      const data = await response.json();
      await incrementQuota('aiUsed');
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "model", text: data.text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "model", text: "Désolé, une erreur est survenue lors de la communication avec Simplify." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          setIsLoading(true);
          try {
            const response = await fetch("/api/gemini/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audioData: base64Audio, mimeType: "audio/webm" })
            });
            const data = await response.json();
            if (data.text) {
              setInput(prev => prev + (prev ? " " : "") + data.text);
            }
          } catch (error) {
            console.error("Transcription error", error);
          } finally {
            setIsLoading(false);
          }
        };
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing mic", err);
      alert("Impossible d'accéder au microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Bot className="text-blue-600" size={20} />
          <h2 className="font-bold text-slate-800">Assistant Simplify</h2>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <label className="flex items-center space-x-1 cursor-pointer">
            <input 
              type="checkbox" 
              checked={useHighThinking} 
              onChange={(e) => setUseHighThinking(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-slate-600 font-medium">Pensée Profonde</span>
          </label>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg p-3 ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
              <div className="flex items-center space-x-2 mb-1 opacity-80 text-xs">
                {msg.role === "user" ? <User size={12} /> : <Bot size={12} />}
                <span>{msg.role === "user" ? "Vous" : "Simplify"}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center space-x-2 text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Simplify réfléchit...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-full flex-shrink-0 transition-colors ${
              isRecording ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            title={isRecording ? "Arrêter l'enregistrement" : "Dicter avec Simplify"}
          >
            {isRecording ? <Square size={18} /> : <Mic size={18} />}
          </button>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez une question ou dictez un message..."
            className="flex-1 max-h-32 min-h-[40px] text-sm p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none resize-y"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          
          <button
            type="submit"
            disabled={!input.trim() || isLoading || isRecording}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
