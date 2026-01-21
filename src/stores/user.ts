import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

/**
 * 食材狀態介面
 */
export interface IngredientState {
    /** 是否已嘗試 */
    status: 'not_tried' | 'tried'
    /** 是否過敏 */
    allergy: boolean
    /** 喜好程度 */
    preference: 'love' | 'neutral' | 'dislike' | null
    /** 備註 */
    note: string
}

const STORAGE_KEY = 'babymeal-passport-user'

/**
 * 從 LocalStorage 載入資料
 */
function loadFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            return JSON.parse(saved)
        }
    } catch (e) {
        console.error('Failed to load from localStorage:', e)
    }
    return null
}

/**
 * 儲存資料到 LocalStorage
 */
function saveToStorage(data: {
    babyName: string
    birthday: string
    ingredientStates: Record<string, IngredientState>
    favoriteRecipes: string[]
}) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
        console.error('Failed to save to localStorage:', e)
    }
}

export const useUserStore = defineStore('user', () => {
    // 從 LocalStorage 載入初始資料
    const savedData = loadFromStorage()

    // State
    const babyName = ref<string>(savedData?.babyName || '')
    const birthday = ref<string>(savedData?.birthday || '')
    const ingredientStates = ref<Record<string, IngredientState>>(
        savedData?.ingredientStates || {}
    )
    const favoriteRecipes = ref<Set<string>>(
        new Set(savedData?.favoriteRecipes || [])
    )

    // Getters
    const getAgeInMonths = computed(() => {
        if (!birthday.value) return 0

        const birthDate = new Date(birthday.value)
        const today = new Date()

        let months = (today.getFullYear() - birthDate.getFullYear()) * 12
        months += today.getMonth() - birthDate.getMonth()

        // 如果當月的日期還沒到生日，減一個月
        if (today.getDate() < birthDate.getDate()) {
            months--
        }

        return Math.max(0, months)
    })

    const getAgeDisplay = computed(() => {
        const months = getAgeInMonths.value
        if (months === 0) return '尚未設定'
        if (months < 12) return `${months} 個月`
        const years = Math.floor(months / 12)
        const remainingMonths = months % 12
        if (remainingMonths === 0) return `${years} 歲`
        return `${years} 歲 ${remainingMonths} 個月`
    })

    const triedIngredientsCount = computed(() => {
        return Object.values(ingredientStates.value).filter(
            (state) => state.status === 'tried'
        ).length
    })

    const allergyIngredientsCount = computed(() => {
        return Object.values(ingredientStates.value).filter(
            (state) => state.allergy
        ).length
    })

    // Actions
    function setBabyInfo(name: string, birth: string) {
        babyName.value = name
        birthday.value = birth
    }

    function updateIngredientState(
        ingredientId: string,
        updates: Partial<IngredientState>
    ) {
        const currentState = ingredientStates.value[ingredientId] || {
            status: 'not_tried',
            allergy: false,
            preference: null,
            note: '',
        }

        ingredientStates.value[ingredientId] = {
            ...currentState,
            ...updates,
        }
    }

    function getIngredientState(ingredientId: string): IngredientState {
        return (
            ingredientStates.value[ingredientId] || {
                status: 'not_tried',
                allergy: false,
                preference: null,
                note: '',
            }
        )
    }

    function resetIngredientState(ingredientId: string) {
        delete ingredientStates.value[ingredientId]
    }

    // Favorites Actions
    function toggleFavoriteRecipe(recipeId: string) {
        if (favoriteRecipes.value.has(recipeId)) {
            favoriteRecipes.value.delete(recipeId)
        } else {
            favoriteRecipes.value.add(recipeId)
        }
        favoriteRecipes.value = new Set(favoriteRecipes.value)
    }

    function isFavoriteRecipe(recipeId: string): boolean {
        return favoriteRecipes.value.has(recipeId)
    }

    // 監聽變化並自動儲存到 LocalStorage
    watch(
        [babyName, birthday, ingredientStates, favoriteRecipes],
        () => {
            saveToStorage({
                babyName: babyName.value,
                birthday: birthday.value,
                ingredientStates: ingredientStates.value,
                favoriteRecipes: [...favoriteRecipes.value],
            })
        },
        { deep: true }
    )

    return {
        // State
        babyName,
        birthday,
        ingredientStates,
        favoriteRecipes,

        // Getters
        getAgeInMonths,
        getAgeDisplay,
        triedIngredientsCount,
        allergyIngredientsCount,

        // Actions
        setBabyInfo,
        updateIngredientState,
        getIngredientState,
        resetIngredientState,
        toggleFavoriteRecipe,
        isFavoriteRecipe,
    }
})
