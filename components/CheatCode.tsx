
import React, { useState, useRef, useEffect } from 'react';
import { X, MoreHorizontal, Zap, Image as ImageIcon, CheckCircle2, Flame, Droplets, Wheat, AlertCircle, RefreshCw, Camera, ScanLine } from 'lucide-react';
import { analyzeFoodImage } from '../services/geminiService';
import { getEmojiForKeyword } from '../constants';
import { Meal } from '../types';

interface AnalysisResult {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  reasoning: string;
}

interface Props {
  remainingBudget: number;
  updateBudget: (calories: number) => void;
  updateNextMeal: (suggestion: string) => void;
  onSmartLog?: (analysis: AnalysisResult) => void; // Updated interface
  nextMeal?: Meal;
  onClose: () => void;
}

const CheatCode: React.FC<Props> = ({ remainingBudget, updateBudget, updateNextMeal, onSmartLog, nextMeal, onClose }) => {
  const [mode, setMode] = useState<'camera' | 'result'>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [flashActive, setFlashActive] = useState(false);
  const [shutterEffect, setShutterEffect] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleFlash = () => {
      setFlashActive(!flashActive);
  };

  const captureImage = () => {
    setShutterEffect(true);
    setTimeout(() => setShutterEffect(false), 150);

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        handleAnalyze(dataUrl);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleAnalyze(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async (base64Image: string) => {
    setAnalyzing(true);
    const base64Data = base64Image.split(',')[1];
    
    try {
      // Use Gemini Flash for Vision Analysis
      const data = await analyzeFoodImage(base64Data);
      setResult({
        foodName: data.foodName,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        reasoning: data.reasoning
      });
      setMode('result');
    } catch (e) {
      console.error(e);
      alert("Analysis failed. Try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (result) {
      // 1. Update basic budget in parent (legacy support)
      updateBudget(result.calories);
      
      // 2. Trigger Orchestrator Re-Balancing in App.tsx
      if (onSmartLog) {
          onSmartLog(result);
      }
      
      // 3. Close immediately
      onClose();
    }
  };

  const handleRetake = () => {
    setMode('camera');
    setResult(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[60] flex flex-col h-full overflow-hidden animate-in slide-in-from-bottom duration-300">
      <canvas ref={canvasRef} className="hidden" />
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileUpload}
      />

      {/* --- View 1: Camera Scanner --- */}
      {mode === 'camera' && (
        <div className="relative h-full flex flex-col">
          {/* Shutter Flash Effect */}
          <div className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 ${shutterEffect ? 'opacity-100' : 'opacity-0'}`}></div>

          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 p-6 pt-safe flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
            <button 
                onClick={onClose}
                className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                <ScanLine size={16} className="text-green-400" />
                <span className="text-white font-semibold text-sm tracking-wide">Gemini Vision</span>
            </div>
            <button className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition">
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="flex-1 relative bg-black overflow-hidden">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            
            {/* Camera Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white"></div>
                <div className="absolute right-1/3 top-0 bottom-0 w-px bg-white"></div>
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white"></div>
                <div className="absolute bottom-1/3 left-0 right-0 h-px bg-white"></div>
            </div>

            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl"></div>
                
                {analyzing ? (
                  <div className="absolute inset-x-0 h-0.5 bg-green-400/80 shadow-[0_0_20px_rgba(74,222,128,0.8)] animate-[scan_1.5s_ease-in-out_infinite] top-0"></div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/30 backdrop-blur-sm text-white/80 px-4 py-2 rounded-full text-xs font-medium border border-white/10">
                            Snap photo of your food
                        </div>
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="bg-black p-8 pb-safe flex justify-between items-center relative">
            <button 
                onClick={toggleFlash}
                className={`p-4 rounded-full transition ${flashActive ? 'text-yellow-400 bg-yellow-400/10' : 'text-white/50 hover:text-white'}`}
            >
               <Zap size={24} fill={flashActive ? "currentColor" : "none"} />
            </button>
            
            <div className="relative group">
                {analyzing ? (
                   <div className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center">
                       <RefreshCw className="text-white animate-spin" size={32} />
                   </div>
                ) : (
                    <button 
                        onClick={captureImage}
                        className="w-20 h-20 rounded-full border-[6px] border-white flex items-center justify-center relative active:scale-90 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                        <div className="w-16 h-16 bg-white rounded-full"></div>
                    </button>
                )}
            </div>

            <button 
                onClick={triggerFileInput}
                className="p-4 text-white/50 hover:text-white transition"
            >
               <ImageIcon size={24} />
            </button>
          </div>
        </div>
      )}

      {/* --- View 2: Analysis Result --- */}
      {mode === 'result' && result && (
        <div className="flex flex-col h-full bg-slate-950 animate-in slide-in-from-bottom duration-500 z-50">
           {/* Header Image/Emoji */}
           <div className="relative h-[40%] w-full bg-gradient-to-br from-slate-900 to-black flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
               <div className="text-[140px] animate-in zoom-in duration-700 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10">
                   {getEmojiForKeyword(result.foodName)}
               </div>
               
               <button 
                onClick={handleRetake} 
                className="absolute top-8 left-6 p-2.5 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 border border-white/10 z-20"
               >
                   <X size={20} />
               </button>
           </div>

           {/* Result Card */}
           <div className="flex-1 bg-white rounded-t-[40px] px-8 pt-2 relative z-10 overflow-y-auto pb-safe shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
               <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-8"></div>

               <div className="flex justify-between items-start mb-8">
                   <div>
                       <div className="flex items-center gap-2 mb-2">
                           <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">Verified</span>
                           <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Gemini Flash Analysis</span>
                       </div>
                       <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
                           {result.foodName}
                       </h2>
                       <p className="text-slate-500 text-sm font-medium mt-1">{result.reasoning}</p>
                   </div>
               </div>

               {/* Macro Grid */}
               <div className="grid grid-cols-2 gap-4 mb-8">
                   {/* Calories */}
                   <div className="bg-orange-50 p-5 rounded-[24px] border border-orange-100 relative overflow-hidden group">
                       <div className="flex items-center gap-2 mb-1 text-orange-500">
                           <Flame size={20} fill="currentColor" />
                           <span className="font-bold text-sm">Energy</span>
                       </div>
                       <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{result.calories}</p>
                       <p className="text-xs text-orange-400 font-bold mt-1">KCAL</p>
                   </div>

                   {/* Protein */}
                   <div className="bg-blue-50 p-5 rounded-[24px] border border-blue-100 relative overflow-hidden group">
                       <div className="flex items-center gap-2 mb-1 text-blue-500">
                           <Droplets size={20} fill="currentColor" />
                           <span className="font-bold text-sm">Protein</span>
                       </div>
                       <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{result.protein}g</p>
                       <p className="text-xs text-blue-400 font-bold mt-1">BUILD</p>
                   </div>

                   {/* Carbs */}
                   <div className="bg-purple-50 p-5 rounded-[24px] border border-purple-100 relative overflow-hidden group">
                       <div className="flex items-center gap-2 mb-1 text-purple-500">
                           <Wheat size={20} />
                           <span className="font-bold text-sm">Carbs</span>
                       </div>
                       <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{result.carbs}g</p>
                   </div>

                   {/* Fat */}
                   <div className="bg-yellow-50 p-5 rounded-[24px] border border-yellow-100 relative overflow-hidden group">
                       <div className="flex items-center gap-2 mb-1 text-yellow-500">
                           <div className="w-5 h-5 rounded-full border-[3px] border-yellow-500"></div>
                           <span className="font-bold text-sm">Fat</span>
                       </div>
                       <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{result.fat}g</p>
                   </div>
               </div>
           </div>

           <div className="absolute bottom-0 left-0 right-0 p-6 pt-0 bg-white z-20">
               <button 
                onClick={handleConfirm}
                className="w-full bg-[#0F172A] text-white font-bold text-lg py-5 rounded-[20px] shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
               >
                   <CheckCircle2 size={24} className="text-green-400" />
                   Log Food & Update Plan
               </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default CheatCode;
