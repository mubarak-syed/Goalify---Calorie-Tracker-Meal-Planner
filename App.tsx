
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import MealPlanner from './components/MealPlanner';
import CheatCode from './components/CheatCode';
import MindBody from './components/MindBody';
import LiveCoach from './components/LiveCoach';
import Profile from './components/Profile';
import { UserProfile, Meal, WorkoutLog } from './types';
import { generatePlan, rebalanceDay, generateWorkoutPlan } from './services/geminiService';
import { INITIAL_MEALS } from './constants';
import { Sparkles, Activity, Utensils, Brain, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState('dashboard');
  
  // State for multiple day plans: 0 = Today, 1 = Tomorrow, etc.
  const [mealPlans, setMealPlans] = useState<Record<number, Meal[]>>({
      0: INITIAL_MEALS
  });
  const [dayOffset, setDayOffset] = useState(0);

  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [liveOpen, setLiveOpen] = useState(false);
  
  // Loading State for AI Generation (Background)
  const [isGenerating, setIsGenerating] = useState(false);

  // Initial plan generation on onboarding complete
  const handleOnboardingComplete = async (profile: UserProfile) => {
    // 1. Immediately show Dashboard
    setUser(profile);
    setTab('dashboard');
    setIsGenerating(true);
    
    try {
        // A. Generate TODAY (Nutritionist Agent)
        const todayMeals = await generatePlan(profile, "Today");
        if (todayMeals && todayMeals.length > 0) {
            setMealPlans(prev => ({ ...prev, 0: todayMeals }));
        }

        // B. Generate TOMORROW in Background (Next Day Agent)
        // We don't block the UI here, just let it run
        generatePlan(profile, "Tomorrow (ensure variety)").then(tomorrowMeals => {
            if (tomorrowMeals && tomorrowMeals.length > 0) {
                setMealPlans(prev => ({ ...prev, 1: tomorrowMeals }));
            }
        });

    } catch (error) {
        console.error("Failed to generate plan", error);
    } finally {
        setIsGenerating(false);
    }
  };

  const updateBudget = (cals: number) => {
    setCaloriesConsumed(prev => prev + cals);
  };
  
  const getNextMeal = (): Meal | undefined => {
      // Simplistic next meal finder
      const currentMeals = mealPlans[dayOffset] || [];
      const now = new Date();
      const h = now.getHours();
      if (h < 10) return currentMeals.find(m => m.type === 'Breakfast');
      if (h < 14) return currentMeals.find(m => m.type === 'Lunch');
      if (h < 17) return currentMeals.find(m => m.type === 'Snack');
      return currentMeals.find(m => m.type === 'Dinner');
  };

  const handleDayChange = async (offset: number) => {
      setDayOffset(offset);
      
      // If we don't have a plan for this day yet, try to generate it
      if (!mealPlans[offset] && user) {
          setIsGenerating(true);
          try {
              const dayLabel = offset === 1 ? "Tomorrow" : `Day +${offset}`;
              const meals = await generatePlan(user, dayLabel);
              if (meals.length > 0) {
                  setMealPlans(prev => ({ ...prev, [offset]: meals }));
              }
          } catch (e) {
              console.error(e);
          } finally {
              setIsGenerating(false);
          }
      }
  };

  // --- THE SMART RE-BALANCER ---
  const handleSmartAdjustment = async (analysisResult: { foodName: string, calories: number, protein: number, carbs: number, fat: number, reasoning: string }) => {
    if (!user) return;

    // 1. Determine which meal slot this is based on Time of Day
    const hour = new Date().getHours();
    let currentMealType = 'Snack'; // Default
    if (hour < 11) currentMealType = 'Breakfast';
    else if (hour < 15) currentMealType = 'Lunch';
    else if (hour < 21) currentMealType = 'Dinner';

    const currentDayMeals = mealPlans[0]; // Assuming adjustments happen on 'Today'

    // 2. IMMEDIATELY update the state (Optimistic UI)
    const updatedMeals = currentDayMeals.map(m => {
        if (m.type === currentMealType) {
            return {
                ...m,
                name: analysisResult.foodName,
                calories: analysisResult.calories,
                protein: analysisResult.protein,
                carbs: analysisResult.carbs,
                fat: analysisResult.fat,
                description: `Logged via AI Vision: ${analysisResult.reasoning}. This meal replaced your scheduled ${m.name}.`,
                ingredients: [analysisResult.foodName], // Simple overwrite
                emoji: '📸'
            };
        }
        return m;
    });

    setMealPlans(prev => ({ ...prev, 0: updatedMeals }));
    
    // 3. Calculate New Remaining Budget
    const currentTotal = caloriesConsumed + analysisResult.calories; 
    const newRemaining = user.dailyCalories - currentTotal;
    
    // 4. Identify FUTURE meals that need re-balancing
    const mealOrder = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
    const currentIndex = mealOrder.indexOf(currentMealType);
    
    const futureMealsToAdjust = updatedMeals.filter(m => {
        const mIndex = mealOrder.indexOf(m.type);
        return mIndex > currentIndex;
    });

    if (futureMealsToAdjust.length === 0) return; // End of day, no replanning needed

    // 5. Trigger Background Orchestrator
    setIsGenerating(true);
    try {
        console.log(`Orchestrator: Rebalancing ${futureMealsToAdjust.length} future meals for remaining budget: ${newRemaining}`);
        
        const adjustedFutureMeals = await rebalanceDay(
            user, 
            analysisResult.foodName, 
            analysisResult.calories, 
            newRemaining, 
            futureMealsToAdjust
        );

        // 6. Merge Adjusted Future Meals back into main state
        setMealPlans(prev => {
            const current = prev[0];
            const rebalanced = current.map(m => {
                const adjusted = adjustedFutureMeals.find(am => am.type === m.type);
                return adjusted ? adjusted : m;
            });
            return { ...prev, 0: rebalanced };
        });
        
    } catch (e) {
        console.error("Rebalance failed", e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleLogWorkout = (log: WorkoutLog) => {
    setWorkoutLogs(prev => [...prev, log]);
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
  };

  if (!user) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Get current active meals for the selected day offset
  const activeMeals = mealPlans[dayOffset] || [];

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900 font-sans selection:bg-purple-500/30">
      <div className="w-full min-h-screen relative md:pl-24">
        
        {/* Render Tab Content */}
        <div className={`animate-in fade-in duration-300 mx-auto ${tab === 'dashboard' || tab === 'meals' || tab === 'mind' ? 'max-w-[1600px]' : 'max-w-5xl'}`}>
          {tab === 'dashboard' && (
            <Dashboard 
                user={user} 
                plan={{ meals: activeMeals, totalCaloriesConsumed: caloriesConsumed, remainingCalories: user.dailyCalories - caloriesConsumed }} 
                workoutLogs={workoutLogs}
                isGenerating={isGenerating}
                dayOffset={dayOffset}
                onDayChange={handleDayChange}
                onNavigate={setTab}
            />
          )}
          {tab === 'meals' && (
            <MealPlanner 
                meals={activeMeals} 
                user={user} 
                setMeals={(newMeals) => setMealPlans(prev => ({ ...prev, [dayOffset]: newMeals }))} 
            />
          )}
          {tab === 'cheat' && (
            <CheatCode 
                remainingBudget={user.dailyCalories - caloriesConsumed} 
                updateBudget={updateBudget}
                updateNextMeal={(suggestion) => {}}
                onSmartLog={handleSmartAdjustment}
                nextMeal={getNextMeal()}
                onClose={() => setTab('dashboard')}
            />
          )}
          {tab === 'mind' && <MindBody user={user} onLogExercise={handleLogWorkout} logs={workoutLogs} />}
          {tab === 'profile' && (
            <Profile 
                user={user} 
                onUpdate={handleProfileUpdate} 
                onReset={() => setUser(null)} 
            />
          )}
        </div>

        {/* Hide Navigation when in Cheat/Camera mode for full screen immersion */}
        {tab !== 'cheat' && (
            <Navigation currentTab={tab} setTab={setTab} openLive={() => setLiveOpen(true)} />
        )}
        
        <LiveCoach isOpen={liveOpen} onClose={() => setLiveOpen(false)} />
      </div>
    </div>
  );
};

export default App;
