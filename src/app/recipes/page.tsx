"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, Flame } from "lucide-react";
import { FlipCard } from "@/components/meals/FlipCard";
import { Meal } from "@/types";

// Real, viral, tried-and-tested vegetarian recipes from TikTok / Instagram / YouTube / Reddit
// Sources noted in tags — these are the ones people actually cook and screenshot
const SAMPLE_MEALS: Meal[] = [
  {
    _id: "1",
    name: "Viral Baked Feta Pasta",
    description: "The recipe that broke the internet in 2021 — whole block of feta roasted with cherry tomatoes until gooey, tossed with pasta. Unapologetically rich.",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=400&fit=crop&q=80",
    calories: 510, protein: 22, carbs: 62, fat: 20, fiber: 4, prepTime: 35,
    ingredients: ["200g pasta (rigatoni or penne)", "200g block feta cheese", "400g cherry tomatoes", "4 garlic cloves", "4 tbsp olive oil", "1 tsp chilli flakes", "Fresh basil", "Salt & black pepper"],
    instructions: [
      "Preheat oven to 200°C / 400°F.",
      "Place cherry tomatoes in a baking dish. Add whole garlic cloves.",
      "Put the feta block in the centre. Pour olive oil over everything. Season with chilli flakes, salt and pepper.",
      "Roast for 30 min until tomatoes are bursting and feta is golden.",
      "Meanwhile cook pasta al dente. Reserve ½ cup pasta water.",
      "Smash the feta with a fork, mixing into the tomatoes. Add pasta and a splash of pasta water. Toss until coated.",
      "Finish with fresh basil and extra chilli."
    ],
    tags: ["TikTok Viral", "Italian", "Comfort"], isHighProtein: false, isLowCarb: false,
  },
  {
    _id: "2",
    name: "15-Min Chilli Garlic Noodles",
    description: "Crispy shallots, chilli oil, soy, and sesame on any noodle you have. Went viral on every food platform for a reason — deeply addictive, done in 15 minutes.",
    image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&h=400&fit=crop&q=80",
    calories: 420, protein: 12, carbs: 58, fat: 18, fiber: 3, prepTime: 15,
    ingredients: ["200g noodles (ramen, udon or spaghetti)", "3 tbsp chilli oil (store-bought)", "2 tbsp soy sauce", "1 tbsp oyster sauce (or hoisin)", "1 tsp sesame oil", "4 garlic cloves, minced", "2 shallots, thinly sliced", "2 tbsp neutral oil", "Spring onions & sesame seeds to finish"],
    instructions: [
      "Cook noodles 1 minute less than packet says. Drain and toss with a little sesame oil so they don't stick.",
      "Fry shallots in neutral oil over medium heat, stirring often, for 8-10 min until golden and crispy. Remove and set aside.",
      "In the same oil, fry garlic 30 seconds until fragrant.",
      "Mix soy sauce, oyster sauce, chilli oil in a small bowl.",
      "Add noodles to pan, pour sauce over, toss on high heat 1-2 min.",
      "Plate and top with crispy shallots, spring onions and sesame seeds."
    ],
    tags: ["TikTok Viral", "Asian", "Quick"], isHighProtein: false, isLowCarb: false,
  },
  {
    _id: "3",
    name: "Green Goddess Salad",
    description: "The TikTok salad that got millions of views. Shredded cabbage, cucumber, and herbs drowning in an insanely good green goddess dressing. Genuinely life-changing.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop&q=80",
    calories: 220, protein: 6, carbs: 18, fat: 14, fiber: 5, prepTime: 15,
    ingredients: ["½ head green cabbage, finely shredded", "1 cucumber, diced", "3 spring onions", "1 cup fresh basil", "1 cup fresh parsley", "2 tbsp chives", "1 lemon, juiced", "3 tbsp olive oil", "2 tbsp white wine vinegar", "1 garlic clove", "Salt & pepper"],
    instructions: [
      "For the dressing: blend basil, parsley, chives, lemon juice, olive oil, vinegar, garlic, salt & pepper until smooth.",
      "Finely shred the cabbage — the finer the better (mandoline if you have one).",
      "Dice cucumber into small cubes. Slice spring onions.",
      "Toss cabbage and cucumber in about ¾ of the dressing.",
      "Let it sit 5 minutes — the dressing softens the cabbage slightly.",
      "Top with remaining spring onions and extra dressing. Serve immediately or refrigerate up to a day."
    ],
    tags: ["TikTok Viral", "Fresh", "Quick"], isHighProtein: false, isLowCarb: true,
  },
  {
    _id: "4",
    name: "Marry Me Tofu",
    description: "The plant-based spin on Marry Me Chicken that took Reddit by storm. Sun-dried tomatoes, cream, parmesan, and herbs in a sauce so good it'll make you propose.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop&q=80",
    calories: 380, protein: 26, carbs: 18, fat: 24, fiber: 3, prepTime: 30,
    ingredients: ["400g extra-firm tofu, pressed and sliced thick", "½ cup sun-dried tomatoes in oil, chopped", "1 cup heavy cream (or coconut cream)", "½ cup vegetable stock", "3 garlic cloves, minced", "1 tsp dried thyme", "1 tsp dried oregano", "½ tsp chilli flakes", "40g parmesan, grated", "Cornstarch for coating", "Salt & pepper", "Olive oil"],
    instructions: [
      "Press tofu for 20 min to remove moisture. Slice into thick slabs. Season and dust with cornstarch.",
      "Sear tofu in olive oil over high heat, 3-4 min per side until deeply golden. Set aside.",
      "In the same pan, sauté garlic 1 min. Add sun-dried tomatoes with their oil.",
      "Pour in stock and cream. Add thyme, oregano, chilli flakes. Simmer 5 min.",
      "Stir in parmesan until melted. Taste and season.",
      "Add tofu back, spoon sauce over. Simmer 3 min.",
      "Serve over pasta, rice, or with crusty bread."
    ],
    tags: ["Reddit Viral", "Comfort", "Italian"], isHighProtein: true, isLowCarb: false,
  },
  {
    _id: "5",
    name: "Mumbai Masala Omelette",
    description: "Street-style egg omelette with onion, chilli, tomato and coriander. Every Indian hostel student's 3am recipe. Dead simple, absolutely delicious.",
    image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&h=400&fit=crop&q=80",
    calories: 260, protein: 20, carbs: 8, fat: 17, fiber: 2, prepTime: 10,
    ingredients: ["3 eggs", "1 small onion, finely chopped", "1 green chilli, finely chopped", "1 medium tomato, finely chopped", "Handful of fresh coriander", "¼ tsp turmeric", "¼ tsp chilli powder", "Salt to taste", "1 tbsp butter + 1 tsp oil"],
    instructions: [
      "Beat eggs well with a fork. Season with salt, turmeric, chilli powder.",
      "Add onion, tomato, green chilli, and coriander to the eggs. Mix.",
      "Heat butter and oil in a pan (butter alone burns).",
      "Pour the egg mixture. Let it sit on medium heat for 1 min.",
      "When edges start to set, fold one side over to make a half-moon.",
      "Cook 1 more minute until just done — don't overcook, it should be slightly custardy inside.",
      "Serve with toast or pav. Squeeze a lime over the top."
    ],
    tags: ["Indian Street Food", "Breakfast", "Quick"], isHighProtein: true, isLowCarb: true,
  },
  {
    _id: "6",
    name: "Korean Sundubu Jjigae",
    description: "Spicy silken tofu stew that's been on every Korean food YouTuber's channel. Deeply warming, incredibly quick, and packed with umami. Serve with rice — non-negotiable.",
    image: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600&h=400&fit=crop&q=80",
    calories: 290, protein: 18, carbs: 14, fat: 16, fiber: 3, prepTime: 20,
    ingredients: ["400g silken tofu", "1 tbsp gochugaru (Korean chilli flakes)", "2 tbsp gochujang", "1 tbsp soy sauce", "1 tbsp sesame oil", "1 tsp sugar", "4 garlic cloves, minced", "1 small onion, sliced", "2 cups dashima (kombu) stock or veg stock", "2 spring onions", "1 egg (optional)"],
    instructions: [
      "Make stock: simmer a piece of kombu in 2.5 cups water for 10 min. Remove kombu.",
      "Heat sesame oil in a small clay pot or saucepan over medium. Fry garlic and onion 2 min.",
      "Add gochugaru and gochujang. Stir fry 1 min until fragrant and oil turns red.",
      "Pour in stock and soy sauce. Add sugar. Bring to a boil.",
      "Gently spoon in silken tofu in large chunks — don't break it too much.",
      "Simmer 5 min. Taste and adjust seasoning.",
      "Crack an egg on top if using. Let it set for 1-2 min. Finish with spring onions and serve bubbling."
    ],
    tags: ["Korean", "YouTube", "Comfort"], isHighProtein: true, isLowCarb: true,
  },
  {
    _id: "7",
    name: "Tamago Sando",
    description: "Japan's legendary egg salad sandwich. The convenience store version that food bloggers obsessed over. Pillowy milk bread, eggy-mayo filling, perfect every time.",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&h=400&fit=crop&q=80",
    calories: 390, protein: 16, carbs: 34, fat: 22, fiber: 1, prepTime: 20,
    ingredients: ["4 eggs", "3 tbsp Japanese mayo (Kewpie — mandatory)", "1 tsp Dijon mustard", "4 slices Japanese milk bread (or brioche)", "Salt & white pepper", "Optional: 1 tsp mirin for sweetness"],
    instructions: [
      "Boil eggs: bring water to a boil, lower to medium, add eggs, cook exactly 10 min for hard but creamy yolks.",
      "Transfer to ice water immediately. Peel under running water.",
      "Grate or mash eggs finely — a box grater gives the right texture.",
      "Mix with Kewpie mayo, mustard, salt, white pepper, and mirin if using. The filling should be creamy but not loose.",
      "Remove crusts from bread (this matters for authenticity).",
      "Spread a generous layer of filling on one slice. Top with the other slice. Press gently.",
      "Cut in half straight across — not diagonal. Wrap in cling film and rest 5 min before serving."
    ],
    tags: ["Japanese", "Instagram", "Lunch"], isHighProtein: false, isLowCarb: false,
  },
  {
    _id: "8",
    name: "High-Protein Overnight Oats",
    description: "The fitness TikTok staple done properly. Cottage cheese + Greek yogurt base makes this 40g protein per jar. Actually tastes incredible, not sad diet food.",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&h=400&fit=crop&q=80",
    calories: 420, protein: 40, carbs: 48, fat: 8, fiber: 7, prepTime: 5,
    ingredients: ["½ cup rolled oats", "½ cup cottage cheese (full-fat)", "½ cup Greek yogurt (0% or 2%)", "¾ cup almond or oat milk", "1 tbsp chia seeds", "1 tbsp honey or maple syrup", "½ tsp vanilla extract", "Toppings: banana, berries, almond butter, granola"],
    instructions: [
      "Blend cottage cheese with milk until completely smooth (no lumps — this is the secret to not hating cottage cheese).",
      "Mix oats, chia seeds, Greek yogurt, honey, vanilla in a jar.",
      "Pour in the blended cottage cheese mixture. Stir well.",
      "Refrigerate overnight (minimum 4 hours).",
      "In the morning, stir it up. It should be thick and creamy.",
      "Top with sliced banana, berries, a drizzle of almond butter and granola.",
      "If too thick, add a splash of milk."
    ],
    tags: ["TikTok", "Breakfast", "High Protein"], isHighProtein: true, isLowCarb: false,
  },
  {
    _id: "9",
    name: "Miso Glazed Aubergine",
    description: "Nasu Dengaku — Japanese restaurant dish that blew up on food Instagram. Silky roasted aubergine with a caramelised sweet miso glaze. Zero effort, maximum impact.",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop&q=80",
    calories: 200, protein: 6, carbs: 24, fat: 9, fiber: 6, prepTime: 25,
    ingredients: ["2 aubergines", "3 tbsp white miso paste", "2 tbsp mirin", "1 tbsp sake or dry sherry", "1 tbsp sugar", "1 tsp sesame oil", "Sesame seeds + spring onions to finish"],
    instructions: [
      "Halve aubergines lengthways. Score the flesh in a cross-hatch pattern (don't cut through skin).",
      "Brush cut side generously with neutral oil. Place cut-side down on a hot pan.",
      "Cook 5 min on high heat until golden. Flip, cook 3 more min.",
      "Mix miso, mirin, sake, sugar and sesame oil into a smooth paste.",
      "Spread the miso glaze generously over the cut side of aubergine.",
      "Grill or broil at maximum heat for 3-4 min until the glaze caramelises and bubbles.",
      "Top with sesame seeds and spring onions. Eat immediately."
    ],
    tags: ["Japanese", "Instagram", "Vegan"], isHighProtein: false, isLowCarb: true,
  },
  {
    _id: "10",
    name: "Dhaba-Style Dal Tadka",
    description: "The yellow dal that every Indian restaurant pretends is difficult. It's not. This dhaba method with a proper ghee tadka poured sizzling over the dal changes everything.",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop&q=80",
    calories: 310, protein: 18, carbs: 44, fat: 9, fiber: 12, prepTime: 40,
    ingredients: ["1 cup toor dal (split pigeon peas)", "1 tomato, chopped", "1 onion, finely chopped", "1 tsp turmeric", "Salt to taste", "For tadka: 2 tbsp ghee, 1 tsp cumin seeds, 4 garlic cloves sliced thin, 2 dried red chillies, 1 tsp kashmiri chilli powder, pinch of hing (asafoetida)"],
    instructions: [
      "Rinse dal 3 times. Pressure cook with 3 cups water, turmeric, salt for 3-4 whistles until completely soft.",
      "Whisk the cooked dal to a creamy consistency. If too thick, add hot water.",
      "In the same pot, cook onion and tomato into the dal and simmer 10 min.",
      "THE TADKA: heat ghee in a small pan until shimmering hot. Add hing, then cumin seeds.",
      "When seeds splutter, add sliced garlic — fry until golden at the edges, about 45 seconds.",
      "Add dried red chillies and kashmiri chilli powder. Immediately pour this entire sizzling tadka over the dal.",
      "Don't stir yet — let it sit 30 seconds so the smoke infuses the dal. Then mix and serve."
    ],
    tags: ["Indian", "YouTube Classic", "Comfort"], isHighProtein: false, isLowCarb: false,
  },
  {
    _id: "11",
    name: "Smashed Cucumber Salad",
    description: "The TikTok Chinese salad that got everyone smashing cucumbers on their countertops. The smashing creates jagged edges that hold the dressing like nothing else.",
    image: "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&h=400&fit=crop&q=80",
    calories: 140, protein: 3, carbs: 10, fat: 9, fiber: 2, prepTime: 15,
    ingredients: ["2 English cucumbers", "1 tsp salt", "2 garlic cloves, minced", "2 tbsp soy sauce", "1 tbsp rice vinegar", "1 tbsp chilli oil", "1 tsp sesame oil", "½ tsp sugar", "Sesame seeds + coriander"],
    instructions: [
      "Smash cucumbers with a flat knife or rolling pin until they crack open. Cut into rough 3cm pieces.",
      "Toss with salt and let sit 10 minutes — this draws out water.",
      "Squeeze out excess water with your hands or a cloth.",
      "Mix garlic, soy sauce, vinegar, chilli oil, sesame oil, and sugar into a dressing.",
      "Toss cucumbers in dressing. Let marinate 5 min.",
      "Scatter sesame seeds and coriander. Serve immediately or refrigerate up to 2 hours.",
      "The longer it sits, the better it tastes."
    ],
    tags: ["TikTok Viral", "Chinese", "Quick"], isHighProtein: false, isLowCarb: true,
  },
  {
    _id: "12",
    name: "Shakshuka",
    description: "The NYT Cooking recipe that got millions of saves. Eggs poached in spiced tomato sauce — the brunch dish that replaced avocado toast on every food blog for a year.",
    image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&h=400&fit=crop&q=80",
    calories: 290, protein: 18, carbs: 22, fat: 16, fiber: 5, prepTime: 30,
    ingredients: ["4 large eggs", "1 can (400g) crushed tomatoes", "1 red pepper, diced", "1 onion, diced", "4 garlic cloves, minced", "1 tsp cumin", "1 tsp paprika", "½ tsp cayenne", "2 tbsp olive oil", "100g feta, crumbled", "Fresh parsley", "Crusty bread to serve"],
    instructions: [
      "Heat oil in a wide oven-safe pan. Fry onion and red pepper until soft, 8 min.",
      "Add garlic, cumin, paprika, cayenne. Cook 1 min until fragrant.",
      "Pour in crushed tomatoes. Season generously. Simmer 10 min until sauce thickens.",
      "Make 4 wells in the sauce. Crack one egg into each well.",
      "Cover and cook on medium-low until whites are set but yolks still runny — 6-8 min. Watch them.",
      "Crumble feta over the top. Scatter fresh parsley.",
      "Bring the pan to the table. Serve straight from the pan with bread to mop up the sauce."
    ],
    tags: ["Middle Eastern", "Instagram", "Brunch"], isHighProtein: true, isLowCarb: false,
  },
  {
    _id: "13",
    name: "Paneer Butter Masala",
    description: "The most-searched Indian recipe on YouTube, made right. Velvety tomato-cashew gravy with paneer that melts in your mouth. Restaurant quality in 40 minutes.",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop&q=80",
    calories: 460, protein: 22, carbs: 22, fat: 32, fiber: 4, prepTime: 40,
    ingredients: ["250g paneer, cubed", "6 large tomatoes, roughly chopped", "1 large onion, roughly chopped", "15 cashews", "4 garlic cloves", "1 inch ginger", "2 tbsp butter", "1 tbsp oil", "1 tsp cumin", "1 tsp garam masala", "1 tsp kashmiri chilli", "½ cup cream", "1 tsp sugar", "Salt"],
    instructions: [
      "Sauté onion, tomatoes, cashews, garlic and ginger in oil until tomatoes are mushy (15 min).",
      "Let cool slightly. Blend the entire mixture to a completely smooth purée.",
      "Strain through a sieve for the silkiest gravy — most people skip this; don't.",
      "In the same pan, heat butter. Add cumin until it sizzles. Add the strained purée.",
      "Cook on high heat, stirring, until it reduces by a third and deepens in colour, about 8 min.",
      "Add kashmiri chilli, garam masala, salt, sugar. Simmer 5 min.",
      "Pour in cream. Add paneer. Simmer gently 5 min. Finish with a knob of cold butter for gloss."
    ],
    tags: ["Indian", "YouTube Classic", "Restaurant Style"], isHighProtein: true, isLowCarb: false,
  },
  {
    _id: "14",
    name: "Chilli Oil Fried Eggs",
    description: "2 million TikTok views for a reason. Eggs fried in bubbling chilli oil with crispy edges and a runny yolk. On rice, toast, noodles — everything. Life-changing breakfast.",
    image: "https://images.unsplash.com/photo-1607532941433-304659e8198a?w=600&h=400&fit=crop&q=80",
    calories: 230, protein: 14, carbs: 4, fat: 18, fiber: 1, prepTime: 7,
    ingredients: ["2 eggs", "2 tbsp chilli oil (Lao Gan Ma or similar)", "1 tbsp neutral oil", "1 tsp soy sauce", "½ tsp sesame oil", "Spring onions", "Steamed rice or toast to serve"],
    instructions: [
      "Heat both oils in a small pan over medium-high until very hot — you want it shimmering.",
      "Crack eggs directly into the hot oil. They should sizzle and bubble aggressively from the start.",
      "Tilt the pan and baste the top of the eggs with the hot chilli oil using a spoon.",
      "Cook just 2 minutes — edges should be crispy and lacy, whites set, yolks still completely runny.",
      "Slide onto rice or toast. Drizzle with soy sauce and sesame oil.",
      "Top with spring onions. Eat immediately while the edges are still crisp.",
      "Leftover chilli oil from the pan? Pour it over the rice too."
    ],
    tags: ["TikTok Viral", "Breakfast", "Quick"], isHighProtein: true, isLowCarb: true,
  },
  {
    _id: "15",
    name: "Saag Paneer",
    description: "Not the watered-down restaurant version. This is the real thing — charred greens, whole spices, and paneer that holds its shape. Punjabi grandmothers would approve.",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&h=400&fit=crop&q=80",
    calories: 390, protein: 26, carbs: 18, fat: 26, fiber: 7, prepTime: 40,
    ingredients: ["200g paneer, cubed", "4 cups spinach + 1 cup mustard greens (the secret)", "1 onion, finely chopped", "3 tomatoes, chopped", "5 garlic cloves", "1 inch ginger", "2 green chillies", "1 tsp cumin seeds", "1 tsp garam masala", "1 tsp coriander powder", "2 tbsp ghee", "2 tbsp cream", "Salt"],
    instructions: [
      "Blanch spinach and mustard greens in boiling water 2 min. Transfer to ice water to keep colour.",
      "Blend greens with green chillies, garlic, and ginger to a coarse purée — not completely smooth.",
      "In a kadhai, heat ghee. Add cumin seeds. When they splutter, add onion and fry until deep golden.",
      "Add tomatoes and cook down completely until ghee separates from the masala, about 10 min.",
      "Add coriander powder and garam masala. Cook 2 min.",
      "Add the green purée. Cook on high heat for 5-7 min — the charring is what makes it taste like a dhaba.",
      "Add paneer. Simmer 5 min. Stir in cream at the end. Serve with makki roti or naan."
    ],
    tags: ["Indian", "Reddit Favourite", "Classic"], isHighProtein: true, isLowCarb: true,
  },
  {
    _id: "16",
    name: "Harissa Chickpea Stew",
    description: "The NYT Cooking / Ottolenghi-style dish that food Reddit wouldn't stop talking about. One pan, 25 minutes, restaurant-quality North African flavours.",
    image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&h=400&fit=crop&q=80",
    calories: 340, protein: 16, carbs: 48, fat: 11, fiber: 14, prepTime: 25,
    ingredients: ["2 cans chickpeas, drained", "3 tbsp harissa paste", "1 can crushed tomatoes", "1 onion, diced", "4 garlic cloves, sliced", "1 tsp cumin", "1 tsp smoked paprika", "200g baby spinach", "Juice of 1 lemon", "Greek yogurt, olive oil and mint to serve"],
    instructions: [
      "Heat olive oil in a wide pan. Fry onion until golden and soft, 8 min.",
      "Add garlic slices. Cook 1 min. Add harissa paste — fry it for 2 min to cook out the raw edge.",
      "Add cumin and smoked paprika. Stir 30 seconds.",
      "Add chickpeas and crushed tomatoes. Season well. Simmer 12-15 min until thickened.",
      "Stir in spinach until just wilted. Add lemon juice.",
      "Serve in bowls with a big spoonful of cold yogurt in the centre, a drizzle of good olive oil, fresh mint.",
      "Eat with flatbread or crusty bread. The yogurt is not optional."
    ],
    tags: ["NYT Cooking", "Middle Eastern", "One Pan"], isHighProtein: false, isLowCarb: false,
  },
  {
    _id: "17",
    name: "Japanese Matcha Chia Pudding",
    description: "The health food Instagram staple that actually delivers. Ceremonial grade matcha + coconut milk base is rich and earthy. Prep tonight, eat tomorrow.",
    image: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&h=400&fit=crop&q=80",
    calories: 260, protein: 8, carbs: 24, fat: 14, fiber: 11, prepTime: 5,
    ingredients: ["3 tbsp chia seeds", "1 cup full-fat coconut milk", "½ cup oat milk", "1.5 tsp ceremonial grade matcha", "2 tsp maple syrup", "Toppings: mango, kiwi, granola, honey, coconut flakes"],
    instructions: [
      "Sift matcha into a small bowl. Add 2 tbsp of warm (not boiling) oat milk and whisk until a smooth paste with no lumps.",
      "Mix coconut milk, remaining oat milk, maple syrup, and matcha paste in a jar.",
      "Add chia seeds. Stir vigorously for 2 minutes.",
      "Refrigerate 30 min, then stir again (breaks up any clumps at the bottom).",
      "Refrigerate overnight — minimum 4 hours.",
      "In the morning, the texture should be thick, creamy and hold its shape.",
      "Layer with mango, kiwi slices, granola and honey. Eat cold."
    ],
    tags: ["Japanese", "Instagram", "Breakfast", "Vegan"], isHighProtein: false, isLowCarb: false,
  },
  {
    _id: "18",
    name: "Dalgona Whipped Coffee Oats",
    description: "The 2020 lockdown viral recipe meets the 2023 protein oat trend. Whipped coffee foam on cold milk oats. Looks absurdly good and tastes even better.",
    image: "https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=600&h=400&fit=crop&q=80",
    calories: 380, protein: 14, carbs: 54, fat: 10, fiber: 6, prepTime: 10,
    ingredients: ["½ cup rolled oats", "1 cup cold oat milk", "2 tbsp instant coffee", "2 tbsp sugar", "2 tbsp hot water", "1 tsp vanilla", "Banana, cacao nibs, granola to top"],
    instructions: [
      "Night before: soak oats in oat milk with vanilla. Refrigerate.",
      "Morning: whip instant coffee, sugar, and hot water with an electric whisk or by hand for 3-4 min until it becomes a thick, glossy foam. It should triple in volume.",
      "Stir the overnight oats. If too thick, add a splash of milk.",
      "Layer into a glass: oats first, then sliced banana, then spoon the coffee foam generously on top.",
      "The foam should be thick enough to sit on top, not sink in.",
      "Add granola and cacao nibs for texture.",
      "Stir it all together before eating to get the coffee-caramel swirl through the oats."
    ],
    tags: ["TikTok Viral", "Breakfast", "Korean Trend"], isHighProtein: false, isLowCarb: false,
  },
  {
    _id: "19",
    name: "Crispy Smashed Potatoes",
    description: "The side dish that got more saves than any main on food Instagram. Baby potatoes boiled, smashed flat, then roasted until insanely crispy. Serve with herb yogurt.",
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&h=400&fit=crop&q=80",
    calories: 280, protein: 6, carbs: 40, fat: 12, fiber: 4, prepTime: 45,
    ingredients: ["600g baby potatoes", "4 tbsp olive oil", "4 garlic cloves, minced", "1 tsp dried rosemary", "1 tsp smoked paprika", "Salt & pepper", "For herb yogurt: 1 cup Greek yogurt, 2 tbsp fresh herbs, 1 garlic clove, lemon"],
    instructions: [
      "Boil potatoes in well-salted water until completely tender, about 20 min. Drain.",
      "Transfer to a lined baking sheet. Let steam dry 5 min.",
      "Smash each potato flat with a glass or heavy spoon — you want them about 1cm thick.",
      "Drizzle generously with olive oil. Scatter garlic, rosemary, paprika. Season heavily.",
      "Roast at 220°C / 425°F for 25-30 min until edges are dark, crispy and shatteringly crunchy.",
      "Mix yogurt with chopped herbs, minced garlic, lemon juice and salt.",
      "Serve potatoes straight from the oven on the herb yogurt. Do not refrigerate — they lose the crunch."
    ],
    tags: ["Instagram Viral", "Side", "Comfort"], isHighProtein: false, isLowCarb: false,
  },
  {
    _id: "20",
    name: "Cottage Cheese Toast",
    description: "2024's biggest TikTok health trend. Whipped cottage cheese on toast is high protein, creamy, and infinitely customisable. The new avocado toast — and actually more nutritious.",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop&q=80",
    calories: 290, protein: 24, carbs: 26, fat: 9, fiber: 3, prepTime: 8,
    ingredients: ["4 tbsp full-fat cottage cheese", "2 slices sourdough or whole grain bread", "For savoury version: everything bagel seasoning, cucumber, smoked paprika, chilli flakes", "For sweet version: honey, banana slices, cinnamon, chia seeds, berries"],
    instructions: [
      "Toast bread until golden and sturdy — it needs to hold the topping.",
      "Blend cottage cheese in a small blender or with a hand blender for 30 seconds until completely smooth and creamy.",
      "Spread a thick layer on toast — be generous.",
      "SAVOURY: top with sliced cucumber, a heavy sprinkle of everything bagel seasoning, smoked paprika, and chilli flakes.",
      "SWEET: drizzle honey, lay banana slices, dust with cinnamon, scatter chia seeds and fresh berries.",
      "Eat immediately. The contrast of crunchy toast and creamy whipped cottage cheese is the whole point.",
      "Pro tip: add a soft-boiled egg on the savoury version for 30g+ protein."
    ],
    tags: ["TikTok 2024", "Breakfast", "High Protein"], isHighProtein: true, isLowCarb: false,
  },
];

