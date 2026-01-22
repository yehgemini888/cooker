import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useShoppingList } from '@/composables/useShoppingList';
const router = useRouter();
const route = useRoute();
const { pendingCount } = useShoppingList();
// 按鈕位置
const position = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const hasMoved = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const startPosition = ref({ x: 0, y: 0 });
// 從 localStorage 載入位置
onMounted(() => {
    const saved = localStorage.getItem('cart-button-position');
    if (saved) {
        try {
            const pos = JSON.parse(saved);
            position.value = pos;
        }
        catch {
            resetPosition();
        }
    }
    else {
        resetPosition();
    }
});
// 重置到預設位置（右下角）
function resetPosition() {
    position.value = {
        x: window.innerWidth - 80,
        y: window.innerHeight - 200
    };
}
// 儲存位置
function savePosition() {
    localStorage.setItem('cart-button-position', JSON.stringify(position.value));
}
// 拖曳開始
function onDragStart(e) {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    isDragging.value = true;
    hasMoved.value = false;
    startPosition.value = { x: clientX, y: clientY };
    dragOffset.value = {
        x: clientX - position.value.x,
        y: clientY - position.value.y
    };
    // 阻止選取文字等，但不阻止點擊
    if ('touches' in e) {
        // 對觸控事件：不阻止，讓點擊可以正常工作
    }
    else {
        e.preventDefault();
    }
}
// 拖曳中
function onDragMove(e) {
    if (!isDragging.value)
        return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    // 檢測是否真的移動了（超過 10px 才算拖曳）
    const deltaX = Math.abs(clientX - startPosition.value.x);
    const deltaY = Math.abs(clientY - startPosition.value.y);
    if (deltaX > 10 || deltaY > 10) {
        hasMoved.value = true;
        // 限制在視窗範圍內
        const newX = Math.max(10, Math.min(window.innerWidth - 70, clientX - dragOffset.value.x));
        const newY = Math.max(60, Math.min(window.innerHeight - 100, clientY - dragOffset.value.y));
        position.value = { x: newX, y: newY };
        // 阻止滾動
        if ('touches' in e) {
            e.preventDefault();
        }
    }
}
// 拖曳結束
function onDragEnd() {
    const wasDragging = isDragging.value;
    const didMove = hasMoved.value;
    isDragging.value = false;
    if (wasDragging && didMove) {
        savePosition();
    }
}
// 點擊導航 - 只在沒有移動時觸發
function handleClick() {
    // 如果有移動過，不導航
    if (hasMoved.value) {
        return;
    }
    router.push('/shopping');
}
// 觸控結束時處理
function onTouchEnd(e) {
    onDragEnd();
    // 如果沒有移動，視為點擊
    if (!hasMoved.value) {
        router.push('/shopping');
    }
}
// 監聽全局拖曳事件
onMounted(() => {
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchmove', onDragMove, { passive: false });
});
onUnmounted(() => {
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
    window.removeEventListener('touchmove', onDragMove);
});
// 在購物清單頁面不顯示
const shouldShow = computed(() => route.path !== '/shopping');
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    to: "body",
}));
const __VLS_2 = __VLS_1({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
if (__VLS_ctx.shouldShow) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onMousedown: (__VLS_ctx.onDragStart) },
        ...{ onTouchstart: (__VLS_ctx.onDragStart) },
        ...{ onTouchend: (__VLS_ctx.onTouchEnd) },
        ...{ onClick: (__VLS_ctx.handleClick) },
        ...{ class: "fixed z-50 w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg flex items-center justify-center text-2xl transition-transform select-none" },
        ...{ class: ({
                'cursor-grabbing scale-95': __VLS_ctx.isDragging && __VLS_ctx.hasMoved,
                'cursor-grab hover:shadow-xl hover:scale-105': !__VLS_ctx.isDragging,
                'active:scale-95': !__VLS_ctx.hasMoved
            }) },
        ...{ style: ({
                left: `${__VLS_ctx.position.x}px`,
                top: `${__VLS_ctx.position.y}px`,
                boxShadow: '0 6px 20px rgba(251, 146, 60, 0.5)',
                touchAction: 'none'
            }) },
    });
    if (__VLS_ctx.pendingCount > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md" },
        });
        (__VLS_ctx.pendingCount > 99 ? '99+' : __VLS_ctx.pendingCount);
    }
}
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['w-14']} */ ;
/** @type {__VLS_StyleScopedClasses['h-14']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gradient-to-br']} */ ;
/** @type {__VLS_StyleScopedClasses['from-yellow-400']} */ ;
/** @type {__VLS_StyleScopedClasses['to-orange-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
/** @type {__VLS_StyleScopedClasses['select-none']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-grabbing']} */ ;
/** @type {__VLS_StyleScopedClasses['scale-95']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-grab']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:shadow-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:scale-105']} */ ;
/** @type {__VLS_StyleScopedClasses['active:scale-95']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['-top-1']} */ ;
/** @type {__VLS_StyleScopedClasses['-right-1']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-[22px]']} */ ;
/** @type {__VLS_StyleScopedClasses['h-[22px]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-md']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            pendingCount: pendingCount,
            position: position,
            isDragging: isDragging,
            hasMoved: hasMoved,
            onDragStart: onDragStart,
            handleClick: handleClick,
            onTouchEnd: onTouchEnd,
            shouldShow: shouldShow,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=FloatingCartButton.vue.js.map