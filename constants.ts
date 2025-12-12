
import { UserProfile, Meal } from './types';

export const SYSTEM_INSTRUCTION_PLANNER = `You are "Goalify", an expert Calorie Tracker & Meal planner. Your philosophy is sustainable nutrition.
Prioritize tasty, culturally relevant food with portion control.
When suggesting meals, focus on high protein and flavor.`;

export const calculateMacros = (profile: UserProfile) => {
  // Simplified Mifflin-St Jeor Equation
  let bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
  if (profile.gender === 'Male') bmr += 5;
  else bmr -= 161;

  let tdee = bmr * 1.375; // Lightly active multiplier default

  if (profile.goal === 'Cut (Lose Fat)') return { calories: Math.round(tdee - 500), protein: Math.round(profile.weight * 2) };
  if (profile.goal === 'Bulk (Build Muscle)') return { calories: Math.round(tdee + 300), protein: Math.round(profile.weight * 2.2) };
  return { calories: Math.round(tdee), protein: Math.round(profile.weight * 1.8) };
};

// --- EMOJI DATABASE ---
export const getEmojiForKeyword = (text: string): string => {
  const lower = text.toLowerCase();
  
  // Proteins
  if (lower.includes('egg') || lower.includes('omelette')) return '🍳';
  if (lower.includes('chicken') || lower.includes('poultry') || lower.includes('wing')) return '🍗';
  if (lower.includes('beef') || lower.includes('steak') || lower.includes('meat') || lower.includes('lamb')) return '🥩';
  if (lower.includes('pork') || lower.includes('bacon') || lower.includes('ham')) return '🥓';
  if (lower.includes('burger') || lower.includes('patty')) return '🍔';
  if (lower.includes('fish') || lower.includes('salmon') || lower.includes('tuna')) return '🐟';
  if (lower.includes('shrimp') || lower.includes('prawn') || lower.includes('seafood') || lower.includes('crab') || lower.includes('lobster')) return '🍤';
  if (lower.includes('sushi') || lower.includes('sashimi')) return '🍣';
  if (lower.includes('tofu') || lower.includes('soy')) return '🧊';
  
  // Carbs & Grains
  if (lower.includes('rice') || lower.includes('biryani') || lower.includes('pilaf') || lower.includes('risotto')) return '🍚';
  if (lower.includes('bread') || lower.includes('toast') || lower.includes('bagel') || lower.includes('bun')) return '🍞';
  if (lower.includes('sandwich') || lower.includes('panini')) return '🥪';
  if (lower.includes('pasta') || lower.includes('spaghetti') || lower.includes('macaroni') || lower.includes('noodle') || lower.includes('ramen')) return '🍝';
  if (lower.includes('pizza')) return '🍕';
  if (lower.includes('taco') || lower.includes('burrito') || lower.includes('mexican')) return '🌮';
  if (lower.includes('fries') || lower.includes('chip')) return '🍟';
  if (lower.includes('potato')) return '🥔';
  if (lower.includes('corn') || lower.includes('maize') || lower.includes('popcorn')) return '🌽';
  if (lower.includes('oat') || lower.includes('porridge') || lower.includes('cereal') || lower.includes('muesli')) return '🥣';
  if (lower.includes('pancake') || lower.includes('waffle')) return '🥞';
  
  // Veggies
  if (lower.includes('salad') || lower.includes('green') || lower.includes('bowl')) return '🥗';
  if (lower.includes('lettuce') || lower.includes('spinach') || lower.includes('kale') || lower.includes('cabbage')) return '🥬';
  if (lower.includes('broccoli') || lower.includes('cauliflower')) return '🥦';
  if (lower.includes('carrot')) return '🥕';
  if (lower.includes('cucumber')) return '🥒';
  if (lower.includes('tomato')) return '🍅';
  if (lower.includes('onion')) return '🧅';
  if (lower.includes('garlic')) return '🧄';
  if (lower.includes('pepper') || lower.includes('chili') || lower.includes('spic') || lower.includes('jalapeno')) return '🌶️';
  if (lower.includes('avocado') || lower.includes('guac')) return '🥑';
  if (lower.includes('eggplant') || lower.includes('aubergine')) return '🍆';
  if (lower.includes('mushroom') || lower.includes('fungi')) return '🍄';
  
  // Fruits
  if (lower.includes('apple')) return '🍎';
  if (lower.includes('banana')) return '🍌';
  if (lower.includes('berry') || lower.includes('berries') || lower.includes('strawberry') || lower.includes('blueberry')) return '🫐';
  if (lower.includes('lemon') || lower.includes('lime') || lower.includes('citrus')) return '🍋';
  if (lower.includes('orange') || lower.includes('tangerine')) return '🍊';
  if (lower.includes('grape')) return '🍇';
  if (lower.includes('melon') || lower.includes('watermelon')) return '🍉';
  if (lower.includes('peach') || lower.includes('apricot')) return '🍑';
  if (lower.includes('cherry')) return '🍒';
  if (lower.includes('pear')) return '🍐';
  if (lower.includes('pineapple')) return '🍍';
  if (lower.includes('coconut')) return '🥥';
  if (lower.includes('mango')) return '🥭';
  if (lower.includes('kiwi')) return '🥝';

  // Dairy & Liquids
  if (lower.includes('milk') || lower.includes('dairy') || lower.includes('cream')) return '🥛';
  if (lower.includes('cheese') || lower.includes('paneer') || lower.includes('cheddar') || lower.includes('mozzarella')) return '🧀';
  if (lower.includes('yogurt') || lower.includes('curd') || lower.includes('raita')) return '🥣';
  if (lower.includes('butter') || lower.includes('ghee')) return '🧈';
  if (lower.includes('ice cream') || lower.includes('gelato')) return '🍨';
  if (lower.includes('coffee') || lower.includes('espresso') || lower.includes('latte') || lower.includes('caffeine')) return '☕';
  if (lower.includes('tea') || lower.includes('matcha') || lower.includes('chai')) return '🍵';
  if (lower.includes('water') || lower.includes('hydrate')) return '💧';
  if (lower.includes('juice') || lower.includes('smoothie')) return '🧃';
  if (lower.includes('wine') || lower.includes('beer') || lower.includes('alcohol')) return '🍷';
  
  // Sweets & Misc
  if (lower.includes('chocolate') || lower.includes('cocoa')) return '🍫';
  if (lower.includes('cookie') || lower.includes('biscuit')) return '🍪';
  if (lower.includes('cake') || lower.includes('muffin') || lower.includes('pastry')) return '🧁';
  if (lower.includes('donut') || lower.includes('doughnut')) return '🍩';
  if (lower.includes('honey')) return '🍯';
  if (lower.includes('salt')) return '🧂';
  if (lower.includes('oil')) return '🫒';
  if (lower.includes('nut') || lower.includes('peanut') || lower.includes('almond') || lower.includes('cashew')) return '🥜';

  // Default fallback based on meal type keywords
  if (lower.includes('breakfast')) return '🍳';
  if (lower.includes('lunch')) return '🍱';
  if (lower.includes('dinner')) return '🍽️';
  if (lower.includes('snack')) return '🥨';
  
  return '🥘'; // Generic food pot
};

