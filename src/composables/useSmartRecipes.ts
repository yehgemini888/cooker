import { computed } from 'vue'
import { useFoodStore } from '@/stores/food'
import { useUserStore } from '@/stores/user'
import { usePantryStore } from '@/stores/pantry'
import type { Recipe } from '@/types'

/**
 * 食譜評分結果介面
 */
export interface ScoredRecipe {
    recipe: Recipe
    score: number
    isAgeAppropriate: boolean
    hasAllergyIngredients: boolean
    allergyIngredients: string[]
    availableIngredients: string[]
    missingIngredients: string[]
    readyToCook: boolean
    lovedIngredients: string[]
}

/**
 * 智慧食譜排序 Composable
 */
export function useSmartRecipes() {
    const foodStore = useFoodStore()
    const userStore = useUserStore()
    const pantryStore = usePantryStore()

    /**
     * 取得食材名稱
     */
    const getIngredientName = (id: string): string => {
        const ingredient = foodStore.getIngredientById(id)
        return ingredient?.name || id
    }

    /**
     * 計算單一食譜的分數與狀態
     */
    const scoreRecipe = (recipe: Recipe): ScoredRecipe => {
        const babyAgeMonths = userStore.getAgeInMonths

        // 檢查是否符合月齡
        const isAgeAppropriate =
            babyAgeMonths >= recipe.min_month && babyAgeMonths <= recipe.max_month

        // 檢查過敏食材
        const allergyIngredients: string[] = []
        recipe.ingredient_ids.forEach((id) => {
            const state = userStore.getIngredientState(id)
            if (state.allergy) {
                allergyIngredients.push(getIngredientName(id))
            }
        })
        const hasAllergyIngredients = allergyIngredients.length > 0

        // 檢查冰箱庫存
        const availableIngredients: string[] = []
        const missingIngredients: string[] = []
        recipe.ingredient_ids.forEach((id) => {
            if (pantryStore.hasItem(id)) {
                availableIngredients.push(getIngredientName(id))
            } else {
                missingIngredients.push(getIngredientName(id))
            }
        })
        const readyToCook = missingIngredients.length === 0

        // 檢查寶寶喜歡的食材
        const lovedIngredients: string[] = []
        recipe.ingredient_ids.forEach((id) => {
            const state = userStore.getIngredientState(id)
            if (state.preference === 'love') {
                lovedIngredients.push(getIngredientName(id))
            }
        })

        // 計算分數
        let score = 0

        // +100 分: 食材冰箱全都有 (Ready to Cook)
        if (readyToCook) {
            score += 100
        }
        // +50 分: 冰箱有部分食材 (至少有一個)
        else if (availableIngredients.length > 0) {
            const ratio = availableIngredients.length / recipe.ingredient_ids.length
            score += Math.floor(50 * ratio)
        }

        // +10 分: 每個寶寶喜歡的食材
        score += lovedIngredients.length * 10

        // 符合月齡加分
        if (isAgeAppropriate) {
            score += 20
        }

        // 過敏食材扣分
        if (hasAllergyIngredients) {
            score -= 200
        }

        return {
            recipe,
            score,
            isAgeAppropriate,
            hasAllergyIngredients,
            allergyIngredients,
            availableIngredients,
            missingIngredients,
            readyToCook,
            lovedIngredients,
        }
    }

    /**
     * 取得所有評分後的食譜 (排序後)
     */
    const scoredRecipes = computed<ScoredRecipe[]>(() => {
        return foodStore.recipes
            .map((recipe) => scoreRecipe(recipe))
            .sort((a, b) => b.score - a.score)
    })

    /**
     * 取得符合月齡的食譜
     */
    const ageAppropriateRecipes = computed<ScoredRecipe[]>(() => {
        return scoredRecipes.value.filter((sr) => sr.isAgeAppropriate)
    })

    /**
     * 取得無過敏風險的食譜
     */
    const safeRecipes = computed<ScoredRecipe[]>(() => {
        return scoredRecipes.value.filter((sr) => !sr.hasAllergyIngredients)
    })

    /**
     * 取得可立即製作的食譜
     */
    const readyToCookRecipes = computed<ScoredRecipe[]>(() => {
        return scoredRecipes.value.filter((sr) => sr.readyToCook && sr.isAgeAppropriate)
    })

    /**
     * 智慧推薦 (符合月齡 + 無過敏)
     */
    const recommendedRecipes = computed<ScoredRecipe[]>(() => {
        return scoredRecipes.value.filter(
            (sr) => sr.isAgeAppropriate && !sr.hasAllergyIngredients
        )
    })

    return {
        scoredRecipes,
        ageAppropriateRecipes,
        safeRecipes,
        readyToCookRecipes,
        recommendedRecipes,
        scoreRecipe,
        getIngredientName,
    }
}
