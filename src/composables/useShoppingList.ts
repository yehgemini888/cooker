import { computed, ref, watch } from 'vue'
import { usePlanStore } from '@/stores/plan'
import { usePantryStore } from '@/stores/pantry'
import { useFoodStore } from '@/stores/food'

/**
 * 購物清單項目
 */
export interface ShoppingItem {
    ingredientId: string
    name: string
    category: string
    purchased: boolean
    /** 最早需要的日期 */
    earliestDate: string
    /** 時間分類：本周 / 下周 / 更後 */
    timeGroup: 'this_week' | 'next_week' | 'later'
}

const STORAGE_KEY = 'babymeal-passport-shopping'

/**
 * 本地日期格式化
 */
function formatDate(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

/**
 * 取得本周日
 */
function getWeekEnd(date: Date = new Date()): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = 7 - day // 距離週日的天數
    d.setDate(d.getDate() + diff)
    return d
}

/**
 * 取得下周日
 */
function getNextWeekEnd(date: Date = new Date()): Date {
    const weekEnd = getWeekEnd(date)
    weekEnd.setDate(weekEnd.getDate() + 7)
    return weekEnd
}

/**
 * 從 LocalStorage 載入已購買狀態
 */
function loadPurchasedItems(): Set<string> {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            return new Set(JSON.parse(saved))
        }
    } catch (e) {
        console.error('Failed to load shopping list from localStorage:', e)
    }
    return new Set()
}

/**
 * 儲存已購買狀態到 LocalStorage
 */
function savePurchasedItems(items: Set<string>) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...items]))
    } catch (e) {
        console.error('Failed to save shopping list to localStorage:', e)
    }
}

