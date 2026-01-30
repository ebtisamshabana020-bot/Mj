import React, { useState, useRef } from 'react';
import { ImageEditState } from '../types';
import { editImageWithGemini } from './geminiService';
import { fileToBase64 } from '../utils';

interface ImageEditorProps {
  onBack: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ onBack }) => {
  const [state, setState] = useState<ImageEditState>({
    originalImage: null,
    generatedImage: null,
    prompt: '',
    isLoading: false,
    error: null,
  });

  const [mimeType, setMimeType] = useState<string>('image/png');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        setMimeType(file.type);
        setState((prev) => ({
          ...prev,
          originalImage: base64,
          generatedImage: null, // Reset generated on new upload
          error: null,
        }));
      } catch (err) {
        setState((prev) => ({ ...prev, error: "Failed to read file." }));
      }
    }
  };

  const handleGenerate = async () => {
    if (!state.originalImage || !state.prompt) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const resultBase64 = await editImageWithGemini(
        state.originalImage,
        mimeType,
        state.prompt
      );

      if (resultBase64) {
        setState((prev) => ({
          ...prev,
          generatedImage: resultBase64,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "The AI did not return an image. Try a different prompt.",
        }));
      }
    } catch (err) {
      console.error(err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "An error occurred while communicating with the API. Check console.",
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4">
        <button 
          onClick={onBack}
          className="text-slate-500 hover:text-indigo-600 font-medium flex items-center transition-colors"
        >
          &larr; Back to Dashboard
        </button>
      </div>

      <div className="p-6 bg-white rounded-2xl shadow-xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            AI Diagram & Image Editor
          </h2>
          <p className="text-slate-500">
            Upload a study chart, diagram, or photo and use AI to modify it.
            <br />
            <span className="text-sm italic">Powered by Gemini 2.5 Flash Image</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* Input Section */}
          <div className="flex flex-col gap-4">
            <label className="block text-sm font-medium text-slate-700">1. Upload Image</label>
            <div 
              className="border-2 border-dashed border-slate-300 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors relative overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {state.originalImage ? (
                <img 
                  src={`data:${mimeType};base64,${state.originalImage}`} 
                  alt="Original" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-4">
                  <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-1 text-sm text-slate-500">Click to upload image</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>

            <label className="block text-sm font-medium text-slate-700">2. Describe Change</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={state.prompt}
                onChange={(e) => setState(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="e.g., 'Remove the background', 'Make it sketch style'"
                className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={state.isLoading || !state.originalImage || !state.prompt}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all shadow-md
                ${state.isLoading || !state.originalImage || !state.prompt
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
                }`}
            >
              {state.isLoading ? 'Processing...' : 'Generate Edit'}
            </button>

            {state.error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {state.error}
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="flex flex-col gap-4">
            <label className="block text-sm font-medium text-slate-700">3. Result</label>
            <div className="border border-slate-200 rounded-xl h-64 md:h-[calc(100%-2rem)] bg-slate-50 flex items-center justify-center overflow-hidden relative shadow-inner">
              {state.isLoading ? (
                <div className="flex flex-col items-center">
                   <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-2"></div>
                   <p className="text-xs text-slate-500 animate-pulse">Consulting Gemini...</p>
                </div>
              ) : state.generatedImage ? (
                <img 
                  src={`data:image/png;base64,${state.generatedImage}`} 
                  alt="Generated" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <p className="text-slate-400 text-sm">Edited image will appear here</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;