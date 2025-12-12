
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { UserProfile, DayPlan, Meal, WorkoutLog, Goal } from '../types';
import { Search, ChevronRight, Droplets, Heart, Flame, ShoppingBag, Plus, Activity as ActivityIcon, Check, Utensils, Sparkles, RefreshCw, ExternalLink, Clock, Dumbbell, Trophy, CalendarDays, MoreHorizontal } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, LineChart, Line } from 'recharts';
import { getEmojiForKeyword } from '../constants';

interface Props {
  user: UserProfile;
  plan: DayPlan;
  workoutLogs?: WorkoutLog[];
  isGenerating?: boolean;
  dayOffset: number;
  onNavigate: (tab: string) => void;
  onDayChange: (offset: number) => void;
}

type ScheduleItem = {
  id: string;
  time: string;
  minutes: number;
  title: string;
  type: 'water' | 'meal' | 'workout' | 'marker' | 'current-time';
  completed: boolean;
  active?: boolean;
  tag?: string;
  kcal?: number;
  meal?: Meal;
  icon?: string | React.ReactNode;
};

const Dashboard: React.FC<Props> = ({ user, plan, workoutLogs = [], isGenerating = false, dayOffset, onNavigate, onDayChange }) => {
  // --- Real-time Clock ---
  const [now, setNow] = useState(new Date());
  // Local state for water (in a real app, this would be in App.tsx or DB)
  const [waterIntake, setWaterIntake] = useState(1.2); 
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000); // Update every 10s
    return () => clearInterval(timer);
  }, []);

  // Scroll to "Now" on mount if today
  useEffect(() => {
    if (dayOffset === 0 && timelineRef.current) {
        const nowElement = document.getElementById('timeline-now');
        if (nowElement) {
            nowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [dayOffset]);

  // --- Data Preparation ---
  const isToday = dayOffset === 0;
  const consumed = plan.totalCaloriesConsumed;
  // Calculate Target based on Goal
  const target = user.dailyCalories;
  
  // Real Workout Data
  const burnedCalories = isToday ? workoutLogs.reduce((acc, log) => acc + log.caloriesBurned, 0) : 0;
  const activeMinutes = isToday ? Math.round(workoutLogs.reduce((acc, log) => acc + (log.durationSeconds / 60), 0)) : 0;
  const workoutCompleted = isToday && workoutLogs.length > 0;
  
  // Dynamic Date Data (Next 5 Days)
  const dates = useMemo(() => {
    const d = [];
    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 5; i++) {
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + i);
        d.push({
            day: nextDate.getDate().toString(),
            weekday: i === 0 ? 'Today' : days[nextDate.getDay()],
            offset: i,
            active: i === dayOffset
        });
    }
    return d;
  }, [dayOffset]);

  const getCurrentMinutes = () => {
      return now.getHours() * 60 + now.getMinutes();
  };

  const formatCurrentTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Merge Meals with Static Activities for the Schedule
  const scheduleItems = useMemo(() => {
    const currentMins = getCurrentMinutes();

    const baseItems: ScheduleItem[] = [
      { id: 'start', time: '07:00 AM', minutes: 420, title: 'Morning Rise', type: 'marker', completed: isToday, icon: <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> },
      { id: 'water1', time: '08:00 AM', minutes: 480, title: 'Hydration Check', type: 'water', completed: waterIntake >= 0.5, active: false, icon: '💧' },
      // Map breakfast
      ...(plan.meals.filter(m => m.type === 'Breakfast').map(m => ({
        id: m.id,
        time: '08:30 AM', 
        minutes: 510,
        title: m.name, 
        type: 'meal' as const, 
        tag: 'Breakfast', 
        kcal: m.calories, 
        completed: false, 
        meal: m, 
        active: false, 
        icon: m.emoji || getEmojiForKeyword(m.name)
      }))),
      // Workout Item
      { id: 'workout', time: '10:00 AM', minutes: 600, title: 'Daily Movement', type: 'workout', tag: 'Strength / Cardio', completed: workoutCompleted, active: !workoutCompleted, icon: '🏃' },
      // Map Lunch
      ...(plan.meals.filter(m => m.type === 'Lunch').map(m => ({
        id: m.id,
        time: '01:00 PM', 
        minutes: 780,
        title: m.name, 
        type: 'meal' as const, 
        tag: 'Lunch', 
        kcal: m.calories, 
        completed: false, 
        meal: m, 
        active: false, 
        icon: m.emoji || getEmojiForKeyword(m.name)
      }))),
      { id: 'water2', time: '02:30 PM', minutes: 870, title: 'Hydration Check', type: 'water', completed: waterIntake >= 1.5, active: false, icon: '💧' },
      // Map Snack
      ...(plan.meals.filter(m => m.type === 'Snack').map(m => ({
        id: m.id,
        time: '04:30 PM', 
        minutes: 990,
        title: m.name, 
        type: 'meal' as const, 
        tag: 'Snack', 
        kcal: m.calories, 
        completed: false, 
        meal: m, 
        active: false, 
        icon: m.emoji || getEmojiForKeyword(m.name)
      }))),
      // Map Dinner
      ...(plan.meals.filter(m => m.type === 'Dinner').map(m => ({
        id: m.id,
        time: '07:30 PM', 
        minutes: 1170,
        title: m.name, 
        type: 'meal' as const, 
        tag: 'Dinner', 
        kcal: m.calories, 
        completed: false, 
        meal: m, 
        active: false, 
        icon: m.emoji || getEmojiForKeyword(m.name)
      }))),
      { id: 'end', time: '10:00 PM', minutes: 1320, title: 'Wind Down', type: 'marker', completed: false, icon: <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> }
    ];

    let allItems = baseItems;

    // Only add Current Time Marker if showing Today
    if (isToday) {
        const currentTimeItem: ScheduleItem = {
            id: 'now',
            time: formatCurrentTime(now),
            minutes: currentMins,
            title: 'Current Time',
            type: 'current-time',
            completed: false,
            icon: <Clock size={14} />
        };
        allItems = [...baseItems, currentTimeItem];
    }

    // Combine and Sort
    allItems.sort((a, b) => {
        if (a.minutes === b.minutes) {
             return a.type === 'current-time' ? 1 : -1;
        }
        return a.minutes - b.minutes;
    });

    // Post-process to set completed/active states based on time
    return allItems.map(item => {
        if (item.type === 'current-time') return item;
        
        // If Future Day: Nothing is past, nothing is completed
        const isPast = isToday ? item.minutes < currentMins : false; 
        
        return {
            ...item,
            completed: item.type === 'workout' ? workoutCompleted : (item.type === 'water' ? item.completed : (isToday && isPast)), 
            isPast: isPast 
        };
    });

  }, [plan.meals, workoutCompleted, now, isToday, waterIntake]);

  // Determine current meal context for Shopping List
  const nextMealContext = useMemo(() => {
    if (!isToday) return { type: 'Breakfast', label: 'Start of Day' };

    const hour = now.getHours();
    if (hour < 10) return { type: 'Breakfast', label: 'Breakfast' };
    if (hour < 14) return { type: 'Lunch', label: 'Lunch' };
    if (hour < 17) return { type: 'Snack', label: 'Snack' };
    return { type: 'Dinner', label: 'Dinner' };
  }, [now, isToday]);

  // Shopping List based on Next Meal
  const shoppingList = useMemo(() => {
    const meal = plan.meals.find(m => m.type === nextMealContext.type) || plan.meals.find(m => m.type === 'Lunch');
    if (!meal) return [];

    if (meal.detailedIngredients && meal.detailedIngredients.length > 0) {
        return meal.detailedIngredients.map((ing, idx) => ({ 
            name: ing.name, 
            amount: ing.amount, 
            checked: idx < 2, 
            emoji: ing.emoji || getEmojiForKeyword(ing.name)
        }));
    }

    return meal.ingredients.map((item, idx) => ({ 
        name: item, 
        amount: '1 portion', 
        checked: idx < 2, 
        emoji: getEmojiForKeyword(item) 
    }));
  }, [plan.meals, nextMealContext]);

  // Activity Data
  const activityData = [
    { day: 'Sun', val: 40 }, 
    { day: 'Mon', val: 65 }, 
    { day: 'Tue', val: Math.min(100, Math.max(20, (activeMinutes / 60) * 100)) }, 
    { day: 'Wed', val: 0 }, 
    { day: 'Thu', val: 0 }, 
    { day: 'Fri', val: 0 }, 
    { day: 'Sat', val: 0 },
  ];

  // Macros
  const macroData = [
    { name: 'Fats', val: 70, color: '#10b981' }, // green
    { name: 'Prot', val: user.dailyProtein, color: '#f59e0b' }, // yellow
    { name: 'Carb', val: 300, color: '#8b5cf6' }, // purple
  ];

  // Calorie Calculation including Burned
  const netCalories = consumed - burnedCalories;
  const remainingCalories = Math.max(0, target - netCalories);
  
  const calorieData = [
    { name: 'Net Consumed', value: Math.max(0, netCalories) },
    { name: 'Remaining', value: remainingCalories },
  ];
  const CALORIE_COLORS = ['#f43f5e', '#f1f5f9']; 

  const addWater = () => {
      setWaterIntake(prev => Math.min(4, prev + 0.25));
  };

  // Weight Progress Logic
  const goalWeight = user.goal === Goal.CUT ? user.weight - 5 : user.goal === Goal.BULK ? user.weight + 5 : user.weight;
  const weightProgress = 0.3; // Mock progress towards goal

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32 animate-in fade-in duration-500">
      
      {/* GENERATING INDICATOR */}
      {isGenerating && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
              <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700">
                  <div className="relative">
                      <Sparkles size={18} className="text-purple-400" />
                      <div className="absolute inset-0 animate-ping opacity-75 bg-purple-400 rounded-full"></div>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-sm font-bold">Goalify Working...</span>
                      <span className="text-[10px] text-slate-400">Designing {dayOffset === 1 ? 'Tomorrow' : 'Future'} plan</span>
                  </div>
                  <RefreshCw size={16} className="animate-spin text-slate-500" />
              </div>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hello, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 font-medium">You have {scheduleItems.filter(i => i.type !== 'marker' && i.type !== 'current-time').length} activities {isToday ? 'today' : 'scheduled'}</p>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <input 
            type="text" 
            placeholder="Search by receipts and more..." 
            className="w-full bg-white border border-gray-200 rounded-full py-3.5 pl-12 pr-4 text-sm text-slate-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none shadow-sm transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={20} />
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Schedule (4 cols) */}
        <div className="md:col-span-4 lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 flex flex-col h-[800px] relative overflow-hidden">
            
            {/* Header */}
            <div className="p-6 pb-2 border-b border-slate-50 bg-white z-20">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <CalendarDays size={18} className="text-slate-400"/> {isToday ? "Today's Schedule" : "Planned Schedule"}
                    </h3>
                    <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><MoreHorizontal size={16} /></button>
                </div>

                {/* Date Strip (Sticky-ish feel inside container) */}
                <div className="flex items-center justify-between bg-slate-50/80 backdrop-blur-sm p-1.5 rounded-2xl">
                    {dates.map((d, i) => (
                        <button 
                            key={i} 
                            onClick={() => onDayChange(d.offset)}
                            className={`flex flex-col items-center justify-center w-full py-2 rounded-xl text-xs font-bold transition-all ${d.active ? 'bg-white shadow-sm text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <span className="text-[10px] uppercase opacity-70 mb-0.5">{d.weekday.slice(0,3)}</span>
                            <span className="text-sm">{d.day}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline Scroll Area */}
            <div ref={timelineRef} className="flex-1 overflow-y-auto custom-scrollbar relative bg-white pl-0">
                
                {/* Timeline Content */}
                <div className="relative py-6 pr-6 pl-0">
                     {/* Continuous Vertical Line */}
                     <div className="absolute left-[34px] top-6 bottom-6 w-[2px] bg-slate-100 z-0"></div>

                    {scheduleItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-center mt-10">
                            <RefreshCw className="animate-spin mb-2" />
                            <span className="text-xs">Generating Plan...</span>
                        </div>
                    ) : scheduleItems.map((item, index) => {
                        
                        // 1. Current Time Indicator
                        if (item.type === 'current-time') {
                            return (
                                <div id="timeline-now" key={item.id} className="relative z-10 flex items-center mb-8 mt-2 pl-2">
                                    <div className="w-[52px] flex justify-end pr-3">
                                        <span className="text-[10px] font-bold text-red-500">{item.time}</span>
                                    </div>
                                    <div className="relative flex items-center w-full">
                                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.2)]"></div>
                                        <div className="h-[2px] bg-red-500 w-full ml-2 opacity-20"></div>
                                        <span className="absolute right-0 bg-red-50 text-red-500 text-[9px] font-bold px-2 py-0.5 rounded-full">NOW</span>
                                    </div>
                                </div>
                            );
                        }

                        // 2. Markers (Start/End)
                        if (item.type === 'marker') {
                             return (
                                <div key={item.id} className="relative z-10 flex items-center mb-8 pl-2 opacity-50">
                                    <div className="w-[52px] text-right pr-4">
                                        <span className="text-[10px] font-medium text-slate-400">{item.time}</span>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-slate-300 border-[3px] border-white ring-1 ring-slate-200"></div>
                                    <span className="ml-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.title}</span>
                                </div>
                             );
                        }

                        const isPast = (item as any).isPast;
                        const isNext = !isPast && !item.completed;

                        // 3. Activity Cards
                        return (
                            <div key={item.id} className={`relative z-10 flex gap-4 mb-8 pl-2 group ${isPast ? 'opacity-60 grayscale-[0.3]' : ''}`}>
                                {/* Time Column */}
                                <div className="w-[52px] flex flex-col items-end shrink-0 pt-1">
                                    <span className={`text-xs font-bold ${isNext ? 'text-slate-900' : 'text-slate-400'}`}>{item.time}</span>
                                    {isNext && <span className="text-[9px] font-bold text-blue-500">Next</span>}
                                </div>

                                {/* Timeline Dot */}
                                <div className="relative flex flex-col items-center pt-1.5">
                                    <div className={`
                                        w-3 h-3 rounded-full border-[2px] ring-4 ring-white transition-all
                                        ${item.completed ? 'bg-green-500 border-green-500' : 
                                          item.type === 'meal' ? 'bg-orange-100 border-orange-400' :
                                          item.type === 'workout' ? 'bg-purple-100 border-purple-500' : 
                                          'bg-blue-100 border-blue-400'}
                                    `}></div>
                                </div>

                                {/* Content Card */}
                                <div className="flex-1 min-w-0">
                                    {/* --- MEAL CARD --- */}
                                    {item.type === 'meal' && (
                                        <div 
                                            onClick={() => onNavigate('meals')}
                                            className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-orange-200 transition-all cursor-pointer group/card relative overflow-hidden"
                                        >
                                            <div className="flex justify-between items-start mb-2 relative z-10">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                                                    <p className="text-[10px] text-slate-500 font-medium mt-0.5 line-clamp-1">{item.meal?.description}</p>
                                                </div>
                                                <span className="text-xl group-hover/card:scale-110 transition-transform">{item.icon}</span>
                                            </div>
                                            <div className="flex gap-2 relative z-10">
                                                <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md flex items-center gap-1 border border-orange-100">
                                                    <Flame size={10} /> {item.kcal} kcal
                                                </span>
                                                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md flex items-center gap-1 border border-blue-100">
                                                    <Utensils size={10} /> {item.meal?.protein}g Prot
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- WORKOUT CARD --- */}
                                    {item.type === 'workout' && (
                                        <div 
                                            onClick={() => onNavigate('mind')}
                                            className="bg-[#FAFAFF] p-3.5 rounded-2xl border border-purple-100 shadow-[0_2px_8px_rgba(100,100,255,0.03)] hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group/card"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <span className="bg-purple-100 text-purple-600 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide">Gym</span>
                                                        {item.completed && <span className="text-[9px] font-bold text-green-600 flex items-center gap-0.5"><Check size={10}/> Done</span>}
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-purple-50 group-hover/card:bg-purple-500 group-hover/card:text-white transition-colors">
                                                    <Dumbbell size={14} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500">
                                                <span className="flex items-center gap-1"><Clock size={10}/> 45m</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="flex items-center gap-1"><Flame size={10}/> ~300 kcal</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- WATER CARD --- */}
                                    {item.type === 'water' && (
                                        <div 
                                            onClick={addWater}
                                            className="flex items-center justify-between p-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer group/card"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-500 shadow-sm border border-blue-100">
                                                    <Droplets size={14} />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">Hydration Check</span>
                                            </div>
                                            <button className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover/card:bg-blue-500 group-hover/card:text-white transition-colors">
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Reports & Daily Intake (5 cols) */}
        <div className="md:col-span-8 lg:col-span-6 space-y-6">
           
           {/* Reports Grid */}
           <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2"><ActivityIcon size={18} className="text-slate-400" /> Report <span className="text-slate-400 text-sm font-normal">Goals this week</span></h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  
                  {/* Card 1: Hydration (Interactive) */}
                  <div className="bg-[#E0F2FE] p-5 rounded-[24px] border border-blue-100 relative overflow-hidden h-36 flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all" onClick={addWater}>
                      <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <span className="text-slate-600 text-xs font-bold uppercase tracking-wider">Hydration</span>
                            <div className="mt-1">
                                <span className="text-2xl font-extrabold text-[#0EA5E9]">{waterIntake.toFixed(1)}</span>
                                <span className="text-xs text-slate-500 ml-1 font-bold">/ 3.0 L</span>
                            </div>
                        </div>
                        <button className="w-8 h-8 rounded-full bg-white/50 hover:bg-white flex items-center justify-center text-blue-500 shadow-sm transition-colors">
                            <Plus size={16} />
                        </button>
                      </div>
                      
                      <div className="w-full bg-white/40 h-2 rounded-full overflow-hidden mt-2">
                          <div className="bg-[#0EA5E9] h-full rounded-full transition-all duration-500" style={{ width: `${(waterIntake/3)*100}%` }}></div>
                      </div>
                      
                      <Droplets className="absolute -bottom-4 -right-4 text-[#0EA5E9]/20 w-24 h-24 rotate-12 group-hover:scale-110 transition-transform" />
                  </div>

                  {/* Card 2: Weight Goal Progress (Visual) */}
                  <div className="bg-[#FEF3C7] p-5 rounded-[24px] border border-yellow-100 relative flex flex-col justify-between h-36 overflow-hidden">
                      <div className="relative z-10">
                        <span className="text-slate-600 text-xs font-bold uppercase tracking-wider">Weight Goal</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-extrabold text-amber-600">{user.weight}</span>
                            <span className="text-xs text-slate-500 font-bold">➜ {goalWeight} kg</span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-600/80 bg-amber-200/50 px-2 py-0.5 rounded-full inline-block mt-2">
                             {user.goal.includes('Cut') ? 'Cutting Phase' : user.goal.includes('Bulk') ? 'Bulking Phase' : 'Maintaining'}
                        </span>
                      </div>
                      
                      {/* Progress Bar Visual */}
                      <div className="relative h-2 w-full bg-amber-200/50 rounded-full mt-2 overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-amber-500 w-[30%] rounded-full"></div>
                      </div>

                      <Trophy className="absolute -bottom-2 -right-2 text-amber-500/10 w-20 h-20 rotate-[-10deg]" />
                  </div>

                  {/* Card 3: Active Zone (Replaced BPM) */}
                  <div className="bg-[#DCFCE7] p-5 rounded-[24px] border border-green-100 h-36 relative overflow-hidden flex flex-col justify-between">
                      <div className="relative z-10">
                         <span className="text-slate-600 text-xs font-bold uppercase tracking-wider">Active Zone</span>
                         <div className="mt-1">
                            <span className="text-2xl font-extrabold text-green-600">{activeMinutes}</span>
                            <span className="text-xs text-slate-500 ml-1 font-bold">mins</span>
                         </div>
                         <div className="text-[10px] text-green-700 font-bold mt-1">
                             {burnedCalories > 0 ? `${burnedCalories} kcal burned` : "No activity yet"}
                         </div>
                      </div>
                      
                      {/* Simple Bar Visual for Activity */}
                      <div className="flex items-end gap-1 h-12 mt-2 opacity-60">
                          <div className="w-1/5 bg-green-400/40 h-[30%] rounded-t-sm"></div>
                          <div className="w-1/5 bg-green-400/60 h-[50%] rounded-t-sm"></div>
                          <div className="w-1/5 bg-green-500 h-[80%] rounded-t-sm"></div>
                          <div className="w-1/5 bg-green-400/50 h-[40%] rounded-t-sm"></div>
                          <div className="w-1/5 bg-green-400/30 h-[20%] rounded-t-sm"></div>
                      </div>
                      
                      <Dumbbell className="absolute top-4 right-4 text-green-600/20 w-8 h-8" />
                  </div>

                  {/* Card 4: Energy Balance (Calories) */}
                  <div className="bg-[#FFE4E6] p-5 rounded-[24px] border border-rose-100 flex items-center justify-between relative overflow-hidden h-36">
                       <div className="z-10 flex flex-col justify-center h-full">
                           <span className="text-slate-600 text-xs font-bold uppercase tracking-wider">Budget Left</span>
                           <span className="text-3xl font-extrabold text-rose-500 mt-1">{remainingCalories}</span>
                           <span className="text-[10px] text-slate-500 font-bold">kcal remaining</span>
                       </div>
                       <div className="w-20 h-20 relative">
                           <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={calorieData} innerRadius={25} outerRadius={35} dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                                        {calorieData.map((e, i) => <Cell key={i} fill={CALORIE_COLORS[i]} />)}
                                    </Pie>
                                </PieChart>
                           </ResponsiveContainer>
                           <Flame className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-500 w-6 h-6" fill="currentColor" />
                       </div>
                  </div>
              </div>
           </div>

           {/* Bottom Row: Daily Intake & Activity */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
               {/* Daily Intake */}
               <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                   <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-sm">
                       <Utensils size={16} className="text-slate-400" /> Daily Intake
                   </h3>
                   <div className="flex justify-between px-2 mb-6">
                       {macroData.map((macro, i) => (
                           <div key={i} className="flex flex-col items-center gap-3">
                               <div className="w-10 h-24 bg-slate-50 rounded-full relative overflow-hidden border border-slate-100">
                                   <div 
                                    className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-1000" 
                                    style={{ height: `${Math.min(100, (macro.val/100)*40)}%`, backgroundColor: macro.color }} 
                                   ></div>
                               </div>
                               <div className="text-center">
                                   <span className="block text-xs text-slate-400 font-bold">{macro.name}</span>
                                   <span className="block text-sm font-extrabold text-slate-800">{macro.val}</span>
                               </div>
                           </div>
                       ))}
                   </div>
                   <div className="flex gap-2">
                        <div className="bg-blue-50 p-2 rounded-xl text-blue-500 border border-blue-100"><Droplets size={20}/></div>
                        <div className="flex-1 flex gap-1 h-10 items-end pb-1 px-1">
                             <div className="w-full bg-blue-100 h-4 rounded-t-sm"></div>
                             <div className="w-full bg-blue-200 h-6 rounded-t-sm"></div>
                             <div className="w-full bg-blue-500 h-8 rounded-t-sm shadow-sm"></div>
                             <div className="w-full bg-blue-50 h-3 rounded-t-sm"></div>
                        </div>
                        <button onClick={addWater} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"><Plus size={20}/></button>
                   </div>
               </div>

               {/* Activity */}
               <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm"><ActivityIcon size={16} className="text-slate-400" /> Activity</h3>
                        <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{workoutCompleted ? '100%' : `${Math.min(100, Math.round((activeMinutes / 45) * 100))}%`}</span>
                    </div>
                    
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityData}>
                                <Tooltip 
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                                />
                                <Bar dataKey="val" radius={[6, 6, 6, 6]} barSize={12}>
                                    {activityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 2 ? '#8B5CF6' : '#E2E8F0'} />
                                    ))}
                                </Bar>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} interval={0} dy={10} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
               </div>

           </div>
        </div>

        {/* RIGHT COLUMN: Shopping List & Promo (3 cols) */}
        <div className="md:col-span-12 lg:col-span-3 space-y-6">
            
            {/* Ingredients Required (formerly Shopping List) */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <ShoppingBag size={18} /> Ingredients Required
                        <span className="text-xs font-normal text-slate-400">({nextMealContext.label})</span>
                    </h3>
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer">
                        <ChevronRight size={16} />
                    </div>
                 </div>

                 <div className="space-y-4 mb-8">
                     {shoppingList.length > 0 ? shoppingList.map((item, i) => (
                         <div key={i} className="flex items-center justify-between group p-2 rounded-xl -mx-2 hover:bg-slate-50 transition-colors">
                             <div className="flex items-center gap-3">
                                 <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${item.checked ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                                     {item.checked && <Check size={12} className="text-white" />}
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <span className="text-xl">{item.emoji}</span>
                                     <span className={`text-sm font-medium ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.name}</span>
                                 </div>
                             </div>
                             
                             <div className="flex items-center gap-3">
                                 <span className="text-xs text-slate-400 font-medium">{item.amount}</span>
                                 <a 
                                     href={`https://www.amazon.com/s?k=${encodeURIComponent(item.name)}`}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-yellow-400 hover:text-slate-900 transition-colors"
                                     title="Buy on Amazon"
                                 >
                                     <ShoppingBag size={14} />
                                 </a>
                             </div>
                         </div>
                     )) : (
                         <div className="text-center text-slate-400 text-sm py-4">No ingredients found.</div>
                     )}
                 </div>

                 <div className="flex flex-col gap-3">
                     <button 
                        onClick={() => onNavigate('meals')}
                        className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-2xl transition-all shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-2"
                     >
                         <Utensils size={20} /> Got the items - Let's cook
                     </button>
                 </div>
            </div>

            {/* Promo Card (No Background Image) */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-[32px] p-8 text-center text-white relative overflow-hidden shadow-xl shadow-purple-600/20">
                {/* Decorative Pattern instead of Image */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                   <div className="absolute top-4 left-4 w-12 h-12 rounded-full border-4 border-white"></div>
                   <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full border-8 border-white"></div>
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-[12px] border-white/20"></div>
                </div>
                
                <div className="relative z-10">
                    <div className="flex justify-center mb-3 text-yellow-300 gap-1 text-lg">
                        {[1,2,3,4,5].map(s => <span key={s}>★</span>)}
                    </div>
                    <h3 className="text-2xl font-bold mb-3 font-serif">Got a Recipe That Rocks?</h3>
                    <p className="text-purple-100 text-sm mb-6 leading-relaxed">Share It & Shine! Your recipe might just become the next big hit!</p>
                    
                    <button className="bg-white text-purple-600 px-8 py-3 rounded-full text-sm font-bold transition-transform hover:scale-105 shadow-md">
                        + Add Recipe
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
