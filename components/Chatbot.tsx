import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { startChat } from '../services/geminiService';
import { Send, LoaderCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import type { Chat } from '@google/genai';

interface Message {
  role: 'user' | 'model';
  text: string;
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
      for await (const chunk of stream) {
        if (chunk.text) {
          fullResponse += chunk.text;
          setChatHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1].text = fullResponse;
            return newHistory;
          });
        }
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
              <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">G</div>
                )}
                <div className={`prose-custom max-w-xl p-3 rounded-lg shadow-md ${msg.role === 'user' ? 'bg-cyan-100 dark:bg-cyan-900' : 'bg-white dark:bg-gray-700'}`}>
                  {isLoading && index === chatHistory.length - 1 && !msg.text ? 
                    <LoaderCircle className="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400" /> :
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  }
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">U</div>
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