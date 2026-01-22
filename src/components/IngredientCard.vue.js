import { computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { usePantryStore } from '@/stores/pantry';
import { getIngredientImageUrl, hasLocalImage } from '@/composables/useIngredientImage';
const props = defineProps();
const emit = defineEmits();
const userStore = useUserStore();
const pantryStore = usePantryStore();
// 取得食材狀態
const ingredientState = computed(() => {
    return userStore.getIngredientState(props.ingredient.id);
});
// 是否已嘗試
const isTried = computed(() => {
    return ingredientState.value.status === 'tried';
});
// 是否過敏
const hasAllergy = computed(() => {
    return ingredientState.value.allergy;
});
// 是否為高過敏風險食材
const isHighAllergyRisk = computed(() => {
    return props.ingredient.allergy_risk === true;
});
// 是否在冰箱庫存中
const isInPantry = computed(() => {
    return pantryStore.hasItem(props.ingredient.id);
});
// 圖片 URL：優先使用本地圖片，若無則使用 JSON 中的 URL
const imageUrl = computed(() => {
    // 優先檢查本地圖片
    if (hasLocalImage(props.ingredient.id)) {
        return getIngredientImageUrl(props.ingredient.id);
    }
    // Fallback 到 JSON 中的 URL 或預設圖片
    return props.ingredient.imageUrl || 'https://placehold.co/200x200?text=Food';
});
// 適合月齡顯示
const monthLabel = computed(() => {
    if (props.minMonth) {
        return `${props.minMonth}m+`;
    }
    return '4m+';
});
// 分類標籤顏色
const categoryColor = computed(() => {
    const colors = {
        grain: 'bg-amber-100 text-amber-700',
        vegetable: 'bg-green-100 text-green-700',
        fruit: 'bg-pink-100 text-pink-700',
        protein: 'bg-blue-100 text-blue-700',
        dairy: 'bg-purple-100 text-purple-700',
        other: 'bg-gray-100 text-gray-700',
    };
    return colors[props.ingredient.category] || colors.other;
});
// 點擊處理
function handleClick() {
    emit('click', props.ingredient);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.handleClick) },
    ...{ class: "relative bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 active:scale-95" },
    ...{ class: ({ 'ring-2 ring-cyan-400': __VLS_ctx.isInPantry }) },
});
if (__VLS_ctx.isInPantry) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "absolute top-2 left-2 z-10" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "px-2 py-1 bg-cyan-500 text-white text-xs rounded-full shadow-md flex items-center gap-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "font-medium" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "absolute top-2 right-2 flex flex-col gap-1 z-10" },
});
if (__VLS_ctx.isTried) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-white text-xs" },
    });
}
if (__VLS_ctx.hasAllergy) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md animate-pulse" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-white text-xs font-bold" },
    });
}
if (__VLS_ctx.isHighAllergyRisk && !__VLS_ctx.hasAllergy) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center shadow-md" },
        title: "高過敏風險食材",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-white text-xs" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "aspect-square bg-white p-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    ...{ onError: (...[$event]) => {
            $event.target.src = 'https://placehold.co/200x200/e2e8f0/64748b?text=Food';
        } },
    src: (__VLS_ctx.imageUrl),
    alt: (__VLS_ctx.ingredient.name),
    ...{ class: "w-full h-full object-contain rounded-xl" },
    loading: "lazy",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "p-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "font-semibold text-gray-800 text-center truncate" },
});
(__VLS_ctx.ingredient.name);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center justify-center gap-1 mt-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full" },
});
(__VLS_ctx.monthLabel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-xs px-2 py-0.5 rounded-full" },
    ...{ class: (__VLS_ctx.categoryColor) },
});
({ grain: '穀', vegetable: '蔬', fruit: '果', protein: '蛋白', dairy: '乳', other: '其他' }[__VLS_ctx.ingredient.category]);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "h-1 w-full" },
    ...{ class: ({
            'bg-cyan-500': __VLS_ctx.isInPantry && !__VLS_ctx.hasAllergy,
            'bg-green-500': __VLS_ctx.isTried && !__VLS_ctx.hasAllergy && !__VLS_ctx.isInPantry,
            'bg-red-500': __VLS_ctx.hasAllergy,
            'bg-gray-200': !__VLS_ctx.isTried && !__VLS_ctx.hasAllergy && !__VLS_ctx.isInPantry
        }) },
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-md']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:shadow-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:-translate-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['active:scale-95']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-cyan-400']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['top-2']} */ ;
/** @type {__VLS_StyleScopedClasses['left-2']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-cyan-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-md']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['top-2']} */ ;
/** @type {__VLS_StyleScopedClasses['right-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-green-500']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-md']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-orange-400']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['aspect-square']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-contain']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-cyan-500']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-green-500']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            isTried: isTried,
            hasAllergy: hasAllergy,
            isHighAllergyRisk: isHighAllergyRisk,
            isInPantry: isInPantry,
            imageUrl: imageUrl,
            monthLabel: monthLabel,
            categoryColor: categoryColor,
            handleClick: handleClick,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=IngredientCard.vue.js.map