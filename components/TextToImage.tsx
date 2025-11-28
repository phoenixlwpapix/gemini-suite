import React, { useState, useRef } from 'react';
import { generateImage } from '../services/geminiService';
import { Send, LoaderCircle, PenSquare } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

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
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectRatios = [
    { value: '1:1', label: '1:1' },
    { value: '16:9', label: '16:9' },
    { value: '9:16', label: '9:16' },
    { value: '4:3', label: '4:3' },
    { value: '3:4', label: '3:4' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleInputFocus = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      setPrompt("");
    }
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{t('text_to_image_title')}</h2>
        
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
           {aspectRatios.map((ratio) => (
             <button
                key={ratio.value}
                onClick={() => setAspectRatio(ratio.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
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

      <div className="flex-grow flex flex-col justify-center items-center p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 min-h-[300px] sm:min-h-[400px] relative">
        {isLoading && <LoaderCircle className="animate-spin h-8 w-8 text-cyan-400" />}
        {error && <p className="text-red-500 dark:text-red-400 text-center">{t(error)}</p>}
        {imageUrl && (
            <>
                <img src={imageUrl} alt="Generated" className="max-h-full max-w-full object-contain rounded-md shadow-lg mb-4" />
                <button 
                  onClick={() => onEditImage(imageUrl)}
                  className="absolute bottom-4 right-4 flex items-center space-x-2 bg-white dark:bg-gray-700 text-cyan-600 dark:text-cyan-400 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                >
                    <PenSquare className="w-5 h-5" />
                    <span>{t('text_to_image_edit_button')}</span>
                </button>
            </>
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
    </div>
  );
};

export default TextToImage;