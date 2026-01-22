import { defineStore } from 'pinia';
import { ref } from 'vue';
import ingredientsData from '@/data/ingredients_master.json';
import recipesData from '@/data/recipes.json';
export const useFoodStore = defineStore('food', () => {
    const ingredients = ref(ingredientsData);
    const recipes = ref(recipesData);
    const getIngredientById = (id) => {
        return ingredients.value.find(i => i.id === id);
    };
    const getRecipesByMonthRange = (month) => {
        return recipes.value.filter(r => r.min_month <= month && r.max_month >= month);
    };
    const getIngredientsByCategory = (category) => {
        return ingredients.value.filter(i => i.category === category);
    };
    return {
        ingredients,
        recipes,
        getIngredientById,
        getRecipesByMonthRange,
        getIngredientsByCategory,
    };
});
//# sourceMappingURL=food.js.map