export function useShoppingList() {
    const planStore = usePlanStore()
    const pantryStore = usePantryStore()
    const foodStore = useFoodStore()

    // 已購買的食材 ID
    const purchasedItems = ref<Set<string>>(loadPurchasedItems())

    const todayStr = formatDate(new Date())
    const thisWeekEndStr = formatDate(getWeekEnd())
    const nextWeekEndStr = formatDate(getNextWeekEnd())

    /**
     * 取得食材的最早需要日期
     */
    function getEarliestDateForIngredient(ingredientId: string): string | null {
        if (!planStore.currentPlan) return null

        let earliest: string | null = null

        Object.entries(planStore.currentPlan.meals).forEach(([dateStr, recipeIds]) => {
            recipeIds.forEach((recipeId) => {
                const recipe = foodStore.recipes.find((r) => r.id === recipeId)
                if (recipe && recipe.ingredient_ids.includes(ingredientId)) {
                    if (!earliest || dateStr < earliest) {
                        earliest = dateStr
                    }
                }
            })
        })

        return earliest
    }

    /**
     * 計算時間分類
     */
    function getTimeGroup(dateStr: string): 'this_week' | 'next_week' | 'later' {
        if (dateStr <= thisWeekEndStr) {
            return 'this_week'
        } else if (dateStr <= nextWeekEndStr) {
            return 'next_week'
        } else {
            return 'later'
        }
    }

    /**
     * 完整購物清單（含時間分類）
     */
    const shoppingList = computed<ShoppingItem[]>(() => {
        if (!planStore.currentPlan) return []

        const ingredientMap = new Map<string, ShoppingItem>()

        // 遍歷所有計畫的餐點
        Object.entries(planStore.currentPlan.meals).forEach(([dateStr, recipeIds]) => {
            recipeIds.forEach((recipeId) => {
                const recipe = foodStore.recipes.find((r) => r.id === recipeId)
                if (!recipe) return

                recipe.ingredient_ids.forEach((ingredientId) => {
                    // 跳過冰箱已有的食材
                    if (pantryStore.hasItem(ingredientId)) return

                    const ingredient = foodStore.getIngredientById(ingredientId)
                    if (!ingredient) return

                    // 檢查是否已存在，更新最早日期
                    if (ingredientMap.has(ingredientId)) {
                        const existing = ingredientMap.get(ingredientId)!
                        if (dateStr < existing.earliestDate) {
                            existing.earliestDate = dateStr
                            existing.timeGroup = getTimeGroup(dateStr)
                        }
                    } else {
                        ingredientMap.set(ingredientId, {
                            ingredientId,
                            name: ingredient.name,
                            category: ingredient.category,
                            purchased: purchasedItems.value.has(ingredientId),
                            earliestDate: dateStr,
                            timeGroup: getTimeGroup(dateStr),
                        })
                    }
                })
            })
        })

        const items = Array.from(ingredientMap.values())

        // 按時間分組優先，再按分類排序
        const categoryOrder = ['grain', 'vegetable', 'fruit', 'protein', 'dairy', 'other']
        items.sort((a, b) => {
            // 先按時間分組
            const timeOrder = { this_week: 0, next_week: 1, later: 2 }
            const timeDiff = timeOrder[a.timeGroup] - timeOrder[b.timeGroup]
            if (timeDiff !== 0) return timeDiff
            // 再按分類
            return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
        })

        return items
    })

    /**
     * 本周購物清單
     */
    const thisWeekList = computed(() =>
        shoppingList.value.filter((item) => item.timeGroup === 'this_week')
    )

    /**
     * 下周購物清單
     */
    const nextWeekList = computed(() =>
        shoppingList.value.filter((item) => item.timeGroup === 'next_week')
    )

    /**
     * 更後的購物清單
     */
    const laterList = computed(() =>
        shoppingList.value.filter((item) => item.timeGroup === 'later')
    )

    /**
     * 待購買項目數量
     */
    const pendingCount = computed(() => {
        return shoppingList.value.filter((item) => !item.purchased).length
    })

    /**
     * 已購買項目數量
     */
    const purchasedCount = computed(() => {
        return shoppingList.value.filter((item) => item.purchased).length
    })

    /**
     * 本周待購數量
     */
    const thisWeekPendingCount = computed(() =>
        thisWeekList.value.filter((item) => !item.purchased).length
    )

    /**
     * 切換購買狀態
     */
    function togglePurchased(ingredientId: string) {
        if (purchasedItems.value.has(ingredientId)) {
            purchasedItems.value.delete(ingredientId)
        } else {
            purchasedItems.value.add(ingredientId)
        }
        purchasedItems.value = new Set(purchasedItems.value)
    }

    /**
     * 標記為已購買並加入冰箱
     */
    function markPurchasedAndAddToPantry(ingredientId: string) {
        purchasedItems.value.add(ingredientId)
        purchasedItems.value = new Set(purchasedItems.value)
        pantryStore.addItem(ingredientId)
    }

    /**
     * 全部標記為已購買
     */
    function markAllPurchased() {
        shoppingList.value.forEach((item) => {
            purchasedItems.value.add(item.ingredientId)
        })
        purchasedItems.value = new Set(purchasedItems.value)
    }

    /**
     * 標記本周已購買
     */
    function markThisWeekPurchased() {
        thisWeekList.value.forEach((item) => {
            purchasedItems.value.add(item.ingredientId)
        })
        purchasedItems.value = new Set(purchasedItems.value)
    }

    /**
     * 清除所有已購買狀態
     */
    function clearAllPurchased() {
        purchasedItems.value = new Set()
    }

    /**
     * 將所有已購買項目加入冰箱
     */
    function addAllPurchasedToPantry() {
        shoppingList.value.forEach((item) => {
            if (item.purchased) {
                pantryStore.addItem(item.ingredientId)
            }
        })
        clearAllPurchased()
    }

    /**
     * 將本周已購買項目加入冰箱
     */
    function addThisWeekPurchasedToPantry() {
        thisWeekList.value.forEach((item) => {
            if (item.purchased) {
                pantryStore.addItem(item.ingredientId)
            }
        })
        // 只清除本周的勾選狀態
        thisWeekList.value.forEach((item) => {
            purchasedItems.value.delete(item.ingredientId)
        })
        purchasedItems.value = new Set(purchasedItems.value)
    }

    // 監聽變化並儲存
    watch(
        purchasedItems,
        (newValue) => {
            savePurchasedItems(newValue)
        },
        { deep: true }
    )

    return {
        shoppingList,
        thisWeekList,
        nextWeekList,
        laterList,
        pendingCount,
        purchasedCount,
        thisWeekPendingCount,
        togglePurchased,
        markPurchasedAndAddToPantry,
        markAllPurchased,
        markThisWeekPurchased,
        clearAllPurchased,
        addAllPurchasedToPantry,
        addThisWeekPurchasedToPantry,
    }
}