export const INITIAL_MEALS: Meal[] = [
  { 
    id: '1', 
    type: 'Breakfast', 
    name: 'Masala Omelette & Toast', 
    calories: 450, 
    protein: 25, 
    carbs: 35,
    fat: 22,
    fiber: 6,
    prepTime: '20min',
    difficulty: 'Easy',
    description: 'A spicy, protein-packed start to your day. Fluffy eggs whisked with fresh onions, green chilies, and coriander, served with crisp whole wheat toast.', 
    ingredients: ['3 Eggs', '1 Onion', 'Green Chili', '2 slices Whole Wheat Bread'],
    detailedIngredients: [
      { name: 'Eggs (Large)', amount: '3 pcs', emoji: '🥚' },
      { name: 'Onion (Chopped)', amount: '1 small', emoji: '🧅' },
      { name: 'Green Chili', amount: '2 pcs', emoji: '🌶️' },
      { name: 'Wheat Bread', amount: '2 slices', emoji: '🍞' },
      { name: 'Butter', amount: '1 tsp', emoji: '🧈' }
    ],
    emoji: '🍳',
    author: { name: 'Alice Wood', handle: '@alicewood', emoji: '👩‍🍳' },
    steps: [
      { title: 'Prep Veggies', description: 'Finely chop the onions, green chilies, and fresh coriander leaves.', emoji: '🔪' },
      { title: 'Whisk Eggs', description: 'Crack 3 eggs into a bowl. Add the chopped veggies, salt, and pepper. Whisk until frothy.', emoji: '🥣' },
      { title: 'Cook Omelette', description: 'Heat butter in a non-stick pan. Pour the egg mixture. Cook on medium heat for 2 mins, then flip.', emoji: '🍳' },
      { title: 'Toast & Serve', description: 'Toast the bread slices until golden brown. Serve hot with the omelette.', emoji: '🍞' }
    ]
  },
  { 
    id: '2', 
    type: 'Lunch', 
    name: 'Chicken Biryani Bowl', 
    calories: 700, 
    protein: 40,
    carbs: 68,
    fat: 30,
    fiber: 10,
    prepTime: '45min',
    difficulty: 'Medium',
    description: 'Portion controlled biryani with extra chicken piece. A flavorful and protein-rich dish prepared with fresh ingredients.', 
    ingredients: ['150g Chicken Breast', '1 Cup Basmati Rice', 'Yogurt Raita', 'Spices'],
    detailedIngredients: [
      { name: 'Chicken Breast', amount: '150g', emoji: '🍗' },
      { name: 'Basmati Rice', amount: '1 Cup', emoji: '🍚' },
      { name: 'Yogurt Raita', amount: '1/2 bowl', emoji: '🥣' },
      { name: 'Red Chili', amount: '20g', emoji: '🌶️' },
      { name: 'Biryani Masala', amount: '2 tbsp', emoji: '🧂' }
    ],
    emoji: '🍛',
    author: { name: 'Alice Wood', handle: '@alicewood', emoji: '👩‍🍳' },
    steps: [
      { title: 'Marinate Chicken', description: 'Mix chicken cubes with yogurt, ginger-garlic paste, and biryani masala. Let it rest for 20 mins.', emoji: '🥣' },
      { title: 'Par-boil Rice', description: 'Boil water with whole spices (cardamom, cloves). Add soaked rice and cook until 70% done. Drain.', emoji: '🍚' },
      { title: 'Cook Base', description: 'In a pot, sauté sliced onions in ghee until golden brown. Add the marinated chicken and cook for 10 mins.', emoji: '🍲' },
      { title: 'Layer & Dum', description: 'Layer the par-boiled rice over the chicken. Cover lid tightly with dough or foil. Cook on very low heat (Dum) for 15 mins.', emoji: '🔥' }
    ]
  },
  { 
    id: '3', 
    type: 'Snack', 
    name: 'Greek Yogurt & Berries', 
    calories: 200, 
    protein: 15,
    carbs: 25,
    fat: 4,
    fiber: 5,
    prepTime: '5min',
    difficulty: 'Easy',
    description: 'Quick protein fix. Creamy greek yogurt topped with antioxidant-rich mixed berries and a drizzle of honey.', 
    ingredients: ['1 Cup Greek Yogurt', 'Handful Berries'],
    detailedIngredients: [
      { name: 'Greek Yogurt', amount: '1 Cup', emoji: '🥣' },
      { name: 'Mixed Berries', amount: '1/2 Cup', emoji: '🫐' },
      { name: 'Honey', amount: '1 tsp', emoji: '🍯' },
      { name: 'Chia Seeds', amount: '1 tbsp', emoji: '🌱' }
    ],
    emoji: '🫐',
    author: { name: 'Alice Wood', handle: '@alicewood', emoji: '👩‍🍳' },
    steps: [
      { title: 'Scoop Yogurt', description: 'Add 1 cup of chilled Greek yogurt to a serving bowl.', emoji: '🥄' },
      { title: 'Add Toppings', description: 'Wash and dry the berries. Top the yogurt with them.', emoji: '🍓' },
      { title: 'Garnish', description: 'Drizzle honey and sprinkle chia seeds for crunch.', emoji: '🍯' }
    ]
  },
  { 
    id: '4', 
    type: 'Dinner', 
    name: 'Grilled Beef Burger', 
    calories: 600, 
    protein: 35,
    carbs: 30,
    fat: 35,
    fiber: 4,
    prepTime: '25min',
    difficulty: 'Medium',
    description: 'Homemade patty, minimal bun. Juicy lean beef patty seasoned to perfection, served open-faced with fresh lettuce and tomato.', 
    ingredients: ['150g Lean Beef', 'Lettuce wrap or half bun', 'Cheese slice'],
    detailedIngredients: [
      { name: 'Lean Beef', amount: '150g', emoji: '🥩' },
      { name: 'Cheddar Cheese', amount: '1 slice', emoji: '🧀' },
      { name: 'Lettuce', amount: '1 large leaf', emoji: '🥬' },
      { name: 'Tomato', amount: '2 slices', emoji: '🍅' },
      { name: 'Burger Bun', amount: '1/2 pc', emoji: '🍔' }
    ],
    emoji: '🍔',
    author: { name: 'Alice Wood', handle: '@alicewood', emoji: '👩‍🍳' },
    steps: [
      { title: 'Form Patty', description: 'Mix beef mince with salt and pepper. Gently form into a patty without overworking the meat.', emoji: '🥩' },
      { title: 'Grill', description: 'Heat a grill pan or skillet. Cook patty for 4 mins on one side, flip, add cheese, and cook 3 mins more.', emoji: '🔥' },
      { title: 'Toast Bun', description: 'Lightly toast the half bun on the skillet.', emoji: '🍞' },
      { title: 'Assemble', description: 'Place lettuce on the bun, add tomato, and top with the cheesy patty.', emoji: '🍔' }
    ]
  },
];
