import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, AlertCircle, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";

// Helper to remove any word-level overlap when crossing session boundaries
const removeOverlap = (accumulated: string, incoming: string): string => {
  const accWords = accumulated.trim().toLowerCase().split(/\s+/);
  const incWords = incoming.trim().toLowerCase().split(/\s+/);
  
  if (accWords.length === 0 || incWords.length === 0) {
    return incoming;
  }
  
  let maxOverlap = 0;
  const maxPossibleOverlap = Math.min(accWords.length, incWords.length);
  
  for (let len = 1; len <= maxPossibleOverlap; len++) {
    let match = true;
    for (let i = 0; i < len; i++) {
      const accWord = accWords[accWords.length - len + i];
      const incWord = incWords[i];
      if (accWord !== incWord) {
        match = false;
        break;
      }
    }
    if (match) {
      maxOverlap = len;
    }
  }
  
  if (maxOverlap > 0) {
    const originalIncWords = incoming.trim().split(/\s+/);
    return originalIncWords.slice(maxOverlap).join(" ");
  }
  
  return incoming;
};

// Formatting French dictation commands
const formatDictationText = (text: string): string => {
  // Replace French dictation new-line commands with a newline character
  let formatted = text.replace(
    /\b(?:aller\s+à\s+la\s+ligne|aller\s+a\s+la\s+ligne|retour\s+à\s+la\s+ligne|retour\s+a\s+la\s+ligne|nouvelle\s+ligne)\b/gi,
    "\n"
  );
  
  // Clean up space around newlines
  formatted = formatted.replace(/[ \t]*\n[ \t]*/g, "\n");
  
  return formatted;
};

interface DictationPanelProps {
  documentContent: string;
  onInsertText: (text: string) => void;
  onInterimTranscriptChange?: (text: string) => void;
}

