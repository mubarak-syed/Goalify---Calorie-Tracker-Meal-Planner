
import React, { useState } from 'react';
import { UserProfile, Gender, Goal, ActivityLevel, CookingSkill } from '../types';
import { calculateMacros } from '../constants';
import { reverseGeocode } from '../services/geminiService';
import { MapPin, Loader2, Navigation, CheckCircle2, Globe2, Activity, Moon, Utensils, AlertCircle } from 'lucide-react';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [locating, setLocating] = useState(false);
  const [data, setData] = useState<Partial<UserProfile>>({
    gender: Gender.MALE,
    goal: Goal.CUT,
    location: '',
    activityLevel: ActivityLevel.SEDENTARY,
    cookingSkill: CookingSkill.INTERMEDIATE,
    stressLevel: 'Medium',
    sleepHours: 7,
    dietaryRestrictions: [],
    preferredCuisines: [],
    comfortFoods: ''
  });

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
    else {
      // Calculate final stats
      const profile = data as UserProfile;
      const macros = calculateMacros(profile);
      const finalProfile = { ...profile, dailyCalories: macros.calories, dailyProtein: macros.protein };
      onComplete(finalProfile);
    }
  };

  const handleDetectLocation = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const city = await reverseGeocode(position.coords.latitude, position.coords.longitude);
        setData(prev => ({ ...prev, location: city }));
        setLocating(false);
      }, (err) => {
        console.error(err);
        alert("Location permission denied. Please enter manually.");
        setLocating(false);
      });
    } else {
      alert("Geolocation is not supported by this browser.");
      setLocating(false);
    }
  };

  const toggleSelection = (field: 'dietaryRestrictions' | 'preferredCuisines', value: string) => {
      const current = data[field] || [];
      const updated = current.includes(value) 
        ? current.filter(i => i !== value)
        : [...current, value];
      setData({ ...data, [field]: updated });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-500 rounded-xl mx-auto mb-4 flex items-center justify-center text-slate-900 font-bold text-xl shadow-lg shadow-green-500/20">G</div>
          <h1 className="text-3xl font-bold text-white">
            Goalify Setup
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Step {step} of 6 • {
            step === 1 ? "Basics" : 
            step === 2 ? "Body Comp" : 
            step === 3 ? "Metabolic Factors" :
            step === 4 ? "Location & Context" :
            step === 5 ? "Kitchen Profile" : "Preferences"
          }</p>
          <div className="w-full bg-slate-800 h-1 mt-4 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${(step/6)*100}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800/50">
          
          {/* STEP 1: BASICS */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-white">Personal Details</h2>
              <div className="space-y-4">
                <div>
                    <label className="text-xs text-slate-400 font-bold uppercase ml-1">Full Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Alex Doe"
                        value={data.name || ''}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 mt-1 focus:border-green-500 outline-none transition-colors"
                        onChange={(e) => setData({...data, name: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-400 font-bold uppercase ml-1">Age</label>
                        <input
                        type="number"
                        placeholder="Years"
                        value={data.age || ''}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 mt-1 focus:border-green-500 outline-none transition-colors"
                        onChange={(e) => setData({...data, age: parseInt(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-bold uppercase ml-1">Biological Sex</label>
                        <select
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 mt-1 focus:border-green-500 outline-none transition-colors"
                        value={data.gender}
                        onChange={(e) => setData({...data, gender: e.target.value as Gender})}
                        >
                        <option value={Gender.MALE}>Male</option>
                        <option value={Gender.FEMALE}>Female</option>
                        <option value={Gender.OTHER}>Other</option>
                        </select>
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BODY COMPOSITION */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-white">Body Metrics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-slate-400 font-bold uppercase ml-1">Height (cm)</label>
                    <input
                    type="number"
                    placeholder="cm"
                    value={data.height || ''}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 mt-1 focus:border-green-500 outline-none"
                    onChange={(e) => setData({...data, height: parseInt(e.target.value)})}
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 font-bold uppercase ml-1">Weight (kg)</label>
                    <input
                    type="number"
                    placeholder="kg"
                    value={data.weight || ''}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 mt-1 focus:border-green-500 outline-none"
                    onChange={(e) => setData({...data, weight: parseInt(e.target.value)})}
                    />
                </div>
              </div>
              
              <div>
                  <label className="text-xs text-slate-400 font-bold uppercase ml-1 block mb-2">Primary Objective</label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.values(Goal).map((g) => (
                    <button
                        key={g}
                        onClick={() => setData({...data, goal: g})}
                        className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between transition-all ${
                        data.goal === g 
                            ? 'bg-green-500/10 border-green-500 text-green-400' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                        }`}
                    >
                        <span>{g}</span>
                        {data.goal === g && <CheckCircle2 size={16} />}
                    </button>
                    ))}
                  </div>
              </div>
            </div>
          )}

          {/* STEP 3: METABOLIC FACTORS */}
          {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Activity size={20} className="text-blue-400"/> Metabolic Factors
                  </h2>
                  
                  <div>
                      <label className="text-xs text-slate-400 font-bold uppercase ml-1 block mb-2">Daily Activity Level</label>
                      <select
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 focus:border-green-500 outline-none"
                        value={data.activityLevel}
                        onChange={(e) => setData({...data, activityLevel: e.target.value as ActivityLevel})}
                      >
                          {Object.values(ActivityLevel).map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs text-slate-400 font-bold uppercase ml-1 block mb-2"><Moon size={12} className="inline mr-1"/> Avg Sleep</label>
                          <input
                            type="number"
                            value={data.sleepHours}
                            onChange={(e) => setData({...data, sleepHours: parseInt(e.target.value)})}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 focus:border-green-500 outline-none"
                           />
                      </div>
                      <div>
                          <label className="text-xs text-slate-400 font-bold uppercase ml-1 block mb-2"><AlertCircle size={12} className="inline mr-1"/> Stress</label>
                          <select
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 focus:border-green-500 outline-none"
                            value={data.stressLevel}
                            onChange={(e) => setData({...data, stressLevel: e.target.value as any})}
                          >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                          </select>
                      </div>
                  </div>
              </div>
          )}

          {/* STEP 4: LOCATION & CONTEXT */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Globe2 size={20} className="text-purple-400"/> Location & Availability
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                 The AI will prioritize ingredients available in your local markets to ensure sustainability.
              </p>
              
              <div className="relative">
                 <input
                  type="text"
                  placeholder="City, Region (e.g. New York, USA)"
                  value={data.location || ''}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 pl-12 focus:border-green-500 outline-none text-white shadow-inner"
                  onChange={(e) => setData({...data, location: e.target.value})}
                />
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                
                <button 
                  onClick={handleDetectLocation}
                  disabled={locating}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {locating ? <Loader2 className="animate-spin" size={14} /> : <Navigation size={14} />}
                  Auto
                </button>
              </div>

              {data.location && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-sm text-green-400 flex items-center gap-3">
                      <CheckCircle2 size={20} /> 
                      <span>Location Locked: <span className="font-bold text-white">{data.location}</span></span>
                  </div>
              )}
            </div>
          )}

          {/* STEP 5: KITCHEN PROFILE */}
          {step === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Utensils size={20} className="text-orange-400"/> Kitchen Profile
                  </h2>
                  
                  <div>
                      <label className="text-xs text-slate-400 font-bold uppercase ml-1 block mb-2">Cooking Skill Level</label>
                      <div className="grid grid-cols-1 gap-2">
                          {Object.values(CookingSkill).map(skill => (
                              <button
                                key={skill}
                                onClick={() => setData({...data, cookingSkill: skill})}
                                className={`p-4 rounded-xl text-left text-sm font-medium border transition-all ${data.cookingSkill === skill ? 'bg-orange-500/10 border-orange-500 text-orange-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                              >
                                  {skill}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div>
                      <label className="text-xs text-slate-400 font-bold uppercase ml-1 block mb-2">Preferred Cuisines</label>
                      <div className="flex flex-wrap gap-2">
                          {['Italian', 'Mexican', 'Indian', 'Asian', 'Mediterranean', 'American'].map(c => (
                              <button
                                key={c}
                                onClick={() => toggleSelection('preferredCuisines', c)}
                                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${data.preferredCuisines?.includes(c) ? 'bg-white text-slate-900 border-white' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                              >
                                  {c}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* STEP 6: PREFERENCES */}
          {step === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-white">Final Touches</h2>
              
              <div>
                  <label className="text-xs text-slate-400 font-bold uppercase ml-1 block mb-2">Dietary Restrictions</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                        {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Halal', 'Kosher'].map(r => (
                            <button
                            key={r}
                            onClick={() => toggleSelection('dietaryRestrictions', r)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${data.dietaryRestrictions?.includes(r) ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                            >
                                {r}
                            </button>
                        ))}
                  </div>
              </div>

              <div>
                 <label className="text-xs text-slate-400 font-bold uppercase ml-1 block mb-2">Comfort Foods (Don't hold back!)</label>
                 <textarea
                    placeholder="e.g. Pizza, Burgers, Ice Cream..."
                    value={data.comfortFoods || ''}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 focus:border-green-500 outline-none h-24 resize-none text-white placeholder:text-slate-600"
                    onChange={(e) => setData({...data, comfortFoods: e.target.value})}
                  />
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8 pt-6 border-t border-slate-800">
             {step > 1 && (
                 <button
                    onClick={() => setStep(step - 1)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-xl transition-colors"
                >
                    Back
                </button>
             )}
            <button
                onClick={handleNext}
                disabled={step === 4 && !data.location}
                className="flex-[2] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {step === 6 ? "Start Your Journey" : "Next Step"}
                {step < 6 && <Navigation size={16} className="rotate-90" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
