// =====================================================================
// SEED DATA — starter food list for the gym. NOT verified nutrition data.
//
// Values are written per 100 g (as the reference databases list them) and
// converted to per-serving numbers by scripts/build-seed-sql.ts.
//
// Sources:
//  - "USDA FDC (SR Legacy)": single ingredients, values as recalled from
//    USDA FoodData Central SR Legacy entries.
//  - "IFCT 2017": Indian Food Composition Tables (NIN, 2017).
//  - "Recipe estimate": cooked Indian dishes. Neither database lists home
//    recipes; these are estimates from IFCT 2017 ingredients with a typical
//    home recipe (little oil). Real values vary with the recipe.
//
// EVERY row is verified = false: the numbers were not checked against the
// source databases while building this app. Staff should check each food
// and tick "verified" in the Food list once it is checked.
//
// price_inr = rough ₹ per serving (2026 estimate), used only to prefer
// cheaper foods when a member has a daily budget. Edit freely.
// =====================================================================
import type { AllergenTag, DietType, FoodCategory, FoodRole } from "../src/lib/types";

export interface SeedFood {
  name: string;
  category: FoodCategory;
  diet_type: DietType;
  serving_size_g: number;
  serving_desc: string;
  /** per 100 g: kcal, protein, carbs, fat, fibre */
  per100: [number, number, number, number, number];
  roles: FoodRole[];
  allergens: AllergenTag[];
  price_inr: number;
  source: string;
}

const USDA = "USDA FDC (SR Legacy)";
const IFCT = "IFCT 2017";
const RECIPE = "Recipe estimate (IFCT 2017 ingredients)";

function f(
  name: string, category: FoodCategory, diet_type: DietType, serving_size_g: number, serving_desc: string,
  per100: SeedFood["per100"], roles: FoodRole[], allergens: AllergenTag[], price_inr: number, source: string,
): SeedFood {
  return { name, category, diet_type, serving_size_g, serving_desc, per100, roles, allergens, price_inr, source };
}

