import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
const STORAGE_KEY = 'babymeal-passport-plan';
/**
 * 從 LocalStorage 載入資料
 */
function loadFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    }
    catch (e) {
        console.error('Failed to load plan from localStorage:', e);
    }
    return { currentPlan: null, historyPlans: [] };
}
/**
 * 儲存資料到 LocalStorage
 */
function saveToStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    catch (e) {
        console.error('Failed to save plan to localStorage:', e);
    }
}
/**
 * 取得本週一的日期
 */
function getWeekStartDate(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 調整為週一
    d.setDate(diff);
    return d.toISOString().split('T')[0];
}
/**
 * 取得上週一的日期
 */
function getLastWeekStartDate() {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getWeekStartDate(d);
}
/**
 * Deep Clone 物件
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
export const usePlanStore = defineStore('plan', () => {
    const savedData = loadFromStorage();
    // State
    const currentPlan = ref(savedData.currentPlan);
    const historyPlans = ref(savedData.historyPlans || []);
    // Getters
    const hasCurrentPlan = computed(() => currentPlan.value !== null);
    const currentWeekStart = computed(() => getWeekStartDate());
    const lastWeekPlan = computed(() => {
        const lastWeekStart = getLastWeekStartDate();
        return historyPlans.value.find((p) => p.weekStartDate === lastWeekStart) || null;
    });
    /**
     * 取得指定日期的食譜
     */
    function getMealsForDate(dateStr) {
        if (!currentPlan.value)
            return [];
        return currentPlan.value.meals[dateStr] || [];
    }
    /**
     * 建立新的週計畫
     */
    function createNewPlan(selectedDates) {
        const now = new Date().toISOString();
        const meals = {};
        selectedDates.forEach((date) => {
            meals[date] = [];
        });
        return {
            id: `plan-${Date.now()}`,
            weekStartDate: getWeekStartDate(),
            meals,
            createdAt: now,
            updatedAt: now,
        };
    }
    /**
     * 儲存計畫
     */
    function savePlan(plan) {
        // 將舊的 currentPlan 移入歷史紀錄
        if (currentPlan.value && currentPlan.value.id !== plan.id) {
            // 檢查是否已存在相同週的計畫
            const existingIndex = historyPlans.value.findIndex((p) => p.weekStartDate === currentPlan.value.weekStartDate);
            if (existingIndex >= 0) {
                historyPlans.value[existingIndex] = deepClone(currentPlan.value);
            }
            else {
                historyPlans.value.push(deepClone(currentPlan.value));
            }
            // 限制歷史紀錄數量
            if (historyPlans.value.length > 12) {
                historyPlans.value = historyPlans.value.slice(-12);
            }
        }
        plan.updatedAt = new Date().toISOString();
        currentPlan.value = plan;
    }
    /**
     * 複製上週計畫 (Deep Copy)
     */
    function copyLastWeekPlan(selectedDates) {
        if (!lastWeekPlan.value)
            return null;
        const now = new Date().toISOString();
        const newMeals = {};
        // Deep Clone 上週的餐點資料
        const lastWeekMeals = deepClone(lastWeekPlan.value.meals);
        const lastWeekDates = Object.keys(lastWeekMeals).sort();
        // 將上週的餐點對應到本週
        selectedDates.forEach((date, index) => {
            if (lastWeekDates[index]) {
                newMeals[date] = [...lastWeekMeals[lastWeekDates[index]]];
            }
            else {
                newMeals[date] = [];
            }
        });
        return {
            id: `plan-${Date.now()}`,
            weekStartDate: getWeekStartDate(),
            meals: newMeals,
            createdAt: now,
            updatedAt: now,
        };
    }
    /**
     * 設定特定日期的食譜
     */
    function setMealsForDate(dateStr, recipeIds) {
        if (!currentPlan.value)
            return;
        currentPlan.value.meals[dateStr] = [...recipeIds];
        currentPlan.value.updatedAt = new Date().toISOString();
    }
    /**
     * 新增食譜到某一天
     */
    function addMealToDate(dateStr, recipeId) {
        if (!currentPlan.value)
            return;
        if (!currentPlan.value.meals[dateStr]) {
            currentPlan.value.meals[dateStr] = [];
        }
        if (!currentPlan.value.meals[dateStr].includes(recipeId)) {
            currentPlan.value.meals[dateStr].push(recipeId);
            currentPlan.value.updatedAt = new Date().toISOString();
        }
    }
    /**
     * 從某一天移除食譜
     */
    function removeMealFromDate(dateStr, recipeId) {
        if (!currentPlan.value || !currentPlan.value.meals[dateStr])
            return;
        const index = currentPlan.value.meals[dateStr].indexOf(recipeId);
        if (index >= 0) {
            currentPlan.value.meals[dateStr].splice(index, 1);
            currentPlan.value.updatedAt = new Date().toISOString();
        }
    }
    /**
     * 清除目前計畫
     */
    function clearCurrentPlan() {
        if (currentPlan.value) {
            // 先存入歷史
            const existingIndex = historyPlans.value.findIndex((p) => p.weekStartDate === currentPlan.value.weekStartDate);
            if (existingIndex >= 0) {
                historyPlans.value[existingIndex] = deepClone(currentPlan.value);
            }
            else {
                historyPlans.value.push(deepClone(currentPlan.value));
            }
        }
        currentPlan.value = null;
    }
    // 監聽變化並自動儲存
    watch([currentPlan, historyPlans], () => {
        saveToStorage({
            currentPlan: currentPlan.value,
            historyPlans: historyPlans.value,
        });
    }, { deep: true });
    return {
        // State
        currentPlan,
        historyPlans,
        // Getters
        hasCurrentPlan,
        currentWeekStart,
        lastWeekPlan,
        // Actions
        getMealsForDate,
        createNewPlan,
        savePlan,
        copyLastWeekPlan,
        setMealsForDate,
        addMealToDate,
        removeMealFromDate,
        clearCurrentPlan,
    };
});
//# sourceMappingURL=plan.js.map