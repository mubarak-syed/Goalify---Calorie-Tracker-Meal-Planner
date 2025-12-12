
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, WorkoutPlan, Exercise, WorkoutLog } from '../types';
import { PlayCircle, Loader2, Sparkles, Clock, X, Check, CheckCircle, Pause, Play, CalendarDays, Moon, Dumbbell } from 'lucide-react';
import { generateWorkoutPlan } from '../services/geminiService';

interface Props {
  user: UserProfile;
  onLogExercise: (log: WorkoutLog) => void;
  logs: WorkoutLog[];
}

const MindBody: React.FC<Props> = ({ user, onLogExercise, logs }) => {
  const [weeklyPlan, setWeeklyPlan] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      setLoading(true);
      const plan = await generateWorkoutPlan(user);
      if (plan && plan.length > 0) {
        setWeeklyPlan(plan);
      }
      setLoading(false);
    };
    fetchWorkout();
  }, [user]);

  // Clean up timer
  useEffect(() => {
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
      if (isTimerRunning) {
          timerRef.current = setInterval(() => {
              setTimerSeconds(prev => prev + 1);
          }, 1000);
      } else {
          if (timerRef.current) clearInterval(timerRef.current);
      }
      return () => {
          if (timerRef.current) clearInterval(timerRef.current);
      }
  }, [isTimerRunning]);

  const handleOpenExercise = (ex: Exercise) => {
      setSelectedExercise(ex);
      setTimerSeconds(0);
      setIsTimerRunning(false);
  };

  const handleCloseExercise = () => {
      setSelectedExercise(null);
      setIsTimerRunning(false);
  };

  const toggleTimer = () => {
      setIsTimerRunning(!isTimerRunning);
  };

  const handleFinishSet = () => {
      if (!selectedExercise) return;
      
      const duration = timerSeconds > 0 ? timerSeconds : 60; // Default to 1min if logged manually without timer
      const burned = Math.round((duration / 60) * 8); // Approx 8 cal/min for strength

      onLogExercise({
          id: Date.now().toString(),
          exerciseName: selectedExercise.name,
          durationSeconds: duration,
          caloriesBurned: burned,
          timestamp: Date.now()
      });

      handleCloseExercise();
  };

  const formatTime = (secs: number) => {
      const mins = Math.floor(secs / 60);
      const s = secs % 60;
      return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isExerciseCompleted = (exName: string) => {
      return logs.some(l => l.exerciseName === exName && new Date(l.timestamp).toDateString() === new Date().toDateString());
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-slate-900 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
        <p className="text-slate-500 font-medium animate-pulse">Designing your 7-day home workout plan...</p>
      </div>
    );
  }

  const currentDay = weeklyPlan[selectedDayIndex];

  return (
    <div className="pb-32 px-4 pt-6 md:pt-8 relative animate-in fade-in duration-500">
      <div className="w-full max-w-[1600px] mx-auto space-y-8">
        
        {/* Header & Date Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                 <h1 className="text-slate-900 font-extrabold text-3xl md:text-4xl tracking-tight mb-2">
                    Weekly Movement
                </h1>
                <p className="text-slate-500 font-medium">Your personalized home-based schedule.</p>
            </div>
            
            {/* Date Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {weeklyPlan.map((day, i) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedDayIndex(i)}
                  className={`
                    min-w-[70px] aspect-[4/5] rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-300 border shadow-sm
                    ${selectedDayIndex === i ? 'bg-yellow-400 text-slate-900 border-yellow-400 scale-105 shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}
                  `}
                >
                  <span className={`text-xs font-bold uppercase ${selectedDayIndex === i ? 'text-slate-900' : 'text-slate-400'}`}>{day.day.substring(0,3)}</span>
                  <span className={`text-xl font-bold ${selectedDayIndex === i ? 'text-slate-900' : 'text-slate-700'}`}>{i + 1}</span>
                  {day.restDay && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1"></span>}
                </div>
              ))}
            </div>
        </div>

        {/* Content Area */}
        {currentDay && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left: Hero Banner */}
                <div className="lg:col-span-12">
                     <div className="relative w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[24/7] rounded-[32px] overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-600 group shadow-xl shadow-purple-200">
                        {/* Background Emoji/Visual */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-[150px] md:text-[200px] filter grayscale group-hover:grayscale-0 transition-all duration-700">
                                {currentDay.restDay ? '💤' : '🏃‍♂️'}
                            </span>
                        </div>
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-transparent to-transparent"></div>
                        
                        <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold text-white mb-3 shadow-sm">
                                        <CalendarDays size={14} /> {currentDay.day}
                                        {currentDay.restDay && <span className="bg-blue-400 text-white px-2 py-0.5 rounded-full text-[10px] ml-1">REST DAY</span>}
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-2 leading-tight">
                                        {currentDay.title || "Workout of the Day"}
                                    </h2>
                                    <p className="text-purple-100 text-sm md:text-base max-w-2xl leading-relaxed font-medium">
                                        {currentDay.description || "Get ready to move your body."}
                                    </p>
                                </div>
                                
                                {!currentDay.restDay && (
                                     <button className="bg-white text-purple-700 font-bold py-4 px-8 rounded-2xl transition-transform shadow-lg shadow-black/10 active:scale-95 flex items-center gap-2 whitespace-nowrap hover:bg-slate-50">
                                        <PlayCircle fill="currentColor" size={24} /> Start Session
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right/Bottom: Rounds Grid */}
                {!currentDay.restDay ? (
                    <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentDay.rounds?.map((round, rIdx) => (
                        <div key={rIdx} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 animate-in slide-in-from-bottom duration-500" style={{ animationDelay: `${rIdx * 150}ms` }}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 font-bold border border-slate-100">{rIdx + 1}</div>
                                <h3 className="text-slate-900 font-bold text-xl">{round.name}</h3>
                            </div>
                            
                            <div className="space-y-3">
                            {round.exercises?.map((ex, eIdx) => {
                                const completed = isExerciseCompleted(ex.name);
                                return (
                                    <div 
                                        key={eIdx} 
                                        onClick={() => handleOpenExercise(ex)}
                                        className={`
                                            rounded-2xl p-4 flex items-center gap-4 transition-all cursor-pointer border group
                                            ${completed ? 'bg-green-50 border-green-200' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:border-purple-200 hover:shadow-md'}
                                        `}
                                    >
                                        {/* Emoji Thumbnail */}
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 transition-colors ${completed ? 'bg-green-100 text-green-700' : 'bg-white border border-slate-100 shadow-sm group-hover:scale-105'}`}>
                                            {completed ? <Check size={28} /> : ex.emoji}
                                        </div>
                                        
                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-bold text-base ${completed ? 'text-green-700' : 'text-slate-900'}`}>{ex.name}</h4>
                                            <p className={`text-xs mt-1 line-clamp-1 ${completed ? 'text-green-600' : 'text-slate-500'}`}>
                                            {ex.instruction}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${completed ? 'bg-green-200 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                                                    {ex.reps}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Play Button */}
                                        <button className={`${completed ? 'text-green-500' : 'text-slate-300 group-hover:text-purple-500'} transition-colors`}>
                                            {completed ? <CheckCircle size={24} /> : <PlayCircle size={24} strokeWidth={1.5} />}
                                        </button>
                                    </div>
                                );
                            })}
                            </div>
                        </div>
                        ))}
                    </div>
                ) : (
                    <div className="lg:col-span-12 flex flex-col items-center justify-center py-20 text-center animate-in fade-in bg-white rounded-[32px] border border-slate-100 shadow-sm">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-6">
                            <Moon size={48} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Rest & Recover</h3>
                        <p className="text-slate-500 max-w-md">Your muscles need time to repair and grow. Light stretching or a short walk is recommended today.</p>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* --- EXERCISE DETAIL OVERLAY (LIGHT THEME) --- */}
      {selectedExercise && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex justify-center overflow-y-auto">
              <div className="w-full max-w-2xl bg-white min-h-full flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl">
                  
                  {/* Top Bar */}
                  <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur z-10">
                      <button onClick={handleCloseExercise} className="p-2 bg-slate-50 rounded-full text-slate-600 hover:bg-slate-100 transition-colors">
                          <X size={20} />
                      </button>
                      <span className="text-slate-900 font-bold tracking-wide">Exercise Details</span>
                      <div className="w-10"></div> {/* Spacer */}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 p-6 md:p-10 flex flex-col items-center">
                      
                      {/* Hero Emoji */}
                      <div className="w-full aspect-video md:aspect-[2/1] bg-gradient-to-br from-slate-50 to-slate-100 rounded-[40px] flex items-center justify-center mb-8 border border-slate-100 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-purple-500/5 blur-[80px]"></div>
                          <span className="text-[120px] md:text-[160px] animate-in zoom-in duration-500 drop-shadow-xl relative z-10 group-hover:scale-110 transition-transform">
                              {selectedExercise.emoji}
                          </span>
                      </div>

                      <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 text-center mb-4">{selectedExercise.name}</h2>
                      <div className="inline-block bg-slate-900 text-white px-6 py-2 rounded-full text-base font-bold mb-10 shadow-lg shadow-slate-900/20">
                          Target: {selectedExercise.reps}
                      </div>

                      {/* Timer Section */}
                      <div className="w-full bg-slate-50 rounded-[32px] p-8 border border-slate-100 mb-10">
                          <div className="flex items-center justify-between mb-8">
                              <div className="flex items-center gap-3 text-slate-500">
                                  <Clock size={20} />
                                  <span className="text-sm font-bold uppercase tracking-wider">Duration</span>
                              </div>
                              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${isTimerRunning ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                  {isTimerRunning ? 'RECORDING' : 'PAUSED'}
                              </span>
                          </div>
                          
                          <div className="text-center mb-8">
                              <span className="text-7xl md:text-8xl font-extrabold text-slate-900 font-mono tracking-tighter">
                                  {formatTime(timerSeconds)}
                              </span>
                          </div>

                          <div className="flex gap-4">
                              <button 
                                onClick={toggleTimer}
                                className={`flex-1 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 ${isTimerRunning ? 'bg-white border-2 border-slate-200 text-red-500 hover:bg-slate-50' : 'bg-green-500 text-white shadow-lg shadow-green-500/20 hover:bg-green-600'}`}
                              >
                                  {isTimerRunning ? <><Pause fill="currentColor" /> Pause Timer</> : <><Play fill="currentColor" /> Start Timer</>}
                              </button>
                          </div>
                      </div>

                      {/* Instructions */}
                      <div className="w-full bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                          <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                              <Sparkles size={16} className="text-purple-500" /> Instructions
                          </h3>
                          <p className="text-slate-600 leading-relaxed text-lg md:text-xl font-medium">
                              {selectedExercise.instruction}
                          </p>
                      </div>

                  </div>

                  {/* Bottom Action */}
                  <div className="p-6 pb-8 md:p-6 bg-white border-t border-slate-100 sticky bottom-0 z-20">
                      <button 
                        onClick={handleFinishSet}
                        className="w-full bg-slate-900 text-white font-bold text-xl py-5 rounded-2xl shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform hover:bg-slate-800"
                      >
                          <CheckCircle size={28} /> Log Set & Finish
                      </button>
                  </div>

              </div>
          </div>
      )}
    </div>
  );
};

export default MindBody;