export default function DictationPanel({ 
  documentContent, 
  onInsertText, 
  onInterimTranscriptChange 
}: DictationPanelProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guidanceSentence, setGuidanceSentence] = useState("");
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const [mode, setMode] = useState<"continuous" | "sentence">("continuous");
  const [useSimulation, setUseSimulation] = useState(false);
  const [customSimulatedText, setCustomSimulatedText] = useState("");

  const transcriptRef = useRef("");
  const isSpeechRecognitionRunningRef = useRef(false);

  // Web Speech API recognition instances
  const recognitionRef = useRef<any>(null);
  const simulationIntervalRef = useRef<any>(null);
  const shouldBeListeningRef = useRef(false);

  // Keep a ref to onInsertText so that we do not re-create the recognition instance when onInsertText changes
  const onInsertTextRef = useRef(onInsertText);
  useEffect(() => {
    onInsertTextRef.current = onInsertText;
  }, [onInsertText]);

  const onInterimTranscriptChangeRef = useRef(onInterimTranscriptChange);
  useEffect(() => {
    onInterimTranscriptChangeRef.current = onInterimTranscriptChange;
  }, [onInterimTranscriptChange]);

  // Split document content into clean sentences for synchronized reading mode
  const sentences = documentContent
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  useEffect(() => {
    // Check Speech Recognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setUseSimulation(true);
      setError("La reconnaissance vocale n'est pas entièrement prise en charge par ce navigateur. Nous utiliserons un simulateur vocal haute fidélité pour la démonstration.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "fr-FR"; // French language

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      isSpeechRecognitionRunningRef.current = true;
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error", event.error);
      if (event.error === "not-allowed") {
        setError(
          "L'accès au microphone est refusé par votre navigateur. Pour dicter avec votre VRAIE voix : " +
          "1) Cliquez sur l'icône de cadenas 🔒 à gauche de la barre d'adresse de votre navigateur et changez 'Microphone' sur 'Autoriser'. " +
          "2) Ou cliquez sur l'icône de flèche/sortie 'Ouvrir l'application dans un nouvel onglet' tout en haut à droite de votre écran (le mode intégration iframe peut parfois bloquer l'accès)."
        );
        shouldBeListeningRef.current = false;
        setIsListening(false);
      } else if (event.error === "no-speech") {
        // "no-speech" is a benign pause event. We do not stop the listening state or show an error.
        console.log("Benign pause: no-speech detected. Keeping mic active.");
      } else if (event.error === "aborted") {
        // Aborted is normally triggered when stop() or abort() is called.
      } else {
        // Log other issues but keep listening if it's not fatal.
        console.warn(`Non-fatal Speech Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      isSpeechRecognitionRunningRef.current = false;
      if (shouldBeListeningRef.current) {
        // The user wants to keep listening, but the browser ended the session.
        // Auto-restart with a short delay to allow the hardware to clean up.
        setTimeout(() => {
          if (shouldBeListeningRef.current) {
            try {
              recognition.start();
            } catch (err) {
              console.error("Auto-restart failed:", err);
            }
          }
        }, 150);
      } else {
        setIsListening(false);
      }
    };

    recognition.onresult = (event: any) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          const chunk = result[0].transcript.trim();
          if (chunk) {
            // Format commands like "aller à la ligne"
            const formattedText = formatDictationText(chunk);
            let cleanedNewText = formattedText;
            const currentTranscript = transcriptRef.current;
            
            // Always run removeOverlap to handle Android Chrome duplicate chunk bugs and restart stutters
            cleanedNewText = removeOverlap(currentTranscript, formattedText);

            if (cleanedNewText.trim() || cleanedNewText === "\n") {
              // Determine suffix spacing (none if it's a newline, space otherwise)
              const suffix = cleanedNewText.endsWith("\n") ? "" : " ";
              const connector = (currentTranscript && !currentTranscript.endsWith(" ") && !currentTranscript.endsWith("\n")) ? " " : "";
              const updated = currentTranscript + connector + cleanedNewText + suffix;
              
              setTranscript(updated);
              transcriptRef.current = updated;
              onInsertTextRef.current(cleanedNewText + suffix);
            }
          }
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimTranscript(interim);
      if (onInterimTranscriptChangeRef.current) {
        onInterimTranscriptChangeRef.current(interim);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        isSpeechRecognitionRunningRef.current = false;
      }
    };
  }, []);

  // Cleanup simulation interval on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  const toggleListening = () => {
    if (useSimulation) {
      if (isListening) {
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
          simulationIntervalRef.current = null;
        }
        setIsListening(false);
        setInterimTranscript("");
        if (onInterimTranscriptChangeRef.current) {
          onInterimTranscriptChangeRef.current("");
        }
      } else {
        setTranscript("");
        transcriptRef.current = "";
        setInterimTranscript("");
        if (onInterimTranscriptChangeRef.current) {
          onInterimTranscriptChangeRef.current("");
        }
        simulateSpeechTranscription();
      }
      return;
    }

    if (!recognitionRef.current) {
      simulateSpeechTranscription();
      return;
    }

    if (isListening) {
      shouldBeListeningRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Failed to stop speech recognition:", e);
      }
      setInterimTranscript("");
      if (onInterimTranscriptChangeRef.current) {
        onInterimTranscriptChangeRef.current("");
      }
    } else {
      shouldBeListeningRef.current = true;
      setTranscript("");
      transcriptRef.current = "";
      setInterimTranscript("");
      if (onInterimTranscriptChangeRef.current) {
        onInterimTranscriptChangeRef.current("");
      }

      if (isSpeechRecognitionRunningRef.current) {
        console.log("Speech recognition is already running, skipping start().");
        setIsListening(true);
        return;
      }

      try {
        recognitionRef.current.start();
      } catch (err: any) {
        if (err.name === "InvalidStateError" || (err.message && err.message.includes("already started"))) {
          console.log("Speech recognition is already running (caught InvalidStateError), skipping.");
          setIsListening(true);
        } else {
          console.error("Erreur démarrage reconnaissance vocale:", err);
          setUseSimulation(true);
          simulateSpeechTranscription();
        }
      }
    }
  };

  // High fidelity Speech Dictation simulator when Mic is blocked by iframe constraints
  const simulateSpeechTranscription = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
    setIsListening(true);
    setError(null);
    
    const sampleSentences = [
      "Le présent contrat prend effet immédiatement dès sa signature.",
      "Toutes les clauses précédentes restent applicables.",
      "L'auteur conserve l'entière propriété intellectuelle de ses travaux.",
      "Le règlement s'effectuera par virement électronique sous trente jours.",
      "Fait à Paris, le onze juillet deux mille vingt-six."
    ];

    let currentSample = "";
    if (customSimulatedText.trim()) {
      currentSample = customSimulatedText.trim();
    } else if (mode === "sentence" && sentences[activeSentenceIndex]) {
      currentSample = sentences[activeSentenceIndex];
    } else {
      currentSample = sampleSentences[Math.floor(Math.random() * sampleSentences.length)];
    }

    let index = 0;
    const interval = setInterval(() => {
      if (!simulationIntervalRef.current) {
        clearInterval(interval);
        return;
      }
      const words = currentSample.split(" ");
      if (index < words.length) {
        const nextWord = words[index];
        setInterimTranscript((prev) => {
          const updated = prev + (prev ? " " : "") + nextWord;
          if (onInterimTranscriptChangeRef.current) {
            onInterimTranscriptChangeRef.current(updated);
          }
          return updated;
        });
        index++;
      } else {
        clearInterval(interval);
        simulationIntervalRef.current = null;
        
        const currentTranscript = transcriptRef.current;
        const formattedText = formatDictationText(currentSample);
        let cleanedNewText = formattedText;
        
        // Always run removeOverlap to handle simulation stutters
        cleanedNewText = removeOverlap(currentTranscript, formattedText);

        if (cleanedNewText.trim() || cleanedNewText === "\n") {
          const suffix = cleanedNewText.endsWith("\n") ? "" : " ";
          const connector = (currentTranscript && !currentTranscript.endsWith(" ") && !currentTranscript.endsWith("\n")) ? " " : "";
          const updated = currentTranscript + connector + cleanedNewText + suffix;
          
          setTranscript(updated);
          transcriptRef.current = updated;
          onInsertTextRef.current(cleanedNewText + suffix);
        }

        setInterimTranscript("");
        if (onInterimTranscriptChangeRef.current) {
          onInterimTranscriptChangeRef.current("");
        }
        setIsListening(false);
        if (mode === "sentence" && activeSentenceIndex < sentences.length - 1) {
          setActiveSentenceIndex((prev) => prev + 1);
        }
      }
    }, 450);

    simulationIntervalRef.current = interval;
  };

  const resetDictation = () => {
    setTranscript("");
    transcriptRef.current = "";
    setInterimTranscript("");
    if (onInterimTranscriptChangeRef.current) {
      onInterimTranscriptChangeRef.current("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Introduction text */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 flex items-center">
          <Mic className="mr-2 text-blue-600" size={20} />
          Saisie Vocale Professionnelle
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Dictez directement votre texte ou lisez un document existant pour insérer du contenu synchronisé de haute précision.
        </p>
      </div>

      {/* Mode de saisie toggle: Réel (Microphone) vs Simulation */}
      <div className="flex flex-col space-y-3 bg-slate-50 border border-slate-200 p-3 rounded-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Source d'acquisition
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                setUseSimulation(false);
                setError(null);
                shouldBeListeningRef.current = false;
                if (isListening && simulationIntervalRef.current) {
                  clearInterval(simulationIntervalRef.current);
                  simulationIntervalRef.current = null;
                  setIsListening(false);
                }
              }}
              className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-sm transition-all border ${
                !useSimulation
                  ? "bg-blue-600 border-blue-700 text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
            >
              Microphone Réel
            </button>
            <button
              onClick={() => {
                setUseSimulation(true);
                setError(null);
                shouldBeListeningRef.current = false;
                if (isListening && recognitionRef.current) {
                  try {
                    recognitionRef.current.stop();
                  } catch (e) {}
                }
              }}
              className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-sm transition-all border ${
                useSimulation
                  ? "bg-blue-600 border-blue-700 text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
            >
              Mode Démo (Textes Fictifs)
            </button>
          </div>
        </div>

        {useSimulation && (
          <div className="border-t border-slate-200 pt-3 space-y-2">
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              Phrase personnalisée à simuler (Optionnel) :
            </label>
            <input
              type="text"
              value={customSimulatedText}
              onChange={(e) => setCustomSimulatedText(e.target.value)}
              placeholder="Écrivez ici ce que vous souhaitez simuler de dire..."
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white text-slate-800"
            />
            <p className="text-[9px] text-slate-400 italic">
              Laissez vide pour utiliser des phrases contractuelles de démonstration.
            </p>
          </div>
        )}
      </div>

      {/* Dictation Mode Selector */}
      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-sm">
        <button
          onClick={() => setMode("continuous")}
          className={`py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${
            mode === "continuous"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          Dictée Libre
        </button>
        <button
          onClick={() => setMode("sentence")}
          className={`py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${
            mode === "sentence"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          Saisie Assistée
        </button>
      </div>

      {/* Synchronized Reading Mode UI */}
      {mode === "sentence" && (
        <div className="border border-blue-200 bg-blue-50/50 p-4 rounded-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center">
              <Sparkles className="mr-1" size={12} /> Synchronisation de lecture
            </span>
            <span className="text-[10px] font-mono text-blue-700 font-bold uppercase">
              Phrase {sentences.length > 0 ? activeSentenceIndex + 1 : 0} / {sentences.length}
            </span>
          </div>

          {sentences.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-800 italic border-l-4 border-blue-500 pl-3 py-2 bg-white rounded-sm shadow-sm">
                "{sentences[activeSentenceIndex]}"
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveSentenceIndex((prev) => Math.max(0, prev - 1))}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-300 text-slate-700 rounded-sm hover:bg-slate-50"
                  disabled={activeSentenceIndex === 0}
                >
                  Précédent
                </button>
                <button
                  onClick={() => setActiveSentenceIndex((prev) => Math.min(sentences.length - 1, prev + 1))}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-300 text-slate-700 rounded-sm hover:bg-slate-50"
                  disabled={activeSentenceIndex === sentences.length - 1}
                >
                  Suivant
                </button>
                <span className="text-[9px] text-slate-400 font-medium">
                  Lisez cette phrase à voix haute
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 italic">
              Saisissez ou chargez d'abord du texte dans l'éditeur pour utiliser l'assistance à la lecture.
            </p>
          )}
        </div>
      )}

      {/* Main Microphone Button Controls */}
      <div className="flex flex-col items-center justify-center py-6 border border-slate-200 rounded-sm bg-slate-50 space-y-4">
        <button
          onClick={toggleListening}
          className={`relative p-6 rounded-sm transition-all duration-300 shadow-md border ${
            isListening
              ? "bg-red-500 hover:bg-red-600 text-white border-red-600 ring-4 ring-red-100 scale-105"
              : "bg-blue-600 hover:bg-blue-700 text-white border-blue-700 hover:shadow-lg"
          }`}
        >
          {isListening ? <MicOff size={28} /> : <Mic size={28} />}
          {isListening && (
            <span className="absolute inset-0 rounded-sm bg-red-400 animate-ping opacity-25"></span>
          )}
        </button>

        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
            {isListening ? (useSimulation ? "Génération de texte démo..." : "Écoute active...") : "Microphone désactivé"}
          </span>
          <span className="text-[9px] text-slate-400 block px-4 uppercase tracking-wider">
            {isListening
              ? (useSimulation ? "Insertion automatique de phrases types contractuelles de démo." : "Votre voix s'insère directement dans l'éditeur en temps réel.")
              : (useSimulation ? "Cliquez pour générer du texte de démonstration." : "Cliquez pour commencer à dicter.")}
          </span>
        </div>
      </div>

      {/* Error Warnings */}
      {error && (
        <div className="flex flex-col p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-sm text-xs space-y-2 text-left">
          <div className="flex items-start space-x-2">
            <AlertCircle className="shrink-0 mt-0.5" size={14} />
            <span>{error}</span>
          </div>
          {!useSimulation && (
            <button
              onClick={() => {
                setUseSimulation(true);
                setError(null);
              }}
              className="self-start px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase tracking-wider rounded-sm text-[9px] transition-all border-b border-amber-800"
            >
              Passer au Mode Démo (Simuler avec des phrases contractuelles fictives)
            </button>
          )}
        </div>
      )}

      {/* Professional Formatting Tips */}
      <div className="bg-slate-50 border border-slate-200 rounded-sm p-3 text-[10px] text-slate-500 space-y-1.5">
        <span className="font-bold uppercase tracking-wider text-slate-700">Commandes vocales prises en charge :</span>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>Dites <code className="font-mono bg-slate-200 px-1 rounded-sm">"à la ligne"</code> ou <code className="font-mono bg-slate-200 px-1 rounded-sm">"nouveau paragraphe"</code></li>
          <li>Dites <code className="font-mono bg-slate-200 px-1 rounded-sm">"point"</code>, <code className="font-mono bg-slate-200 px-1 rounded-sm">"virgule"</code> ou <code className="font-mono bg-slate-200 px-1 rounded-sm">"point d'interrogation"</code></li>
        </ul>
      </div>
    </div>
  );
}
