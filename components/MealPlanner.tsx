
import React, { useState, useEffect, useRef } from 'react';
import { Meal, CookingGuide, MapPlace } from '../types';
import { MapPin, ChefHat, ExternalLink, RefreshCw, ArrowLeft, Play, Volume2, CheckCircle2, Sunrise, Sun, Moon, Coffee, Flame, ArrowRight, Utensils, Heart, MoreHorizontal, Clock, MessageCircle, Wheat, Droplets, ChevronDown, Check, Info, Plus, Sparkles, Minus, Users, ShoppingBag, Star, Navigation as NavIcon, X } from 'lucide-react';
import { generatePlan, getCookingGuide, enrichMealIngredients, findRestaurant } from '../services/geminiService';
import { UserProfile } from '../types';
import { getEmojiForKeyword } from '../constants';

interface Props {
  meals: Meal[];
  user: UserProfile;
  setMeals: (meals: Meal[]) => void;
}

const MealPlanner: React.FC<Props> = ({ meals, user, setMeals }) => {
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [cookingGuide, setCookingGuide] = useState<CookingGuide | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'cooking'>('overview');
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0); // Track active step within section
  const [servings, setServings] = useState(1);
  const [enriching, setEnriching] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  
  // Restaurant Logic
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [restaurants, setRestaurants] = useState<MapPlace[]>([]);
  const [showRestaurants, setShowRestaurants] = useState(false);

  const [regenerating, setRegenerating] = useState(false);
  
  // Mock Comments
  const MOCK_COMMENTS = [
    { id: 1, user: '@homechef87', emoji: '👨‍🍳', text: 'This was so quick to make! Perfect for busy weeknights. 🍤✨', date: 'Aug 25, 2024', likes: 64 },
    { id: 2, user: '@crustyBreadFan', emoji: '🥖', text: 'Absolutely delicious! The dish turned out perfectly tender. Definitely making this again!', date: 'Aug 25, 2024', likes: 156 },
    { id: 3, user: '@veggielife', emoji: '🥗', text: 'Love the colorful veggies! It’s a feast for the eyes and the stomach! 🌈', date: 'Aug 17, 2024', likes: 12 },
    { id: 4, user: '@foodlover123', emoji: '😋', text: 'I added some spice, and it took this dish to the next level! So good! 🔥', date: '3 hours ago', likes: 211 },
  ];
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [newComment, setNewComment] = useState('');

  // Reset state when meal changes
  useEffect(() => {
      setCheckedIngredients(new Set());
      setRestaurants([]);
      setShowRestaurants(false);
      setActiveStepIndex(0);
      setActiveSectionIndex(0);
  }, [selectedMeal]);

  // Automatically enrich ingredients if they don't have detailed amounts
  useEffect(() => {
    const fetchDetails = async () => {
        if (selectedMeal && !selectedMeal.detailedIngredients && !enriching) {
            setEnriching(true);
            try {
                const detailed = await enrichMealIngredients(selectedMeal.name, selectedMeal.ingredients);
                const updatedMeal = { ...selectedMeal, detailedIngredients: detailed };
                setSelectedMeal(updatedMeal);
                const updatedMeals = meals.map(m => m.id === selectedMeal.id ? updatedMeal : m);
                setMeals(updatedMeals);
            } catch (e) {
                console.error("Failed to enrich", e);
            } finally {
                setEnriching(false);
            }
        }
    };
    fetchDetails();
  }, [selectedMeal]);

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'Breakfast': return <Sunrise size={16} />;
      case 'Lunch': return <Sun size={16} />;
      case 'Dinner': return <Moon size={16} />;
      case 'Snack': return <Coffee size={16} />;
      default: return <Sun size={16} />;
    }
  };

  const handleSelectMeal = async (meal: Meal) => {
    setSelectedMeal(meal);
    setViewMode('overview');
    setCookingGuide(null);
    setActiveSectionIndex(0);
    setActiveStepIndex(0);
    setServings(1);
  };

  const getScaledAmount = (amount: string, scale: number) => {
    if (scale === 1) return amount;
    const match = amount.match(/^(\d+(?:\.\d+)?|\d*\.\d+)(.*)$/);
    if (!match) return amount;

    const val = parseFloat(match[1]);
    const unit = match[2];
    
    if (isNaN(val)) return amount;
    
    const scaled = val * scale;
    const formatted = Number.isInteger(scaled) ? scaled.toString() : scaled.toFixed(1);
    
    return `${formatted}${unit}`;
  };

  const handleServingsChange = (delta: number) => {
    setServings(prev => Math.max(1, Math.min(20, prev + delta)));
  };

  const toggleIngredient = (name: string) => {
    const newSet = new Set(checkedIngredients);
    if (newSet.has(name)) {
        newSet.delete(name);
    } else {
        newSet.add(name);
    }
    setCheckedIngredients(newSet);
  };

  const startCooking = async () => {
    if (!selectedMeal) return;
    setViewMode('cooking');
    setActiveStepIndex(0);
    
    if (servings === 1 && selectedMeal.steps && selectedMeal.steps.length > 0) {
        setCookingGuide({
            sections: [{
                name: selectedMeal.name,
                steps: selectedMeal.steps.map(s => ({ title: s.title, description: s.description })),
                ingredients: selectedMeal.ingredients
            }],
            tips: ["Prepare all ingredients before starting.", "Taste and adjust seasoning as you go."],
            audioIntro: `Let's make ${selectedMeal.name}.`
        });
        return;
    }

    if (!cookingGuide) {
        setGuideLoading(true);
        try {
            const ingredientsList = selectedMeal.detailedIngredients 
                ? selectedMeal.detailedIngredients.map(i => `${i.amount} ${i.name}`)
                : selectedMeal.ingredients;

            const guide = await getCookingGuide(selectedMeal.name, ingredientsList, servings);
            setCookingGuide(guide);
        } catch(e) {
            console.error(e);
        } finally {
            setGuideLoading(false);
        }
    }
  };

  // Step Navigation Handlers
  const handleNextStep = () => {
      if (!cookingGuide) return;
      const currentSection = cookingGuide.sections[activeSectionIndex];
      if (activeStepIndex < currentSection.steps.length - 1) {
          setActiveStepIndex(prev => prev + 1);
      } else {
          // Move to next section
          if (activeSectionIndex < cookingGuide.sections.length - 1) {
              setActiveSectionIndex(prev => prev + 1);
              setActiveStepIndex(0);
          } else {
              // Finish
              setViewMode('overview');
          }
      }
  };

  const handlePrevStep = () => {
      if (activeStepIndex > 0) {
          setActiveStepIndex(prev => prev - 1);
      } else {
          if (activeSectionIndex > 0) {
              setActiveSectionIndex(prev => prev - 1);
              // Go to last step of prev section
              const prevSection = cookingGuide?.sections[activeSectionIndex - 1];
              if (prevSection) setActiveStepIndex(prevSection.steps.length - 1);
          }
      }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: Date.now(),
      user: '@you',
      emoji: '🧑‍🍳',
      text: newComment,
      date: 'Just now',
      likes: 0
    };
    setComments([comment, ...comments]);
    setNewComment('');
  };

  const handleEatOut = () => {
      if (restaurants.length > 0) {
          setShowRestaurants(!showRestaurants);
          return;
      }
      
      setLoadingRestaurants(true);
      setShowRestaurants(true);
      
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
              if (selectedMeal) {
                  const res = await findRestaurant(selectedMeal.name, { 
                      lat: pos.coords.latitude, 
                      lng: pos.coords.longitude 
                  });
                  setRestaurants(res.places || []);
              }
              setLoadingRestaurants(false);
          }, (err) => {
              console.error(err);
              setLoadingRestaurants(false);
              alert("Could not get location. Ensure permissions are granted.");
          });
      } else {
          setLoadingRestaurants(false);
          alert("Geolocation not supported.");
      }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
        const newMeals = await generatePlan(user);
        if(newMeals.length > 0) setMeals(newMeals);
    } catch (e) {
        console.error(e);
    } finally {
        setRegenerating(false);
    }
  };

  const getBenefit = (m: Meal) => {
    if (m.protein > 30) return "Muscle Repair & Growth";
    if (m.calories < 400) return "Light & Lean Option";
    if ((m.carbs || 0) < 20) return "Low Carb • Keto Friendly";
    return "Balanced Energy Boost";
  };

  // --- Detailed View ---
  if (selectedMeal) {
    const author = selectedMeal.author || { name: 'Goalify Chef', handle: '@goalify', emoji: '👨‍🍳' };
    const prepTime = selectedMeal.prepTime || '45min';
    const difficulty = selectedMeal.difficulty || 'Medium';
    
    const proteinCals = selectedMeal.protein * 4;
    const remainingCals = Math.max(0, selectedMeal.calories - proteinCals);
    const estCarbs = Math.round((remainingCals * 0.5) / 4);
    const estFats = Math.round((remainingCals * 0.5) / 9);
    
    const carbs = selectedMeal.carbs || estCarbs;
    const fats = selectedMeal.fat || estFats;
    
    const activeSection = cookingGuide?.sections[activeSectionIndex];
    
    const rawIngredients = selectedMeal.detailedIngredients || selectedMeal.ingredients.map(i => ({ name: i, amount: 'As needed', emoji: getEmojiForKeyword(i) }));
    const sortedIngredients = [...rawIngredients].sort((a, b) => a.name.localeCompare(b.name));

    // Nav Logic Vars
    const isLastStepOfSection = activeSection && activeStepIndex === activeSection.steps.length - 1;
    const isLastSection = cookingGuide && activeSectionIndex === cookingGuide.sections.length - 1;
    const isFinished = isLastStepOfSection && isLastSection;

    return (
      <div className="p-4 md:p-8 pb-32 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3 mb-8 text-sm">
            <button 
                onClick={() => {
                  if (viewMode === 'cooking') setViewMode('overview');
                  else setSelectedMeal(null);
                }}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors font-bold"
            >
                <ArrowLeft size={16} /> Back
            </button>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-900 truncate max-w-md">{selectedMeal.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
                {viewMode === 'overview' && (
                  <div className="bg-white rounded-[40px] overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col lg:flex-row min-h-[500px] group">
                      <div className="w-full lg:w-1/2 relative min-h-[400px] bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center p-8 overflow-hidden">
                          <div className="text-[180px] drop-shadow-2xl hover:scale-110 transition-transform cursor-pointer select-none">
                              {selectedMeal.emoji || getEmojiForKeyword(selectedMeal.name)}
                          </div>
                          <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                              <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1.5">
                                  {getMealIcon(selectedMeal.type)} {selectedMeal.type}
                              </div>
                          </div>
                          <div className="absolute bottom-6 left-6 right-6">
                              <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[24px] shadow-lg border border-white/50">
                                  <div className="flex items-center justify-between mb-4">
                                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                                          <Sparkles size={14} className="text-purple-500" /> Key Ingredients
                                      </h4>
                                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{sortedIngredients.length} Items</span>
                                  </div>
                                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                      {sortedIngredients.slice(0, 5).map((ing, i) => (
                                          <div key={i} className="flex flex-col items-center justify-center w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100">
                                              <span className="text-2xl">{ing.emoji || getEmojiForKeyword(ing.name)}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col bg-white">
                          <div className="flex justify-between items-start mb-6">
                              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight font-serif flex-1 pr-6">
                                  {selectedMeal.name}
                              </h1>
                              <div className="flex gap-2 shrink-0">
                                  <button className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Heart size={18} /></button>
                              </div>
                          </div>

                          <div className="flex flex-wrap gap-3 mb-8">
                              <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1.5"><Flame size={12} className="text-orange-500"/> {selectedMeal.calories}kcal</span>
                              <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1.5"><Clock size={12} className="text-blue-500"/> {prepTime}</span>
                              <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1.5"><ChefHat size={12} className="text-purple-500"/> {difficulty}</span>
                          </div>

                          <div className="flex items-center gap-3 mb-8 pb-8 border-b border-slate-100">
                             <div className="relative w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl border border-slate-200">
                                {author.emoji}
                             </div>
                             <div className="flex-1">
                                 <p className="text-sm font-bold text-slate-900">{author.name}</p>
                                 <p className="text-xs text-slate-500">{author.handle}</p>
                             </div>
                          </div>

                          <div className="mb-8 flex-1">
                              <p className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">Description</p>
                              <p className="text-sm text-slate-500 leading-relaxed line-clamp-4">
                                  {selectedMeal.description}
                              </p>
                          </div>

                          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                              <div className="flex flex-col gap-1">
                                  <span className="text-2xl font-extrabold text-slate-900">{carbs}g</span>
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Carbs</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                  <span className="text-2xl font-extrabold text-slate-900">{selectedMeal.protein}g</span>
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Protein</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                  <span className="text-2xl font-extrabold text-slate-900">{fats}g</span>
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fats</span>
                              </div>
                          </div>
                      </div>
                  </div>
                )}
                
                {viewMode === 'cooking' && (
                  <div className="max-w-4xl mx-auto">
                      {guideLoading ? (
                           <div className="bg-white rounded-[32px] p-12 text-center shadow-sm min-h-[400px] flex flex-col items-center justify-center border border-slate-100">
                              <RefreshCw className="w-12 h-12 text-purple-600 animate-spin mb-6" />
                              <h3 className="text-xl font-bold text-slate-900 mb-2">Calculating for {servings} people...</h3>
                              <p className="text-slate-500 font-medium">AI is scaling ingredients & preparing your guide.</p>
                          </div>
                      ) : activeSection ? (
                          <div className="flex flex-col md:flex-row gap-8">
                             {/* Side/Top Navigation for Sections */}
                             <div className="w-full md:w-64 flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                                {cookingGuide?.sections.map((section, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => { setActiveSectionIndex(idx); setActiveStepIndex(0); }}
                                        className={`p-4 rounded-2xl text-left transition-all border flex items-center justify-between group min-w-[160px] md:min-w-0 flex-shrink-0 ${activeSectionIndex === idx ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.02]' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50 hover:border-slate-200'}`}
                                    >
                                        <div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 opacity-70`}>Part {idx + 1}</span>
                                            <span className="font-bold text-sm line-clamp-1">{section.name}</span>
                                        </div>
                                        {activeSectionIndex === idx && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
                                    </button>
                                ))}
                             </div>

                             {/* Main Card */}
                             <div className="flex-1">
                                <div className="bg-slate-950 rounded-[40px] p-6 md:p-12 text-white relative min-h-[600px] flex flex-col shadow-2xl shadow-slate-900/30 overflow-hidden border-4 border-slate-900">
                                    {/* Ambient Background */}
                                    <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
                                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/20 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>

                                    {/* Card Header */}
                                    <div className="flex justify-between items-center mb-8 relative z-10">
                                        <span className="bg-slate-800/80 backdrop-blur border border-slate-700/50 px-4 py-1.5 rounded-full text-xs font-bold text-slate-300 tracking-wide shadow-sm">
                                            Step {activeStepIndex + 1} of {activeSection.steps.length}
                                        </span>
                                        <button onClick={() => setViewMode('overview')} className="w-10 h-10 rounded-full bg-slate-800/80 backdrop-blur flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Content Area - Scrollable */}
                                    <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar pr-2 mb-8">
                                        <h2 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight tracking-tight text-white">
                                            {activeSection.steps[activeStepIndex].title}
                                        </h2>
                                        
                                        <div className="prose prose-invert prose-lg max-w-none">
                                            <p className="text-slate-300 text-lg md:text-xl leading-relaxed font-medium">
                                                {activeSection.steps[activeStepIndex].description}
                                            </p>
                                        </div>

                                        {/* Tips Component if exists */}
                                        {cookingGuide?.tips && cookingGuide.tips.length > 0 && (activeStepIndex === 0 || activeStepIndex % 3 === 0) && (
                                            <div className="mt-8 bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl flex gap-4 items-start animate-in fade-in slide-in-from-bottom-2">
                                                <Info className="text-blue-400 shrink-0 mt-0.5" size={20} />
                                                <div>
                                                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1">Chef's Tip</span>
                                                    <p className="text-sm text-blue-100 font-medium leading-relaxed">
                                                        {cookingGuide.tips[activeStepIndex % cookingGuide.tips.length]}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer / Controls */}
                                    <div className="pt-6 border-t border-white/10 flex justify-between items-center relative z-10 gap-4">
                                        <button 
                                            onClick={handlePrevStep}
                                            disabled={activeStepIndex === 0 && activeSectionIndex === 0}
                                            className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors shadow-lg"
                                        >
                                            <ArrowLeft size={24} />
                                        </button>

                                        {/* Step Dots */}
                                        <div className="hidden sm:flex gap-1.5">
                                            {activeSection.steps.map((_, i) => (
                                                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeStepIndex ? 'w-8 bg-white' : 'w-1.5 bg-slate-700'}`}></div>
                                            ))}
                                        </div>

                                        <button 
                                            onClick={handleNextStep}
                                            className={`h-14 px-8 rounded-full font-bold flex items-center gap-3 transition-all shadow-xl active:scale-95 ${isFinished ? 'bg-green-500 text-slate-950 hover:bg-green-400' : 'bg-white text-slate-900 hover:bg-slate-200'}`}
                                        >
                                            {isFinished ? (
                                                <>Finish <CheckCircle2 size={20} /></>
                                            ) : isLastStepOfSection ? (
                                                <>Next Part <ArrowRight size={20} /></>
                                            ) : (
                                                <>Next <ArrowRight size={20} /></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                             </div>
                          </div>
                      ) : (
                          <div className="text-center py-12 text-slate-500">Could not load recipe steps.</div>
                      )}
                  </div>
                )}

                {viewMode === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 border-l-4 border-l-blue-400 relative overflow-hidden">
                             <div className="absolute inset-0 border-2 border-dashed border-blue-100 rounded-[30px] pointer-events-none m-1"></div>
                             <div className="flex justify-between items-center mb-6 relative z-10">
                                 <h3 className="font-bold text-slate-900 flex items-center gap-3 text-lg">
                                    <div className="p-2 bg-green-50 rounded-xl text-green-600"><Wheat size={20}/></div>
                                    Ingredients Required
                                 </h3>
                                 {enriching && (
                                     <div className="flex items-center gap-2 text-xs text-blue-500 font-bold bg-blue-50 px-2 py-1 rounded-full">
                                         <Sparkles size={12} className="animate-spin" /> Calculating...
                                     </div>
                                 )}
                             </div>
                             <div className="space-y-3 relative z-10">
                                {sortedIngredients.map((ing, i) => {
                                    const isChecked = checkedIngredients.has(ing.name);
                                    return (
                                        <div 
                                            key={i} 
                                            onClick={() => toggleIngredient(ing.name)}
                                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group ${isChecked ? 'bg-green-50 border-green-200' : 'bg-white border-transparent hover:bg-slate-50'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isChecked ? 'bg-green-500 border-green-500' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
                                                    {isChecked && <Check size={14} className="text-white" />}
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-2xl flex-shrink-0 border border-slate-100">
                                                    {ing.emoji || getEmojiForKeyword(ing.name)}
                                                </div>
                                                <span className={`text-sm font-bold transition-colors ${isChecked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                    {ing.name}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${enriching ? 'text-slate-300 bg-slate-50' : isChecked ? 'text-green-600 bg-green-100' : 'text-slate-600 bg-slate-100'}`}>
                                                    {enriching ? '...' : getScaledAmount(ing.amount, servings)}
                                                </span>
                                                <a 
                                                    href={`https://www.amazon.com/s?k=${encodeURIComponent(ing.name)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()} 
                                                    className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-yellow-400 hover:text-slate-900 transition-colors shadow-sm border border-slate-200"
                                                    title="Buy on Amazon"
                                                >
                                                    <ShoppingBag size={14} />
                                                </a>
                                            </div>
                                        </div>
                                    )
                                })}
                             </div>
                        </div>

                        <div className="flex flex-col gap-6">
                             <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex-1">
                                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-3 text-lg">
                                    <div className="p-2 bg-orange-50 rounded-xl text-orange-600"><ChefHat size={20}/></div>
                                    Preparation Info
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm">
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Time</span>
                                            <p className="text-lg font-extrabold text-slate-900">{prepTime}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-purple-500 shadow-sm">
                                            <Flame size={24} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Difficulty</span>
                                            <p className="text-lg font-extrabold text-slate-900">{difficulty}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm">
                                                <Users size={24} />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Servings</span>
                                                <p className="text-lg font-extrabold text-slate-900">{servings} {servings === 1 ? 'Person' : 'People'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-sm border border-slate-200">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleServingsChange(-1); }}
                                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors active:scale-95"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-6 text-center text-sm font-bold text-slate-900">{servings}</span>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleServingsChange(1); }}
                                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors active:scale-95"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-6 space-y-3">
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={startCooking}
                                            className="flex-1 bg-[#0F172A] hover:bg-slate-900 text-white rounded-xl font-bold py-4 shadow-xl shadow-slate-900/10 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                                        >
                                            <ChefHat size={20} /> 
                                            Cook for {servings}
                                        </button>
                                        <button 
                                            onClick={handleEatOut}
                                            className="w-[80px] bg-white border border-slate-200 text-slate-800 rounded-xl font-bold text-[10px] hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95"
                                        >
                                            {loadingRestaurants ? <RefreshCw size={18} className="animate-spin text-blue-500"/> : <MapPin size={18} className="text-red-500" />}
                                            Eat Out
                                        </button>
                                    </div>

                                    {/* Restaurants Result Card */}
                                    {showRestaurants && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 animate-in slide-in-from-top duration-300">
                                            <h4 className="font-bold text-slate-900 text-xs uppercase mb-3 flex items-center gap-2">
                                                <NavIcon size={12} className="text-blue-500"/> Nearby Spots
                                            </h4>
                                            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                                {restaurants.length > 0 ? restaurants.map((place, idx) => (
                                                    <a 
                                                        key={idx}
                                                        href={place.uri}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all group"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-800">{place.title}</span>
                                                            <span className="text-[10px] text-slate-400">{place.address || "View on map"}</span>
                                                        </div>
                                                        <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-500" />
                                                    </a>
                                                )) : (
                                                    <div className="text-center text-xs text-slate-400 py-2">
                                                        {loadingRestaurants ? "Searching..." : "No places found nearby."}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                             </div>
                        </div>
                    </div>
                )}
                
                {/* --- Comments Section (Moved to Bottom for Mobile Priority) --- */}
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-white">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                <MessageCircle size={20} className="text-slate-400" /> Community Comments
                            </h3>
                            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{comments.length}</span>
                        </div>
                    </div>
                    <div className="p-6 space-y-6 max-h-[400px] overflow-y-auto">
                        {comments.map((comment) => (
                            <div key={comment.id} className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl border border-slate-200 flex-shrink-0 shadow-sm">
                                    {comment.emoji}
                                </div>
                                <div className="flex-1 bg-slate-50 p-4 rounded-2xl rounded-tl-none">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-sm text-slate-900">{comment.user}</span>
                                        <span className="text-[10px] font-bold text-slate-400">{comment.date}</span>
                                    </div>
                                    <p className="text-slate-700 text-sm leading-relaxed font-medium">{comment.text}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                         <button className="text-[10px] font-bold text-slate-400 flex items-center gap-1 hover:text-red-500 transition-colors">
                                             <Heart size={10} /> {comment.likes}
                                         </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-slate-50 bg-slate-50/50">
                        <div className="bg-white border border-slate-200 rounded-full px-2 py-2 flex items-center gap-2 shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm border border-slate-200">
                                🧑‍🍳
                            </div>
                            <input 
                                type="text" 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                placeholder="Add a comment..."
                                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
                            />
                            <button 
                                onClick={handleAddComment}
                                className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                            >
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column Spacer for Desktop Layout Alignment if needed, currently main comments are moved to main column */}
             <div className="hidden lg:block lg:col-span-4">
                 {/*  
                    We moved the comments to the main column to satisfy "At the end of each meal".
                    This column can be used for "Related Meals" or "Chef Profile" in future.
                    For now, we can render a "Chef's Note" or similar to fill space.
                 */}
                 <div className="sticky top-8 space-y-6">
                    <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-[32px] p-8 text-white text-center shadow-lg shadow-orange-500/20">
                         <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border border-white/20">
                            👨‍🍳
                         </div>
                         <h3 className="font-bold text-xl mb-2">Chef's Tip</h3>
                         <p className="text-sm font-medium text-orange-50 leading-relaxed mb-6">
                             "For extra flavor, try roasting your spices before adding them to the dish!"
                         </p>
                         <button className="bg-white text-orange-500 text-xs font-bold px-4 py-2 rounded-full shadow-sm hover:scale-105 transition-transform">
                             View More Tips
                         </button>
                    </div>

                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Star size={16} className="text-yellow-400" fill="currentColor"/> Popular with this
                        </h4>
                        <div className="space-y-4">
                            {meals.filter(m => m.id !== selectedMeal.id).slice(0, 3).map(m => (
                                <div key={m.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors" onClick={() => setSelectedMeal(m)}>
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl border border-slate-100">
                                        {m.emoji}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{m.name}</p>
                                        <p className="text-[10px] text-slate-400">{m.calories} kcal</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="p-6 md:p-8 pb-32 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Weekly Meal Plan</h1>
                <p className="text-slate-500 font-medium mt-1">AI-Curated for {user.name}</p>
            </div>
            <button 
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
            >
                <RefreshCw size={18} className={regenerating ? 'animate-spin' : ''} />
                {regenerating ? 'Designing...' : 'Regenerate Plan'}
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {meals && meals.map((meal) => (
                <div 
                    key={meal.id}
                    onClick={() => handleSelectMeal(meal)}
                    className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 cursor-pointer group hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden"
                >
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-slate-100 rounded-bl-[100px] -mr-8 -mt-8 z-0"></div>

                    {/* Header: Icon + Type Tag */}
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 flex items-center justify-center text-4xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                            {meal.emoji || getEmojiForKeyword(meal.name)}
                        </div>
                        <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
                            {getMealIcon(meal.type)} {meal.type}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col relative z-10">
                        <h3 className="font-extrabold text-slate-900 text-xl leading-tight mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
                            {meal.name}
                        </h3>
                        
                        {/* Benefits / Description Snippet */}
                        <div className="mb-4">
                            <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider block mb-1">Why this meal?</span>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-2">
                                {getBenefit(meal)}
                            </p>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Energy</span>
                                <span className="flex items-center gap-1 text-sm font-bold text-slate-900"><Flame size={14} className="text-orange-500" /> {meal.calories}</span>
                            </div>
                            <div className="w-px h-6 bg-slate-100"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Protein</span>
                                <span className="flex items-center gap-1 text-sm font-bold text-slate-900"><Droplets size={14} className="text-blue-500" /> {meal.protein}g</span>
                            </div>
                            <div className="w-px h-6 bg-slate-100"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Time</span>
                                <span className="flex items-center gap-1 text-sm font-bold text-slate-900"><Clock size={14} className="text-purple-500" /> {meal.prepTime || '20m'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            
            <div className="bg-slate-50 rounded-[32px] p-4 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center gap-4 group cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-all min-h-[300px]">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-300 group-hover:text-purple-500 group-hover:scale-110 transition-all">
                    <Plus size={32} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">Add Custom</h3>
                    <p className="text-xs text-slate-400 font-medium">Build your own meal</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default MealPlanner;
