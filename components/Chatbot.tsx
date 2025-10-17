import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateTextStream } from '../services/geminiService';
import { Send, PlayCircle, PauseCircle, LoaderCircle } from 'lucide-react';

const Chatbot: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const responseContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };
    
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    loadVoices();

    const cleanup = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };

    window.addEventListener('beforeunload', cleanup);

    return () => {
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError('');
    setResponse('');
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);

    try {
      const stream = await generateTextStream(prompt);
      for await (const chunk of stream) {
        if(chunk.text){
          setResponse((prev) => prev + chunk.text);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePlayPause = () => {
    if (!window.speechSynthesis) {
        console.error("Speech Synthesis not supported by this browser.");
        return;
    }

    if (isPlaying) {
        window.speechSynthesis.pause();
        setIsPlaying(false);
        setIsPaused(true);
    } else if (isPaused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        setIsPaused(false);
    } else {
        const textToSpeak = responseContainerRef.current?.textContent;
        if (!textToSpeak) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // --- Improved Voice Selection Logic with American Accent Priority ---
        let selectedVoice: SpeechSynthesisVoice | undefined;
        
        // 1. Prioritize high-quality US voices
        const highQualityUSVoices = voices.filter(voice => 
            voice.lang === 'en-US' && 
            (voice.name.includes('Google') || voice.name.includes('Natural') || voice.name.includes('Neural'))
        );
        selectedVoice = highQualityUSVoices.find(voice => voice.name.includes('Female')) || highQualityUSVoices[0];

        // 2. Fallback to standard US voices if no high-quality ones found
        if (!selectedVoice) {
            const standardUSVoices = voices.filter(voice => voice.lang === 'en-US');
            selectedVoice = standardUSVoices.find(voice => voice.name.includes('Female') || voice.name.includes('Zira') || voice.name.includes('Samantha')) || standardUSVoices[0];
        }

        // 3. Last resort: any high-quality English voice
        if (!selectedVoice) {
            const highQualityAnyEnglish = voices.filter(voice => 
              voice.lang.startsWith('en-') &&
              (voice.name.includes('Google') || voice.name.includes('Natural') || voice.name.includes('Neural'))
            );
            selectedVoice = highQualityAnyEnglish[0];
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('Using voice:', selectedVoice.name, `(${selectedVoice.lang})`);
        } else {
            console.warn('Could not find a preferred English voice. Using browser default.');
            utterance.lang = 'en-US';
        }
        
        utterance.pitch = 1;
        utterance.rate = 1;

        utterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
        };
        
        utterance.onerror = (event) => {
            if (event.error === 'interrupted') {
                return;
            }

            console.error('SpeechSynthesisUtterance.onerror', event);
            setError('An error occurred during speech playback.');
            setIsPlaying(false);
            setIsPaused(false);
        };

        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
        setIsPaused(false);
    }
  };
  
  const handleInputFocus = () => {
      if(inputRef.current) {
          inputRef.current.value = "";
          setPrompt("");
      }
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">Chatbot Module</h2>
          {response && !isLoading && (
            <button onClick={handleTogglePlayPause} className="p-2 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white transition-colors" title={isPlaying ? "Pause" : (isPaused ? "Resume" : "Play")}>
                {isPlaying ? <PauseCircle className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
            </button>
          )}
        </div>
        <div className="flex-grow p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-y-auto mb-4 min-h-[200px]">
            {isLoading && !response && <div className="flex justify-center items-center h-full"><LoaderCircle className="animate-spin h-8 w-8 text-cyan-400" /></div>}
            {error && <p className="text-red-500 dark:text-red-400">{error}</p>}
            {(response || (isLoading && response)) && (
              <div ref={responseContainerRef} className="prose-custom text-lg max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{response}</ReactMarkdown>
              </div>
            )}
            {!isLoading && !response && !error && <p className="text-gray-400 dark:text-gray-500">Your generated text will appear here...</p>}
        </div>
        
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="Enter your prompt here..."
              className="flex-grow p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="p-3 bg-cyan-500 text-white rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 hover:bg-cyan-600 transition-colors flex items-center justify-center"
            >
              {isLoading ? <LoaderCircle className="animate-spin h-6 w-6" /> : <Send className="w-6 h-6" />}
            </button>
        </form>
    </div>
  );
};

export default Chatbot;