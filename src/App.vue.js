import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import BottomNavigation from '@/components/BottomNavigation.vue';
const route = useRoute();
// 判斷是否需要顯示底部導航
// 在詳情頁和精靈頁面隱藏底部導航
const showBottomNav = computed(() => {
    const hiddenPaths = ['/ingredient/', '/recipe/', '/wizard'];
    return !hiddenPaths.some(path => route.path.includes(path));
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "min-h-screen bg-gradient-to-br from-orange-50 to-green-50" },
});
const __VLS_0 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
if (__VLS_ctx.showBottomNav) {
    /** @type {[typeof BottomNavigation, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(BottomNavigation, new BottomNavigation({}));
    const __VLS_5 = __VLS_4({}, ...__VLS_functionalComponentArgsRest(__VLS_4));
}
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gradient-to-br']} */ ;
/** @type {__VLS_StyleScopedClasses['from-orange-50']} */ ;
/** @type {__VLS_StyleScopedClasses['to-green-50']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            RouterView: RouterView,
            BottomNavigation: BottomNavigation,
            showBottomNav: showBottomNav,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=App.vue.js.map