const VIRAL_TAGS = ["TikTok Viral", "TikTok", "TikTok 2024", "Reddit Viral", "Reddit Favourite", "Instagram", "Instagram Viral", "YouTube Classic", "NYT Cooking"];

export default function RecipesPage() {
  const [search, setSearch] = useState("");
  const [highProtein, setHighProtein] = useState(false);
  const [lowCarb, setLowCarb] = useState(false);
  const [viralOnly, setViralOnly] = useState(false);

  const filtered = SAMPLE_MEALS.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q));
    const matchesProtein = !highProtein || m.isHighProtein;
    const matchesCarb    = !lowCarb    || m.isLowCarb;
    const matchesViral   = !viralOnly  || m.tags.some((t) => VIRAL_TAGS.includes(t));
    return matchesSearch && matchesProtein && matchesCarb && matchesViral;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-widest text-emerald-500 uppercase mb-2">Recipe Browser</p>
        <h1 className="text-3xl font-bold text-white tracking-tight">Recipes people actually make.</h1>
        <p className="text-zinc-500 mt-1">
          Viral hits from TikTok, Instagram, Reddit & YouTube — all vegetarian, all tried and tested.
          Tap any card to flip for the full recipe.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            placeholder="Search recipes, cuisines, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-white/[0.1] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-[#141414] text-zinc-200 placeholder-zinc-600"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-zinc-600" />
          <FilterChip label="🔥 Viral Only" active={viralOnly}      onClick={() => setViralOnly((p) => !p)} />
          <FilterChip label="💪 High Protein" active={highProtein}  onClick={() => setHighProtein((p) => !p)} />
          <FilterChip label="🥬 Low Carb"     active={lowCarb}      onClick={() => setLowCarb((p) => !p)} />
        </div>
      </div>

      <p className="text-xs text-zinc-600">{filtered.length} recipe{filtered.length !== 1 ? "s" : ""} found</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length > 0 ? (
          filtered.map((meal) => <FlipCard key={meal._id} meal={meal} />)
        ) : (
          <div className="col-span-full text-center py-16 text-zinc-600">No recipes match your filters.</div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
        active
          ? "bg-emerald-600 text-white border-emerald-600"
          : "bg-white/[0.04] text-zinc-400 border-white/[0.1] hover:border-white/[0.2] hover:text-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}
