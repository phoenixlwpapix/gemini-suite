import React, { useState, useRef } from 'react';
import { generateImage } from '../services/geminiService';
import { Send, LoaderCircle, PenSquare, RefreshCw, ZoomIn } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import ImageViewerModal from './ImageViewerModal';

interface TextToImageProps {
  onEditImage: (imageUrl: string) => void;
}

const TextToImage: React.FC<TextToImageProps> = ({ onEditImage }) => {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectRatios = [
    { value: '1:1', label: '1:1' },
    { value: '16:9', label: '16:9' },
    { value: '9:16', label: '9:16' },
    { value: '4:3', label: '4:3' },
    { value: '3:4', label: '3:4' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError('');
    setImageUrl('');

    try {
      const url = await generateImage(prompt, aspectRatio);
      setImageUrl(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleGenerate();
  };

  const handleInputFocus = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      setPrompt("");
    }
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{t('text_to_image_title')}</h2>
        
        <div className="flex items-center space-x-3 overflow-x-auto max-w-full pb-1 sm:pb-0">
           {imageUrl && (
              <div className="flex items-center space-x-2 mr-2">
                <button
                  onClick={() => onEditImage(imageUrl)}
                  className="flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-lg bg-white dark:bg-gray-700 text-cyan-600 dark:text-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600 shadow-sm"
                  title={t('text_to_image_edit_button')}
                >
                  <PenSquare className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline text-sm font-medium">{t('text_to_image_edit_button')}</span>
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 transition-colors shadow-sm"
                  title={t('text_to_image_regenerate')}
                >
                  <RefreshCw className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline text-sm font-medium">{t('text_to_image_regenerate')}</span>
                </button>
              </div>
           )}

           <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
             {aspectRatios.map((ratio) => (
               <button
                  key={ratio.value}
                  onClick={() => setAspectRatio(ratio.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                    aspectRatio === ratio.value
                      ? 'bg-white dark:bg-gray-600 text-cyan-600 dark:text-cyan-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  title={`${t('text_to_image_aspect_ratio')}: ${ratio.label}`}
               >
                 {ratio.label}
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col justify-center items-center p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 min-h-[300px] sm:min-h-[400px] relative">
        {isLoading && <LoaderCircle className="animate-spin h-8 w-8 text-cyan-400" />}
        {error && <p className="text-red-500 dark:text-red-400 text-center">{t(error)}</p>}
        {imageUrl && (
            <div className="flex flex-col items-center justify-center w-full h-full animate-fade-in">
                <div className="relative group cursor-zoom-in" onClick={() => setIsViewerOpen(true)}>
                  <img src={imageUrl} alt="Generated" className="max-h-[50vh] sm:max-h-[60vh] max-w-full object-contain rounded-md shadow-lg transition-transform duration-300 group-hover:scale-[1.01]" />
                  <div className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-5 h-5" />
                  </div>
                </div>
            </div>
        )}
        {!isLoading && !imageUrl && !error && <p className="text-gray-400 dark:text-gray-500">{t('text_to_image_initial_message')}</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={t('text_to_image_placeholder')}
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
      
      {imageUrl && (
        <ImageViewerModal 
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          imageSrc={imageUrl}
          altText={prompt}
        />
      )}
    </div>
  );
};

export default TextToImage;