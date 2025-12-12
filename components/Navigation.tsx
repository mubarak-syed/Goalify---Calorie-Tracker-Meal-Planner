
import React, { useState } from 'react';
import { Home, Utensils, Camera, Brain, User, Mic } from 'lucide-react';

interface NavProps {
  currentTab: string;
  setTab: (tab: string) => void;
  openLive: () => void;
}

const Navigation: React.FC<NavProps> = ({ currentTab, setTab, openLive }) => {
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dash' },
    { id: 'meals', icon: Utensils, label: 'Meals' },
    { id: 'cheat', icon: Camera, label: 'AI Scan', special: true },
    { id: 'mind', icon: Brain, label: 'Mind' },
    { id: 'profile', icon: User, label: 'You' },
  ];

  return (
    <>
      {/* 
        Responsive Container:
        Mobile: Fixed Bottom, w-full, h-16
        Desktop (md): Fixed Left, w-24, h-screen
      */}
      <nav className="
        fixed z-50 
        bottom-0 left-0 w-full h-16 bg-white/90 backdrop-blur-md border-t border-gray-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]
        md:top-0 md:h-screen md:w-24 md:border-t-0 md:border-r md:flex md:flex-col md:items-center md:py-8
      ">
        <div className="
          relative flex justify-around items-center h-full max-w-md mx-auto
          md:flex-col md:h-auto md:w-full md:gap-8 md:justify-start md:max-w-none
        ">
          
          {/* Logo Placeholder for Desktop */}
          <div className="hidden md:flex w-10 h-10 bg-purple-600 rounded-xl items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/30 mb-4">
            G
          </div>

          {/* Live Coach Floating Button */}
          <button 
            onClick={openLive}
            className="
              absolute -top-6 right-4 
              md:static md:top-auto md:right-auto md:order-last md:mt-auto
              bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-full shadow-lg shadow-purple-500/30 hover:scale-105 transition-transform
            "
            title="AI Coach"
          >
            <Mic className="text-white w-6 h-6" />
          </button>

          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            
            if (item.special) {
              return (
                <button 
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`
                    flex flex-col items-center justify-center w-14 h-14 rounded-full -mt-6 border-4 border-[#f3f4f6] md:border-white
                    md:mt-0 md:w-12 md:h-12 md:rounded-2xl
                    ${isActive ? 'bg-purple-600 text-white' : 'bg-white text-slate-400 md:bg-gray-100'} 
                    shadow-lg transition-all
                  `}
                >
                  <Icon size={24} />
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`
                  flex flex-col items-center justify-center w-full h-full space-y-1 
                  md:h-auto md:w-16 md:py-3 md:rounded-2xl md:hover:bg-purple-50
                  ${isActive ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'}
                  transition-colors
                `}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navigation;
