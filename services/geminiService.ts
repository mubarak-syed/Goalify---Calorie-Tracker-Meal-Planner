
import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";
import { UserProfile, Meal, AIResponse, CookingGuide, IngredientDetail, WorkoutPlan, MapPlace } from "../types";
import { getEmojiForKeyword } from "../constants";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// --- 0. Location Detection ---
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "What is the City, State/Region, and Country at this location? Return strictly the string in format 'City, Region, Country'.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      }
    });
    return response.text || "Unknown Location";
  } catch (error) {
    console.error("Reverse geocode failed", error);
    return "";
  }
};

// --- 1. AI ORCHESTRATOR: User Profile Summary (Flash) ---
export const generateUserProfileSummary = async (user: UserProfile): Promise<string> => {
  const prompt = `
  Role: Nutrition Coach.
  Task: Create a concise "User Health Profile" from this raw data.
  Data: ${JSON.stringify(user)}
  Output Format: A dense paragraph summarizing metabolic needs, constraints, local food context (${user.location}), and lifestyle.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text || "";
  } catch (e) {
    console.error("Summary failed", e);
    return "User profile summary unavailable.";
  }
};

// --- 2. AI ORCHESTRATOR: Master Planner (Flash) ---
export const generateOrchestratedPlan = async (user: UserProfile, summary: string, dayContext: string = "Today"): Promise<{meals: Meal[], workouts: WorkoutPlan[]}> => {
  // Simplified Prompt: We ask for the plan structure but OMIT detailed steps/ingredients to save tokens.
  const prompt = `
  SYSTEM ROLE: You are the "Goalify Orchestrator".
  USER CONTEXT: ${summary}
  PLANNING FOR: ${dayContext}.
  Goal: ${user.goal}. Daily Cals: ${user.dailyCalories}. Protein: ${user.dailyProtein}g.
  
  TASK: Generate a 1-day Meal Plan (4 meals) and a Workout Plan.
  
  CONSTRAINTS:
  - Local ingredients for ${user.location}.
  - High protein, tasty.
  - DO NOT include cooking steps.
  - DO NOT include detailed ingredient amounts (just list names).
  - Ensure variety from previous days if applicable.
  
  OUTPUT: JSON Object with "meals" and "workout".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                meals: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            type: { type: Type.STRING },
                            name: { type: Type.STRING },
                            calories: { type: Type.NUMBER },
                            protein: { type: Type.NUMBER },
                            carbs: { type: Type.NUMBER },
                            fat: { type: Type.NUMBER },
                            fiber: { type: Type.NUMBER },
                            description: { type: Type.STRING },
                            prepTime: { type: Type.STRING },
                            difficulty: { type: Type.STRING },
                            emoji: { type: Type.STRING },
                            ingredients: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING } 
                            }
                        }
                    }
                },
                workout: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            day: { type: Type.STRING },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            restDay: { type: Type.BOOLEAN },
                            rounds: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        exercises: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: { 
                                                    name: { type: Type.STRING }, 
                                                    instruction: { type: Type.STRING }, 
                                                    reps: { type: Type.STRING }, 
                                                    emoji: { type: Type.STRING } 
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
      }
    });

    // Helper to sanitize potentially broken JSON
    let text = response.text || '{}';
    const rawData = JSON.parse(text);
    
    // Post-Process Meals
    const processedMeals = (rawData.meals || []).map((m: any, idx: number) => ({
        ...m,
        id: `${dayContext}-${idx}`, // Unique ID based on context
        ingredients: m.ingredients || [],
        author: { name: 'Goalify AI', handle: '@goalify', emoji: '🤖' }
    }));

    // Post-Process Workouts
    const processedWorkouts = rawData.workout || [];

    return { meals: processedMeals, workouts: processedWorkouts };

  } catch (error) {
    console.error("Orchestrator failed", error);
    // Return empty arrays to prevent app crash, logic in App.tsx handles empty default
    return { meals: [], workouts: [] };
  }
};


