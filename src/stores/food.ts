import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Ingredient, Recipe } from '@/types'
import ingredientsData from '@/data/ingredients_master.json'
import recipesData from '@/data/recipes.json'

export const useFoodStore = defineStore('food', () => {
    const ingredients = ref<Ingredient[]>(ingredientsData as Ingredient[])
    const recipes = ref<Recipe[]>(recipesData as Recipe[])

    const getIngredientById = (id: string): Ingredient | undefined => {
        return ingredients.value.find(i => i.id === id)
    }

    const getRecipesByMonthRange = (month: number): Recipe[] => {
        return recipes.value.filter(r => r.min_month <= month && r.max_month >= month)
    }

    const getIngredientsByCategory = (category: string): Ingredient[] => {
        return ingredients.value.filter(i => i.category === category)
    }

    return {
        ingredients,
        recipes,
        getIngredientById,
        getRecipesByMonthRange,
        getIngredientsByCategory,
    }
})
