import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
const STORAGE_KEY = 'babymeal-passport-pantry';
/**
 * 從 LocalStorage 載入資料
 */
function loadFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return new Set(JSON.parse(saved));
        }
    }
    catch (e) {
        console.error('Failed to load pantry from localStorage:', e);
    }
    return new Set();
}
/**
 * 儲存資料到 LocalStorage
 */
function saveToStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...data]));
    }
    catch (e) {
        console.error('Failed to save pantry to localStorage:', e);
    }
}
export const usePantryStore = defineStore('pantry', () => {
    // 從 LocalStorage 載入初始資料
    const pantryStock = ref(loadFromStorage());
    /**
     * 切換食材的庫存狀態
     */
    function toggleItem(id) {
        if (pantryStock.value.has(id)) {
            pantryStock.value.delete(id);
        }
        else {
            pantryStock.value.add(id);
        }
        // 觸發響應式更新
        pantryStock.value = new Set(pantryStock.value);
    }
    /**
     * 檢查食材是否有庫存
     */
    function hasItem(id) {
        return pantryStock.value.has(id);
    }
    /**
     * 新增食材到庫存
     */
    function addItem(id) {
        pantryStock.value.add(id);
        pantryStock.value = new Set(pantryStock.value);
    }
    /**
     * 從庫存移除食材
     */
    function removeItem(id) {
        pantryStock.value.delete(id);
        pantryStock.value = new Set(pantryStock.value);
    }
    /**
     * 清空所有庫存
     */
    function clearAll() {
        pantryStock.value = new Set();
    }
    /**
     * 取得庫存數量
     */
    function getStockCount() {
        return pantryStock.value.size;
    }
    // 監聽變化並自動儲存到 LocalStorage
    watch(pantryStock, (newValue) => {
        saveToStorage(newValue);
    }, { deep: true });
    return {
        pantryStock,
        toggleItem,
        hasItem,
        addItem,
        removeItem,
        clearAll,
        getStockCount,
    };
});
//# sourceMappingURL=pantry.js.map