import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { startChat } from '../services/geminiService';
import { Send, LoaderCircle, RefreshCw, Globe, ExternalLink } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import type { Chat } from '@google/genai';

interface Source {
  title: string;
  uri: string;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  sources?: Source[];
}

const Chatbot: React.FC = () => {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChatSession(startChat());
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleStartOver = () => {
    setChatHistory([]);
    setError('');
    setChatSession(startChat());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading || !chatSession) return;

    const userMessage: Message = { role: 'user', text: prompt };
    setChatHistory(prev => [...prev, userMessage]);
    
    const currentPrompt = prompt;
    setPrompt('');
    setIsLoading(true);
    setError('');

    try {
      setChatHistory(prev => [...prev, { role: 'model', text: '' }]);
      const stream = await chatSession.sendMessageStream({ message: currentPrompt });
      
      let fullResponse = '';
      const gatheredSources: Source[] = [];
      const seenUris = new Set<string>();

      for await (const chunk of stream) {
        if (chunk.text) {
          fullResponse += chunk.text;
        }

        // Extract grounding chunks (search results)
        const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
           groundingChunks.forEach(gChunk => {
             if (gChunk.web && gChunk.web.uri && gChunk.web.title) {
               if (!seenUris.has(gChunk.web.uri)) {
                 seenUris.add(gChunk.web.uri);
                 gatheredSources.push({
                   title: gChunk.web.title,
                   uri: gChunk.web.uri
                 });
               }
             }
           });
        }

        setChatHistory(prev => {
          const newHistory = [...prev];
          const lastMsg = newHistory[newHistory.length - 1];
          lastMsg.text = fullResponse;
          // Update sources if found, preventing overwrite with empty if streaming logic varies
          if (gatheredSources.length > 0) {
              lastMsg.sources = [...gatheredSources];
          }
          return newHistory;
        });
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      setChatHistory(prev => prev.slice(0, -1)); // Remove placeholder
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{t('chatbot_title')}</h2>
          <div className="flex items-center space-x-2">
            <button onClick={handleStartOver} disabled={chatHistory.length === 0} title={t('chatbot_start_over_title')} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <RefreshCw className="w-6 h-6"/>
            </button>
          </div>
        </div>
        <div ref={chatContainerRef} className="flex-grow p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-y-auto mb-4 min-h-[200px] space-y-4">
            {chatHistory.length === 0 && !isLoading && <p className="text-gray-400 dark:text-gray-500 text-center p-8">{t('chatbot_initial_message')}</p>}
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm mt-1">G</div>
                )}
                <div className={`flex flex-col max-w-xl ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`prose-custom p-3 rounded-lg shadow-md ${msg.role === 'user' ? 'bg-cyan-100 dark:bg-cyan-900' : 'bg-white dark:bg-gray-700'}`}>
                      {isLoading && index === chatHistory.length - 1 && !msg.text ? 
                        <LoaderCircle className="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400" /> :
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                      }
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 text-xs w-full">
                        <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1 font-medium">
                          <Globe className="w-3 h-3 mr-1" />
                          <span>Sources</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((source, sIndex) => (
                            <a 
                              key={sIndex} 
                              href={source.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center bg-gray-200 dark:bg-gray-600 hover:bg-cyan-100 dark:hover:bg-cyan-900 text-gray-700 dark:text-gray-200 px-2 py-1 rounded transition-colors truncate max-w-full"
                              title={source.title}
                            >
                              <span className="truncate max-w-[150px]">{source.title}</span>
                              <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm mt-1">U</div>
                )}
              </div>
            ))}
            {error && <p className="text-red-500 dark:text-red-400">{t(error)}</p>}
        </div>
        
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('chatbot_placeholder')}
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