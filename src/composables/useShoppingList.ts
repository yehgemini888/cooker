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
}

const STORAGE_KEY = 'babymeal-passport-shopping'

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

    /**
     * 取得本週所需的所有食材 ID
     */
    const requiredIngredients = computed(() => {
        if (!planStore.currentPlan) return new Set<string>()

        const allIngredients = new Set<string>()

        Object.values(planStore.currentPlan.meals).forEach((recipeIds) => {
            recipeIds.forEach((recipeId) => {
                const recipe = foodStore.recipes.find((r) => r.id === recipeId)
                if (recipe) {
                    recipe.ingredient_ids.forEach((ingredientId) => {
                        allIngredients.add(ingredientId)
                    })
                }
            })
        })

        return allIngredients
    })

    /**
     * 購物清單 (扣除冰箱已有的食材)
     */
    const shoppingList = computed<ShoppingItem[]>(() => {
        const items: ShoppingItem[] = []

        requiredIngredients.value.forEach((ingredientId) => {
            // 如果冰箱已有，則跳過
            if (pantryStore.hasItem(ingredientId)) return

            const ingredient = foodStore.getIngredientById(ingredientId)
            if (ingredient) {
                items.push({
                    ingredientId,
                    name: ingredient.name,
                    category: ingredient.category,
                    purchased: purchasedItems.value.has(ingredientId),
                })
            }
        })

        // 按分類排序
        const categoryOrder = ['grain', 'vegetable', 'fruit', 'protein']
        items.sort((a, b) => {
            return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
        })

        return items
    })

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
        // 清除購物清單狀態
        clearAllPurchased()
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
        pendingCount,
        purchasedCount,
        requiredIngredients,
        togglePurchased,
        markPurchasedAndAddToPantry,
        markAllPurchased,
        clearAllPurchased,
        addAllPurchasedToPantry,
    }
}
