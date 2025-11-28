import React, { useState, useEffect } from 'react';
import { Module } from './types';
import Sidebar from './components/Sidebar';
import Chatbot from './components/Chatbot';
import TextToImage from './components/TextToImage';
import ImageEditor from './components/ImageEditor';
import { LanguageProvider, useLanguage } from './hooks/useLanguage';

type Theme = 'light' | 'dark';

const AppContent: React.FC = () => {
  const [activeModule, setActiveModule] = useState<Module>(Module.CHATBOT);
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    return savedTheme || 'dark';
  });
  const { language, t } = useLanguage();
  const [hasKey, setHasKey] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  
  // State for sharing image between TextToImage and ImageEditor
  const [sharedImage, setSharedImage] = useState<string | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    if (language === 'zh') {
      root.classList.add('lang-zh');
    } else {
      root.classList.remove('lang-zh');
    }
  }, [language]);

  useEffect(() => {
    const checkKey = async () => {
        try {
            const win = window as any;
            if (win.aistudio && win.aistudio.hasSelectedApiKey) {
                const hasSelected = await win.aistudio.hasSelectedApiKey();
                setHasKey(hasSelected);
            } else {
                // Fallback for dev environments without the wrapper, assume true or handle differently
                setHasKey(true);
            }
        } catch (e) {
            console.error("Error checking API key:", e);
        } finally {
            setIsCheckingKey(false);
        }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    try {
        const win = window as any;
        await win.aistudio.openSelectKey();
        setHasKey(true);
    } catch (e) {
        console.error("Error selecting API key:", e);
    }
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleEditImage = (imageUrl: string) => {
    setSharedImage(imageUrl);
    setActiveModule(Module.IMAGE_EDITOR);
  };

  if (isCheckingKey) {
    return <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div></div>;
  }

  if (!hasKey) {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4">
            <div className="max-w-md text-center space-y-6">
                <h1 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{t('auth_title')}</h1>
                <p className="text-lg">{t('auth_desc')}</p>
                <button onClick={handleSelectKey} className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 font-semibold text-lg transition-colors">
                    {t('auth_button')}
                </button>
                <p className="text-sm text-gray-500">
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-cyan-500">{t('auth_billing')}</a>
                </p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        theme={theme}
        toggleTheme={toggleTheme} 
      />
      <main className="flex-1 p-4 sm:p-10 overflow-y-auto">
        <div className={activeModule === Module.CHATBOT ? 'h-full block' : 'hidden'}>
          <Chatbot />
        </div>
        <div className={activeModule === Module.TEXT_TO_IMAGE ? 'h-full block' : 'hidden'}>
          <TextToImage onEditImage={handleEditImage} />
        </div>
        <div className={activeModule === Module.IMAGE_EDITOR ? 'h-full block' : 'hidden'}>
          <ImageEditor sharedImage={sharedImage} onConsumeSharedImage={() => setSharedImage(null)} />
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};


export default App;