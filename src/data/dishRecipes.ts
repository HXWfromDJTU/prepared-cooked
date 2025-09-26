import { DishRecipe, DishType, IngredientType } from '../types';

/**
 * 第五阶段：菜品配方数据系统
 * 定义3种不同复杂度的菜品配方
 */

export const DISH_RECIPES: DishRecipe[] = [
  // 简单菜品 (1种预制菜)
  {
    dishType: DishType.HUANG_MI_LIANGGAO,
    name: '黄米凉糕',
    ingredients: [IngredientType.HUANG_MI_GAOOU],
    complexity: 1,
    baseTime: 30, // 30秒制作时间
    difficulty: 'simple'
  },

  // 中等菜品 (2种预制菜)
  {
    dishType: DishType.FANQIE_NIUROU_FAN,
    name: '番茄牛腩饭',
    ingredients: [IngredientType.FANQIE_NIUROU, IngredientType.RICE],
    complexity: 2,
    baseTime: 45, // 45秒制作时间
    difficulty: 'medium'
  },

  // 困难菜品 (3种预制菜)
  {
    dishType: DishType.NIUDAGU_TAOCAN,
    name: '牛大骨套餐',
    ingredients: [IngredientType.BEEF_BONE, IngredientType.YOUMIAN_YUYU, IngredientType.GREEN_VEG],
    complexity: 3,
    baseTime: 60, // 60秒制作时间
    difficulty: 'hard'
  }
];

/**
 * 根据难度等级获取对应的菜品配方
 */
export function getRecipesByDifficulty(difficulty: 'simple' | 'medium' | 'hard'): DishRecipe[] {
  return DISH_RECIPES.filter(recipe => recipe.difficulty === difficulty);
}

/**
 * 根据菜品类型获取配方
 */
export function getRecipeByDishType(dishType: DishType): DishRecipe | undefined {
  return DISH_RECIPES.find(recipe => recipe.dishType === dishType);
}

/**
 * 获取所有可用的菜品配方
 */
export function getAllRecipes(): DishRecipe[] {
  return [...DISH_RECIPES];
}

/**
 * 根据难度获取随机菜品
 */
export function getRandomRecipeByDifficulty(difficulty: 'simple' | 'medium' | 'hard'): DishRecipe | undefined {
  const recipes = getRecipesByDifficulty(difficulty);
  if (recipes.length === 0) return undefined;

  const randomIndex = Math.floor(Math.random() * recipes.length);
  return recipes[randomIndex];
}