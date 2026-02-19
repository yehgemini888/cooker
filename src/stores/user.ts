import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

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

/**
 * 食譜評分類型
 */
export type RecipeRating = 'like' | 'normal' | 'dislike' | null

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
    recipeRatings: Record<string, RecipeRating>
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
    const recipeRatings = ref<Record<string, RecipeRating>>(
        savedData?.recipeRatings || {}
    )

    // 雲端同步狀態
    const isSyncing = ref(false)
    const lastSyncTime = ref<Date | null>(null)
    const syncError = ref<string | null>(null)

    // Baby Profile ID (從雲端載入)
    const babyProfileId = ref<string | null>(null)

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

    const likedRecipesCount = computed(() => {
        return Object.values(recipeRatings.value).filter(
            (rating) => rating === 'like'
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

    // Recipe Rating Actions
    function setRecipeRating(recipeId: string, rating: RecipeRating) {
        if (rating === null) {
            delete recipeRatings.value[recipeId]
        } else {
            recipeRatings.value[recipeId] = rating
        }
        // 觸發響應式更新
        recipeRatings.value = { ...recipeRatings.value }
    }

    function getRecipeRating(recipeId: string): RecipeRating {
        return recipeRatings.value[recipeId] || null
    }

    function isRecipeLiked(recipeId: string): boolean {
        return recipeRatings.value[recipeId] === 'like'
    }

    // ========== 雲端同步功能 ==========

    /**
     * 從雲端載入資料
     */
    async function loadFromCloud() {
        const authStore = useAuthStore()
        if (!authStore.user) {
            console.log('User not logged in, skipping cloud load')
            return
        }

        isSyncing.value = true
        syncError.value = null

        try {
            const userId = authStore.user.id

            // 1. 載入 Baby Profile
            const { data: babyProfile, error: babyError } = await supabase
                .from('baby_profiles')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .maybeSingle()

            if (babyError) throw babyError

            if (babyProfile) {
                const profile = babyProfile as any
                babyProfileId.value = profile.id
                babyName.value = profile.name
                birthday.value = profile.birthday

                // 2. 載入食材狀態
                const { data: ingredientData, error: ingredientError } = await supabase
                    .from('ingredient_states')
                    .select('*')
                    .eq('baby_id', profile.id)

                if (ingredientError) throw ingredientError

                if (ingredientData && ingredientData.length > 0) {
                    const newStates: Record<string, IngredientState> = {}
                    ingredientData.forEach((item: any) => {
                        newStates[item.ingredient_id] = {
                            status: item.status === 'not_tried' ? 'not_tried' : 'tried',
                            allergy: item.allergy,
                            preference:
                                item.status === 'loved'
                                    ? 'love'
                                    : item.status === 'disliked'
                                    ? 'dislike'
                                    : 'neutral',
                            note: item.note || '',
                        }
                    })
                    ingredientStates.value = newStates
                }

                // 3. 載入最愛食譜
                const { data: favoritesData, error: favoritesError } = await supabase
                    .from('favorite_recipes')
                    .select('recipe_id')
                    .eq('baby_id', profile.id)

                if (favoritesError) throw favoritesError

                if (favoritesData && favoritesData.length > 0) {
                    favoriteRecipes.value = new Set(favoritesData.map((f: any) => f.recipe_id))
                }

                // 4. 載入食譜評分
                const { data: ratingsData, error: ratingsError } = await supabase
                    .from('recipe_ratings')
                    .select('*')
                    .eq('baby_id', profile.id)

                if (ratingsError) throw ratingsError

                if (ratingsData && ratingsData.length > 0) {
                    const newRatings: Record<string, RecipeRating> = {}
                    ratingsData.forEach((item: any) => {
                        newRatings[item.recipe_id] = item.rating
                    })
                    recipeRatings.value = newRatings
                }

                lastSyncTime.value = new Date()
                console.log('✅ Cloud data loaded successfully')
            } else {
                // 如果雲端沒有資料，但本地有資料，詢問是否上傳
                const hasLocalData =
                    babyName.value || birthday.value || Object.keys(ingredientStates.value).length > 0

                if (hasLocalData) {
                    const shouldUpload = confirm(
                        '檢測到本地資料，是否上傳到雲端？\n（選擇「取消」將使用雲端資料覆蓋本地）'
                    )
                    if (shouldUpload) {
                        await syncToCloud()
                    }
                }
            }
        } catch (err: any) {
            console.error('Failed to load from cloud:', err)
            syncError.value = err.message
            // 失敗時繼續使用本地資料
        } finally {
            isSyncing.value = false
        }
    }

    /**
     * 同步到雲端
     */
    async function syncToCloud() {
        const authStore = useAuthStore()
        if (!authStore.user) {
            console.log('User not logged in, skipping cloud sync')
            return
        }

        isSyncing.value = true
        syncError.value = null

        try {
            const userId = authStore.user.id

            // 1. 確保 Baby Profile 存在
            let currentBabyId = babyProfileId.value

            if (!currentBabyId) {
                // 創建新的 Baby Profile
                const { data: newBaby, error: babyError } = await supabase
                    .from('baby_profiles')
                    .insert({
                        user_id: userId,
                        name: babyName.value || '我的寶寶',
                        birthday: birthday.value || new Date().toISOString().split('T')[0],
                        is_active: true,
                    } as any)
                    .select()
                    .single()

                if (babyError) throw babyError
                if (!newBaby) throw new Error('Failed to create baby profile')

                currentBabyId = (newBaby as any).id
                babyProfileId.value = currentBabyId
            } else {
                // 更新現有的 Baby Profile
                const updateData: any = {
                    name: babyName.value,
                    birthday: birthday.value,
                }
                // @ts-expect-error - Supabase generated types infer parameter as never
                await supabase.from('baby_profiles').update(updateData).eq('id', currentBabyId)
            }

            // 2. 同步食材狀態（使用 upsert）
            const ingredientRecords = Object.entries(ingredientStates.value).map(
                ([ingredientId, state]) => ({
                    baby_id: currentBabyId!,
                    ingredient_id: ingredientId,
                    status:
                        state.preference === 'love'
                            ? 'loved'
                            : state.preference === 'dislike'
                            ? 'disliked'
                            : state.status === 'tried'
                            ? 'tried'
                            : 'not_tried',
                    allergy: state.allergy,
                    preference:
                        state.preference === 'love'
                            ? 2
                            : state.preference === 'dislike'
                            ? 0
                            : 1,
                    note: state.note || null,
                })
            )

            if (ingredientRecords.length > 0) {
                await supabase
                    .from('ingredient_states')
                    .upsert(ingredientRecords as any, {
                        onConflict: 'baby_id,ingredient_id',
                        ignoreDuplicates: false,
                    })
            }

            // 3. 同步最愛食譜
            // 先刪除現有的
            if (currentBabyId) {
                await supabase
                    .from('favorite_recipes')
                    .delete()
                    .eq('baby_id', currentBabyId)
            }

            // 再插入新的
            const favoriteRecords = Array.from(favoriteRecipes.value).map((recipeId) => ({
                baby_id: currentBabyId!,
                recipe_id: recipeId,
            }))

            if (favoriteRecords.length > 0) {
                await supabase
                    .from('favorite_recipes')
                    .insert(favoriteRecords as any)
            }

            // 4. 同步食譜評分（使用 upsert）
            const ratingRecords = Object.entries(recipeRatings.value)
                .filter(([_, rating]) => rating !== null)
                .map(([recipeId, rating]) => ({
                    baby_id: currentBabyId!,
                    recipe_id: recipeId,
                    rating: rating as 'like' | 'normal' | 'dislike',
                }))

            if (ratingRecords.length > 0) {
                await supabase
                    .from('recipe_ratings')
                    .upsert(ratingRecords as any, {
                        onConflict: 'baby_id,recipe_id',
                        ignoreDuplicates: false,
                    })
            }

            lastSyncTime.value = new Date()
            console.log('✅ Cloud sync completed successfully')
        } catch (err: any) {
            console.error('Failed to sync to cloud:', err)
            syncError.value = err.message
            // 失敗時不影響本地操作
        } finally {
            isSyncing.value = false
        }
    }

    // 監聽變化並自動儲存到 LocalStorage + 雲端同步（debounce 2 秒）
    let syncTimeout: number | undefined
    watch(
        [babyName, birthday, ingredientStates, favoriteRecipes, recipeRatings],
        () => {
            // 立即保存到 LocalStorage
            saveToStorage({
                babyName: babyName.value,
                birthday: birthday.value,
                ingredientStates: ingredientStates.value,
                favoriteRecipes: [...favoriteRecipes.value],
                recipeRatings: recipeRatings.value,
            })

            // Debounce 雲端同步
            const authStore = useAuthStore()
            if (authStore.isLoggedIn) {
                clearTimeout(syncTimeout)
                syncTimeout = window.setTimeout(() => {
                    syncToCloud()
                }, 2000)
            }
        },
        { deep: true }
    )

    return {
        // State
        babyName,
        birthday,
        ingredientStates,
        favoriteRecipes,
        recipeRatings,

        // Cloud Sync State
        isSyncing,
        lastSyncTime,
        syncError,
        babyProfileId,

        // Getters
        getAgeInMonths,
        getAgeDisplay,
        triedIngredientsCount,
        allergyIngredientsCount,
        likedRecipesCount,

        // Actions
        setBabyInfo,
        updateIngredientState,
        getIngredientState,
        resetIngredientState,
        toggleFavoriteRecipe,
        isFavoriteRecipe,
        setRecipeRating,
        getRecipeRating,
        isRecipeLiked,

        // Cloud Sync Actions
        loadFromCloud,
        syncToCloud,
    }
})
