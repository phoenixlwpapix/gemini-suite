import React, { useState, useRef } from 'react';
import { generateImage } from '../services/geminiService';
import { Send, LoaderCircle } from 'lucide-react';

const TextToImage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError('');
    setImageUrl('');

    try {
      const url = await generateImage(prompt);
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
      <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-4">Text-to-Image Module</h2>
      <div className="flex-grow flex justify-center items-center p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 min-h-[300px] sm:min-h-[400px]">
        {isLoading && <LoaderCircle className="animate-spin h-8 w-8 text-cyan-400" />}
        {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}
        {imageUrl && <img src={imageUrl} alt="Generated" className="max-h-full max-w-full object-contain rounded-md shadow-lg" />}
        {!isLoading && !imageUrl && !error && <p className="text-gray-400 dark:text-gray-500">Your generated image will appear here...</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={handleInputFocus}
          placeholder="Enter a detailed image description..."
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