// --- 3. Dynamic Re-Balancing (Pro -> Flash for reliability/speed) ---
export const rebalanceDay = async (
    currentProfile: UserProfile, 
    eatenFoodName: string, 
    eatenCalories: number, 
    remainingBudget: number,
    nextMeals: Meal[]
): Promise<Meal[]> => {
    
    const prompt = `
    SYSTEM: Goalify Nutrition Orchestrator.
    EVENT: User ate "${eatenFoodName}" (${eatenCalories} kcal).
    NEW BUDGET: ${remainingBudget} kcal remaining for today.
    UPCOMING MEALS: ${nextMeals.map(m => m.name).join(', ')}.

    TASK: Rewrite UPCOMING meals to fit the new budget.
    - Reduce portions or change dishes.
    - Keep it simple. NO STEPS. NO DETAILED INGREDIENTS.

    OUTPUT: JSON Array of modified Meal objects.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            type: { type: Type.STRING },
                            name: { type: Type.STRING },
                            calories: { type: Type.NUMBER },
                            protein: { type: Type.NUMBER },
                            carbs: { type: Type.NUMBER },
                            fat: { type: Type.NUMBER },
                            fiber: { type: Type.NUMBER },
                            description: { type: Type.STRING },
                            prepTime: { type: Type.STRING },
                            difficulty: { type: Type.STRING },
                            emoji: { type: Type.STRING },
                            ingredients: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING } 
                            }
                        }
                    }
                }
            }
        });

        const newMeals = JSON.parse(response.text || '[]');
        return newMeals.map((m: any) => ({
             ...m,
            ingredients: m.ingredients || [],
            author: { name: 'AI Adjuster', handle: '@balancer', emoji: '⚖️' }
        }));
    } catch (e) {
        console.error("Rebalancing failed", e);
        return nextMeals;
    }
};

// --- 4. Vision Analysis (Flash) ---
export const analyzeFoodImage = async (base64Image: string): Promise<{ 
  foodName: string, 
  calories: number, 
  protein: number, 
  carbs: number, 
  fat: number, 
  reasoning: string
}> => {
  const analysisResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: "Analyze this image. Return JSON with foodName, calories, macros." }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          foodName: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          reasoning: { type: Type.STRING }
        }
      }
    }
  });

  const analysis = JSON.parse(analysisResponse.text || '{}');
  return {
    foodName: analysis.foodName || "Unknown Food",
    calories: analysis.calories || 0,
    protein: analysis.protein || 0,
    carbs: analysis.carbs || 0,
    fat: analysis.fat || 0,
    reasoning: analysis.reasoning || "Visual Estimate"
  };
};

// --- 5. Main Generators ---
export const generatePlan = async (user: UserProfile, dayContext: string = "Today"): Promise<Meal[]> => {
    const summary = await generateUserProfileSummary(user);
    const plan = await generateOrchestratedPlan(user, summary, dayContext);
    return plan.meals;
};

export const generateWorkoutPlan = async (user: UserProfile): Promise<WorkoutPlan[]> => {
     const summary = await generateUserProfileSummary(user);
     const plan = await generateOrchestratedPlan(user, summary);
     
     if (plan.workouts.length === 0) return [];
     
     const baseWorkout = plan.workouts[0];
     const weekPlan: WorkoutPlan[] = [];
     const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
     
     days.forEach((d, i) => {
         const isRest = (i + 1) % 4 === 0;
         weekPlan.push({
             ...baseWorkout,
             day: d,
             restDay: isRest,
             title: isRest ? "Active Recovery" : baseWorkout.title,
             rounds: isRest ? [] : baseWorkout.rounds
         });
     });
     return weekPlan;
};

// --- 6. Detailed Cooking Guide (On Demand - Pro) ---
export const getCookingGuide = async (mealName: string, ingredients: string[], servings: number = 1): Promise<CookingGuide> => {
  const prompt = `
  Create a detailed step-by-step cooking guide for "${mealName}".
  Ingredients available: ${ingredients.join(', ')}.
  Servings: ${servings}.
  Return JSON.
  `;
  try {
     const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
           type: Type.OBJECT,
           properties: {
               sections: {
                   type: Type.ARRAY,
                   items: {
                       type: Type.OBJECT,
                       properties: {
                           name: { type: Type.STRING },
                           ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                           steps: {
                               type: Type.ARRAY,
                               items: {
                                   type: Type.OBJECT,
                                   properties: {
                                       title: { type: Type.STRING },
                                       description: { type: Type.STRING }
                                   }
                               }
                           }
                       }
                   }
               },
               tips: { type: Type.ARRAY, items: { type: Type.STRING } },
               audioIntro: { type: Type.STRING }
           }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) { 
      console.error("Cooking guide failed", e);
      return { sections: [], tips: ["Enjoy your meal!"], audioIntro: "" }; 
  }
};

export const enrichMealIngredients = async (mealName: string, existingIngredients: string[]): Promise<IngredientDetail[]> => {
    const prompt = `
    Enrich this ingredient list for "${mealName}" with amounts and emojis.
    Ingredients: ${existingIngredients.join(', ')}.
    Return JSON array of objects {name, amount, emoji}.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            amount: { type: Type.STRING },
                            emoji: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(response.text || '[]');
    } catch (e) {
        return existingIngredients.map(i => ({ name: i, amount: 'As needed', emoji: '🥘' }));
    }
};

// --- Other Helpers ---
export const findRestaurant = async (mealName: string, location: { lat: number, lng: number }): Promise<AIResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find 3 highly rated restaurants nearby that serve ${mealName}. Return a list.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.lat,
              longitude: location.lng
            }
          }
        }
      },
    });

    const places: MapPlace[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
             // Maps chunks logic
             const mapsData = (chunk as any).maps;
             if (mapsData) {
                 places.push({
                     title: mapsData.title || "Restaurant",
                     uri: mapsData.googleMapsUri || mapsData.uri || "#",
                     address: mapsData.formattedAddress,
                     rating: mapsData.rating?.toString()
                 });
             } else if (chunk.web) {
                 places.push({
                     title: chunk.web.title || "Place",
                     uri: chunk.web.uri || "#"
                 });
             }
        });
    }

    return { 
        text: response.text || "Here are some places nearby.",
        places: places 
    };
  } catch (error) {
    console.error("Find restaurant failed", error);
    return { text: "Could not find restaurants at this time." };
  }
};

export const chatWithCoach = async (message: string, history: {role: string, parts: {text: string}[]}[]): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview', 
      history: history,
      config: { systemInstruction: "You are a helpful nutrition coach." }
    });
    const response = await chat.sendMessage({ message });
    return response.text || "I'm thinking...";
  } catch (e) { return "Error."; }
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => { return ""; };
export const speakText = async (text: string): Promise<ArrayBuffer | null> => { return null; };

// Live API Exports
export const connectLiveSession = async (onAudio: any, onClose: any) => { return { sendAudio: (b:any)=>{}, close: ()=>{} }; };
export function base64ToFloat32Array(base64: string): Float32Array { return new Float32Array(0); }
export function float32ToPCM16(float32: Float32Array): ArrayBuffer { return new ArrayBuffer(0); }
export async function pcmToAudioBuffer(data: any, ctx: any, sr: number = 24000): Promise<AudioBuffer> { return ctx.createBuffer(1,1,sr); }
