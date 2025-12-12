import React, { useState } from 'react';
import { UserProfile, Gender, Goal } from '../types';
import { calculateMacros } from '../constants';
import { Save, X, Edit2, RotateCcw } from 'lucide-react';

interface Props {
  user: UserProfile;
  onUpdate: (updatedProfile: UserProfile) => void;
  onReset: () => void;
}

const Profile: React.FC<Props> = ({ user, onUpdate, onReset }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(user);

  const handleSave = () => {
    const macros = calculateMacros(formData);
    const updatedUser = {
      ...formData,
      dailyCalories: macros.calories,
      dailyProtein: macros.protein
    };
    onUpdate(updatedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  const handleChange = (field: keyof UserProfile, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 pb-24 md:pb-6 space-y-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Your Profile</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 bg-slate-800 rounded-lg text-green-400 hover:bg-slate-700 transition"
          >
            <Edit2 size={20} />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-green-500 outline-none"
              />
            </div>
            
            <div>
                <label className="block text-xs text-slate-400 mb-1">Location 📍</label>
                <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="City, Country"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-xs text-slate-400 mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value as Gender)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                >
                  <option value={Gender.MALE}>Male 👨</option>
                  <option value={Gender.FEMALE}>Female 👩</option>
                  <option value={Gender.OTHER}>Other 🧑</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-xs text-slate-400 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                />
              </div>
            </div>

             <div>
                <label className="block text-xs text-slate-400 mb-1">Goal</label>
                <select
                  value={formData.goal}
                  onChange={(e) => handleChange('goal', e.target.value as Goal)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                >
                  {Object.values(Goal).map(g => (
                      <option key={g} value={g}>
                          {g} {g.includes('Cut') ? '✂️' : g.includes('Bulk') ? '💪' : '⚖️'}
                      </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Comfort Foods</label>
                <textarea
                  value={formData.comfortFoods}
                  onChange={(e) => handleChange('comfortFoods', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-green-500 outline-none resize-none h-20"
                />
              </div>
          </div>

          <div className="flex gap-3 pt-4">
             <button
              onClick={handleCancel}
              className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition font-medium flex items-center justify-center gap-2"
            >
              <X size={18} /> Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-lg bg-green-500 text-slate-900 hover:bg-green-600 transition font-bold flex items-center justify-center gap-2"
            >
              <Save size={18} /> Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400">Current Weight</p>
                    <p className="text-xl font-bold text-white">{user.weight} kg</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="text-lg font-bold text-white line-clamp-1">{user.location ? `📍 ${user.location}` : 'Unknown'}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400">Age / Gender</p>
                    <p className="text-lg font-bold text-white">
                        {user.age} / {user.gender === Gender.MALE ? 'Male 👨' : user.gender === Gender.FEMALE ? 'Female 👩' : 'Other 🧑'}
                    </p>
                </div>
                 <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400">Goal</p>
                    <p className="text-sm font-bold text-green-400">
                        {user.goal} {user.goal.includes('Cut') ? '✂️' : user.goal.includes('Bulk') ? '💪' : '⚖️'}
                    </p>
                </div>
            </div>

            {/* Targets */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 rounded-xl border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Daily Targets (Auto-Calculated)</h3>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-2xl font-bold text-white">{user.dailyCalories}</p>
                        <p className="text-xs text-slate-400">Calories</p>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-700"></div>
                     <div>
                        <p className="text-2xl font-bold text-white">{user.dailyProtein}g</p>
                        <p className="text-xs text-slate-400">Protein</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Comfort Foods</h3>
                <p className="text-sm text-slate-400 italic">"{user.comfortFoods}"</p>
            </div>

            <div className="pt-8 border-t border-slate-800">
                <button 
                    onClick={onReset}
                    className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                >
                    <RotateCcw size={16} /> Reset All Data
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Profile;