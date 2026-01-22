import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
const STORAGE_KEY = 'babymeal-passport-user';
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
        console.error('Failed to load from localStorage:', e);
    }
    return null;
}
/**
 * 儲存資料到 LocalStorage
 */
function saveToStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
}
export const useUserStore = defineStore('user', () => {
    // 從 LocalStorage 載入初始資料
    const savedData = loadFromStorage();
    // State
    const babyName = ref(savedData?.babyName || '');
    const birthday = ref(savedData?.birthday || '');
    const ingredientStates = ref(savedData?.ingredientStates || {});
    const favoriteRecipes = ref(new Set(savedData?.favoriteRecipes || []));
    const recipeRatings = ref(savedData?.recipeRatings || {});
    // Getters
    const getAgeInMonths = computed(() => {
        if (!birthday.value)
            return 0;
        const birthDate = new Date(birthday.value);
        const today = new Date();
        let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
        months += today.getMonth() - birthDate.getMonth();
        // 如果當月的日期還沒到生日，減一個月
        if (today.getDate() < birthDate.getDate()) {
            months--;
        }
        return Math.max(0, months);
    });
    const getAgeDisplay = computed(() => {
        const months = getAgeInMonths.value;
        if (months === 0)
            return '尚未設定';
        if (months < 12)
            return `${months} 個月`;
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (remainingMonths === 0)
            return `${years} 歲`;
        return `${years} 歲 ${remainingMonths} 個月`;
    });
    const triedIngredientsCount = computed(() => {
        return Object.values(ingredientStates.value).filter((state) => state.status === 'tried').length;
    });
    const allergyIngredientsCount = computed(() => {
        return Object.values(ingredientStates.value).filter((state) => state.allergy).length;
    });
    const likedRecipesCount = computed(() => {
        return Object.values(recipeRatings.value).filter((rating) => rating === 'like').length;
    });
    // Actions
    function setBabyInfo(name, birth) {
        babyName.value = name;
        birthday.value = birth;
    }
    function updateIngredientState(ingredientId, updates) {
        const currentState = ingredientStates.value[ingredientId] || {
            status: 'not_tried',
            allergy: false,
            preference: null,
            note: '',
        };
        ingredientStates.value[ingredientId] = {
            ...currentState,
            ...updates,
        };
    }
    function getIngredientState(ingredientId) {
        return (ingredientStates.value[ingredientId] || {
            status: 'not_tried',
            allergy: false,
            preference: null,
            note: '',
        });
    }
    function resetIngredientState(ingredientId) {
        delete ingredientStates.value[ingredientId];
    }
    // Favorites Actions
    function toggleFavoriteRecipe(recipeId) {
        if (favoriteRecipes.value.has(recipeId)) {
            favoriteRecipes.value.delete(recipeId);
        }
        else {
            favoriteRecipes.value.add(recipeId);
        }
        favoriteRecipes.value = new Set(favoriteRecipes.value);
    }
    function isFavoriteRecipe(recipeId) {
        return favoriteRecipes.value.has(recipeId);
    }
    // Recipe Rating Actions
    function setRecipeRating(recipeId, rating) {
        if (rating === null) {
            delete recipeRatings.value[recipeId];
        }
        else {
            recipeRatings.value[recipeId] = rating;
        }
        // 觸發響應式更新
        recipeRatings.value = { ...recipeRatings.value };
    }
    function getRecipeRating(recipeId) {
        return recipeRatings.value[recipeId] || null;
    }
    function isRecipeLiked(recipeId) {
        return recipeRatings.value[recipeId] === 'like';
    }
    // 監聽變化並自動儲存到 LocalStorage
    watch([babyName, birthday, ingredientStates, favoriteRecipes, recipeRatings], () => {
        saveToStorage({
            babyName: babyName.value,
            birthday: birthday.value,
            ingredientStates: ingredientStates.value,
            favoriteRecipes: [...favoriteRecipes.value],
            recipeRatings: recipeRatings.value,
        });
    }, { deep: true });
    return {
        // State
        babyName,
        birthday,
        ingredientStates,
        favoriteRecipes,
        recipeRatings,
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
    };
});
//# sourceMappingURL=user.js.map