export const SEED_FOODS: SeedFood[] = [
  // ---------------- grains / staples
  f("Roti (whole wheat, no ghee)", "grains", "vegan", 40, "1 medium roti", [264, 8.9, 50, 2.5, 7], ["staple"], ["gluten"], 4, RECIPE),
  f("Rice, white, cooked", "grains", "vegan", 100, "½ katori (100 g cooked)", [130, 2.7, 28.2, 0.3, 0.4], ["staple"], [], 3, USDA),
  f("Brown rice, cooked", "grains", "vegan", 100, "½ katori (100 g cooked)", [123, 2.7, 25.6, 1, 1.6], ["staple"], [], 5, USDA),
  f("Whole wheat bread", "grains", "vegan", 50, "2 slices", [252, 12.4, 42.7, 3.5, 6], ["quick_carb"], ["gluten"], 6, USDA),
  f("Jowar roti", "grains", "vegan", 50, "1 roti", [239, 7, 47, 2.5, 5.5], ["staple"], [], 5, RECIPE),
  f("Bajra roti", "grains", "vegan", 50, "1 roti", [256, 7.5, 47, 4.5, 6], ["staple"], [], 5, RECIPE),
  f("Vegetable pulao", "grains", "vegan", 100, "½ katori", [150, 3, 25, 4, 1.5], [], [], 8, RECIPE),
  f("Moong dal khichdi", "grains", "vegan", 150, "1 katori", [120, 4.5, 20, 2.5, 2], ["main_dish"], [], 10, RECIPE),

  // ---------------- breakfast dishes
  f("Oats, cooked in water", "breakfast", "vegan", 200, "1 bowl (40 g dry oats)", [71, 2.5, 12, 1.5, 1.7], ["breakfast_main"], ["gluten"], 8, USDA),
  f("Dalia (broken wheat), cooked", "breakfast", "vegan", 150, "1 bowl", [83, 3.1, 18.6, 0.2, 4.5], ["breakfast_main"], ["gluten"], 5, USDA),
  f("Poha", "breakfast", "vegan", 150, "1 plate (made without groundnuts)",[158, 3, 27, 4, 1.5], ["breakfast_main"], [], 10, RECIPE),
  f("Upma (rava)", "breakfast", "vegan", 150, "1 plate", [150, 3.5, 22, 5, 1.5], ["breakfast_main"], ["gluten"], 10, RECIPE),
  f("Idli", "breakfast", "vegan", 80, "2 idli", [132, 4, 27, 0.6, 1.5], ["breakfast_main"], [], 10, RECIPE),
  f("Plain dosa", "breakfast", "vegan", 80, "1 dosa", [168, 3.9, 29, 3.7, 1], ["breakfast_main"], [], 15, RECIPE),
  f("Vegetable uttapam", "breakfast", "vegan", 120, "1 uttapam", [160, 4, 27, 4, 2], ["breakfast_main"], [], 20, RECIPE),
  f("Besan chilla", "breakfast", "vegan", 100, "2 small chilla", [190, 9.5, 22, 7, 4], ["breakfast_main"], [], 10, RECIPE),
  f("Moong dal chilla", "breakfast", "vegan", 100, "2 small chilla", [170, 10, 20, 5.5, 3.5], ["breakfast_main"], [], 12, RECIPE),
  f("Vegetable sandwich (no butter/cheese)", "breakfast", "vegan", 120, "1 sandwich", [190, 6.5, 30, 5, 4], ["breakfast_main"], ["gluten"], 20, RECIPE),
  f("Methi thepla", "breakfast", "vegan", 60, "2 thepla", [260, 7.5, 36, 9.5, 5], ["breakfast_main"], ["gluten"], 10, RECIPE),
  f("Aloo paratha", "breakfast", "vegetarian", 100, "1 paratha", [260, 5.5, 34, 11.5, 3.5], ["breakfast_main"], ["gluten", "milk"], 15, RECIPE),
  f("Dhokla", "breakfast", "vegan", 100, "3 pieces", [160, 6.5, 22, 5, 2], ["breakfast_main", "snack"], [], 15, RECIPE),
  f("Muesli (no added sugar)", "breakfast", "vegan", 40, "4 tbsp", [360, 10, 66, 6, 8], ["breakfast_main"], ["gluten", "tree_nut"], 15, USDA),

  // ---------------- pulses / dals
  f("Toor dal, cooked", "pulses", "vegan", 150, "1 katori", [115, 6.8, 16, 2.6, 4], ["main_dish"], [], 10, RECIPE),
  f("Moong dal, cooked", "pulses", "vegan", 150, "1 katori", [105, 7, 15, 2, 4], ["main_dish"], [], 10, RECIPE),
  f("Masoor dal, cooked", "pulses", "vegan", 150, "1 katori", [130, 8.5, 19, 2.5, 7], ["main_dish"], [], 10, RECIPE),
  f("Chana dal, cooked", "pulses", "vegan", 150, "1 katori", [140, 8, 20, 3, 6], ["main_dish"], [], 10, RECIPE),
  f("Rajma curry", "pulses", "vegan", 150, "1 katori", [140, 7, 19, 4, 6], ["main_dish"], [], 15, RECIPE),
  f("Chole (chickpea curry)", "pulses", "vegan", 150, "1 katori", [160, 7.5, 21, 5.5, 6.5], ["main_dish"], [], 15, RECIPE),
  f("Lobia (black-eyed pea) curry", "pulses", "vegan", 150, "1 katori", [130, 7, 18, 3.5, 5], ["main_dish"], [], 12, RECIPE),
  f("Sambar", "pulses", "vegan", 200, "1 big katori", [70, 3.5, 9.5, 2, 2.5], ["main_dish"], [], 10, RECIPE),
  f("Kadhi", "pulses", "vegetarian", 200, "1 big katori", [85, 3.5, 7, 4.8, 0.8], ["main_dish"], ["milk"], 10, RECIPE),
  f("Dal makhani", "pulses", "vegetarian", 150, "1 katori", [150, 6, 15, 7.5, 4.5], ["main_dish"], ["milk"], 25, RECIPE),
  f("Kala chana, boiled", "pulses", "vegan", 100, "1 small bowl", [164, 8.9, 27.4, 2.6, 7.6], ["snack", "protein_snack"], [], 6, USDA),
  f("Sprouted moong salad", "pulses", "vegan", 100, "1 small bowl", [100, 7.5, 16, 0.5, 4.5], ["snack", "protein_side", "protein_snack"], [], 8, RECIPE),
  f("Roasted chana", "pulses", "vegan", 30, "1 handful", [369, 19, 58, 6, 17], ["snack", "protein_snack"], [], 5, IFCT),

  // ---------------- soy
  f("Soya chunks curry", "soy", "vegan", 150, "1 katori", [120, 12, 8.5, 4, 3], ["main_dish"], ["soy"], 12, RECIPE),
  f("Soya chunks, boiled", "soy", "vegan", 100, "1 bowl (about 30 g dry)", [115, 17, 11, 0.2, 4.3], ["protein_side", "protein_snack"], ["soy"], 8, RECIPE),
  f("Tofu, firm, plain", "soy", "vegan", 100, "100 g block", [144, 17.3, 2.8, 8.7, 2.3], ["protein_side", "protein_snack"], ["soy"], 30, USDA),
  f("Tofu bhurji", "soy", "vegan", 150, "1 katori", [130, 11, 5, 7.5, 1.5], ["main_dish"], ["soy"], 35, RECIPE),
  f("Soy milk, unsweetened", "soy", "vegan", 250, "1 glass (250 ml)", [33, 2.9, 1.7, 1.6, 0.4], ["protein_side", "protein_snack"], ["soy"], 30, USDA),

  // ---------------- dairy
  f("Milk, toned (3% fat)", "dairy", "vegetarian", 250, "1 glass (250 ml)", [58, 3.2, 4.7, 3, 0], ["protein_side", "protein_snack"], ["milk"], 15, IFCT),
  f("Milk, double toned (1.5% fat)", "dairy", "vegetarian", 250, "1 glass (250 ml)", [45, 3.2, 4.8, 1.5, 0], ["protein_side", "protein_snack"], ["milk"], 13, IFCT),
  f("Curd (dahi)", "dairy", "vegetarian", 150, "1 katori", [60, 3.5, 4.5, 3.1, 0], ["side", "protein_side", "protein_snack"], ["milk"], 12, IFCT),
  f("Greek yogurt, plain, low fat", "dairy", "vegetarian", 100, "1 small cup", [59, 10.2, 3.6, 0.4, 0], ["protein_side", "protein_snack"], ["milk"], 40, USDA),
  f("Paneer", "dairy", "vegetarian", 50, "50 g (about 4 cubes)", [265, 18.3, 1.2, 20.8, 0], ["protein_side", "protein_snack"], ["milk"], 22, IFCT),
  f("Paneer, low fat", "dairy", "vegetarian", 50, "50 g (about 4 cubes)", [200, 24, 5, 9.5, 0], ["protein_side", "protein_snack"], ["milk"], 25, RECIPE),
  f("Paneer bhurji", "dairy", "vegetarian", 150, "1 katori", [190, 13, 6, 12.5, 1.5], ["main_dish"], ["milk"], 45, RECIPE),
  f("Whey protein, 1 scoop in water", "dairy", "vegetarian", 30, "1 scoop (30 g)", [400, 78, 10, 5.5, 0], [], ["milk"], 60, "Typical label (check your brand)"),
  f("Palak paneer", "dairy", "vegetarian", 150, "1 katori", [150, 7, 6, 11, 2], ["main_dish"], ["milk"], 35, RECIPE),
  f("Paneer tikka", "dairy", "vegetarian", 100, "5-6 pieces", [220, 15, 6, 15, 1], ["main_dish"], ["milk"], 45, RECIPE),
  f("Buttermilk (chaas)", "beverages", "vegetarian", 250, "1 glass", [25, 1.5, 2.5, 1, 0], ["side"], ["milk"], 5, RECIPE),
  f("Cucumber raita", "dairy", "vegetarian", 100, "1 small katori", [60, 3, 5, 3, 0.5], ["side"], ["milk"], 10, RECIPE),

  // ---------------- eggs
  f("Boiled egg", "eggs", "eggetarian", 50, "1 large egg", [155, 12.6, 1.1, 10.6, 0], ["protein_side", "protein_snack"], ["egg"], 7, USDA),
  f("Egg whites, boiled", "eggs", "eggetarian", 99, "3 egg whites", [52, 10.9, 0.7, 0.2, 0], ["protein_side", "protein_snack"], ["egg"], 21, USDA),
  f("Egg bhurji", "eggs", "eggetarian", 100, "2 eggs", [175, 11, 2.5, 13.5, 0.3], ["breakfast_main"], ["egg"], 18, RECIPE),
  f("Vegetable omelette (2 eggs)", "eggs", "eggetarian", 120, "1 omelette", [155, 10.5, 2, 11.7, 0.5], ["breakfast_main"], ["egg"], 18, RECIPE),
  f("Egg curry", "eggs", "eggetarian", 150, "2 eggs with gravy", [140, 8, 4.5, 10, 1], ["main_dish"], ["egg"], 25, RECIPE),

  // ---------------- meat & fish
  f("Chicken breast, cooked, skinless", "meat", "non_vegetarian", 100, "100 g", [165, 31, 0, 3.6, 0], ["main_dish", "protein_side", "protein_snack"], [], 30, USDA),
  f("Chicken curry (home style)", "meat", "non_vegetarian", 150, "1 katori", [150, 15, 4, 8.5, 1], ["main_dish"], [], 40, RECIPE),
  f("Chicken tikka", "meat", "non_vegetarian", 100, "5-6 pieces", [165, 25, 3, 6, 0.5], ["main_dish", "protein_snack"], ["milk"], 50, RECIPE),
  f("Mutton curry", "meat", "non_vegetarian", 150, "1 katori", [200, 16, 4, 13.5, 1], ["main_dish"], [], 80, RECIPE),
  f("Fish curry (rohu)", "fish", "non_vegetarian", 150, "1 katori", [120, 13, 3.5, 6, 0.5], ["main_dish"], ["fish"], 40, RECIPE),
  f("Fish fillet, grilled", "fish", "non_vegetarian", 100, "100 g", [130, 22, 0, 4.5, 0], ["main_dish", "protein_snack"], ["fish"], 40, RECIPE),
  f("Prawn curry", "fish", "non_vegetarian", 150, "1 katori", [110, 14, 4, 4, 0.5], ["main_dish"], ["shellfish"], 60, RECIPE),

  // ---------------- vegetables
  f("Mixed vegetable sabzi", "vegetables", "vegan", 100, "1 katori", [85, 2.5, 9, 4.5, 3], ["vegetable"], [], 10, RECIPE),
  f("Bhindi (okra) sabzi", "vegetables", "vegan", 100, "1 katori", [95, 2.2, 8.5, 6, 3.5], ["vegetable"], [], 10, RECIPE),
  f("Palak (spinach) sabzi", "vegetables", "vegan", 100, "1 katori", [70, 3, 5.5, 4.2, 2.5], ["vegetable"], [], 10, RECIPE),
  f("Cabbage sabzi", "vegetables", "vegan", 100, "1 katori", [65, 1.7, 7.5, 3.5, 2.5], ["vegetable"], [], 8, RECIPE),
  f("Lauki (bottle gourd) sabzi", "vegetables", "vegan", 100, "1 katori", [50, 1, 5, 3, 1.5], ["vegetable"], [], 8, RECIPE),
  f("Aloo gobi", "vegetables", "vegan", 100, "1 katori", [100, 2.5, 12, 5, 2.5], ["vegetable"], [], 10, RECIPE),
  f("Baingan bharta", "vegetables", "vegan", 100, "1 katori", [85, 2, 8, 5.5, 3.5], ["vegetable"], [], 10, RECIPE),
  f("French beans sabzi", "vegetables", "vegan", 100, "1 katori", [75, 2, 7, 4.5, 3], ["vegetable"], [], 10, RECIPE),
  f("Mushroom sabzi", "vegetables", "vegan", 100, "1 katori", [80, 3, 5.5, 5.5, 1.8], ["vegetable"], [], 20, RECIPE),
  f("Green salad (cucumber, tomato, onion, carrot)", "vegetables", "vegan", 100, "1 plate", [25, 1, 5, 0.2, 1.5], ["vegetable", "side"], [], 8, RECIPE),
  f("Sweet potato, boiled", "vegetables", "vegan", 100, "1 small", [76, 1.4, 17.7, 0.1, 2.5], ["quick_carb", "snack"], [], 6, USDA),
  f("Potato, boiled", "vegetables", "vegan", 100, "1 medium", [87, 1.9, 20, 0.1, 1.8], ["quick_carb"], [], 4, USDA),

  // ---------------- fruits
  f("Banana", "fruits", "vegan", 100, "1 medium (peeled)", [89, 1.1, 22.8, 0.3, 2.6], ["fruit", "quick_carb"], [], 6, USDA),
  f("Apple", "fruits", "vegan", 150, "1 medium", [52, 0.3, 13.8, 0.2, 2.4], ["fruit"], [], 20, USDA),
  f("Papaya", "fruits", "vegan", 150, "1 bowl", [43, 0.5, 10.8, 0.3, 1.7], ["fruit"], [], 10, USDA),
  f("Guava", "fruits", "vegan", 100, "1 medium", [68, 2.6, 14.3, 1, 5.4], ["fruit"], [], 8, USDA),
  f("Orange", "fruits", "vegan", 130, "1 medium", [47, 0.9, 11.8, 0.1, 2.4], ["fruit"], [], 10, USDA),
  f("Watermelon", "fruits", "vegan", 200, "1 bowl", [30, 0.6, 7.6, 0.2, 0.4], ["fruit"], [], 8, USDA),
  f("Pomegranate", "fruits", "vegan", 100, "½ cup seeds", [83, 1.7, 18.7, 1.2, 4], ["fruit"], [], 25, USDA),
  f("Mango", "fruits", "vegan", 100, "½ medium", [60, 0.8, 15, 0.4, 1.6], ["fruit"], [], 15, USDA),
  f("Pear", "fruits", "vegan", 150, "1 medium", [57, 0.4, 15.2, 0.1, 3.1], ["fruit"], [], 20, USDA),
  f("Chikoo (sapota)", "fruits", "vegan", 100, "1 medium", [83, 0.4, 20, 1.1, 5.3], ["fruit", "quick_carb"], [], 10, USDA),
  f("Dates", "fruits", "vegan", 20, "2-3 dates", [282, 2.5, 75, 0.4, 8], ["quick_carb"], [], 8, USDA),
  f("Raisins", "fruits", "vegan", 20, "1 small handful", [299, 3.1, 79, 0.5, 3.7], ["quick_carb"], [], 5, USDA),

  // ---------------- nuts & seeds
  f("Peanuts, dry roasted", "nuts_seeds", "vegan", 25, "1 small handful", [585, 24, 21, 50, 8], ["snack"], ["peanut"], 4, USDA),
  f("Peanut butter (no sugar)", "nuts_seeds", "vegan", 16, "1 tablespoon", [588, 25, 20, 50, 6], ["protein_side"], ["peanut"], 8, USDA),
  f("Almonds", "nuts_seeds", "vegan", 20, "about 15 almonds", [579, 21, 22, 50, 12.5], ["snack"], ["tree_nut"], 20, USDA),
  f("Walnuts", "nuts_seeds", "vegan", 15, "4-5 halves", [654, 15, 14, 65, 6.7], ["snack"], ["tree_nut"], 25, USDA),
  f("Cashews", "nuts_seeds", "vegan", 20, "about 12 cashews", [553, 18, 30, 44, 3.3], ["snack"], ["tree_nut"], 20, USDA),
  f("Pumpkin seeds", "nuts_seeds", "vegan", 15, "1 tablespoon", [559, 30, 11, 49, 6], ["snack"], [], 12, USDA),
  f("Soybean, dry roasted", "soy", "vegan", 25, "1 small handful", [449, 39.6, 32.7, 21.6, 8.1], ["snack", "protein_snack"], ["soy"], 8, USDA),
  f("Makhana (roasted, plain)", "snacks", "vegan", 20, "1 bowl", [350, 9.7, 77, 0.1, 14.5], ["snack"], [], 10, IFCT),

  // ---------------- beverages / other
  f("Coconut water", "beverages", "vegan", 250, "1 glass", [19, 0.7, 3.7, 0.2, 1.1], ["quick_carb"], [], 40, USDA),
];
