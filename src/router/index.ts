import { createRouter, createWebHashHistory } from 'vue-router'
import { watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        // Auth 頁面（不需要登入）
        {
            path: '/auth',
            name: 'auth',
            component: () => import('../views/AuthView.vue'),
            meta: { requiresAuth: false },
        },
        // 主要 Tab 頁面
        {
            path: '/',
            redirect: '/profile',
        },
        {
            path: '/profile',
            name: 'profile',
            component: () => import('../views/ProfileView.vue'),
            meta: { requiresAuth: true }, // 需要登入
        },
        {
            path: '/pantry',
            name: 'pantry',
            component: () => import('../views/PantryView.vue'),
            meta: { requiresAuth: true },
        },
        {
            path: '/ingredients',
            name: 'ingredients',
            component: () => import('../views/IngredientsView.vue'),
            meta: { requiresAuth: true },
        },
        {
            path: '/recipes',
            name: 'recipes',
            component: () => import('../views/RecipesView.vue'),
            meta: { requiresAuth: true },
        },
        {
            path: '/plan',
            name: 'plan',
            component: () => import('../views/PlanView.vue'),
            meta: { requiresAuth: true },
        },
        {
            path: '/shopping',
            name: 'shopping',
            component: () => import('../views/ShoppingListView.vue'),
            meta: { requiresAuth: true },
        },
        // 詳情頁面
        {
            path: '/ingredient/:id',
            name: 'ingredient-detail',
            component: () => import('../views/IngredientDetailView.vue'),
            meta: { requiresAuth: true },
        },
        {
            path: '/recipe/:id',
            name: 'recipe-detail',
            component: () => import('../views/RecipeDetailView.vue'),
            meta: { requiresAuth: true },
        },
        // 其他頁面
        {
            path: '/wizard',
            name: 'wizard',
            component: () => import('../views/WizardView.vue'),
            meta: { requiresAuth: true },
        },
        {
            path: '/home',
            name: 'home',
            component: () => import('../views/HomeView.vue'),
            meta: { requiresAuth: true },
        },
    ],
})

// Navigation Guard（目前所有頁面都允許離線使用）
// 未來可以根據需求調整 meta.requiresAuth
router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore()
    
    // 等待 auth 初始化完成
    if (!authStore.initialized) {
        await new Promise<void>(resolve => {
            const stop = watch(
                () => authStore.initialized,
                (val) => { 
                    if (val) { 
                        stop()
                        resolve() 
                    } 
                }
            )
        })
    }
    
    // 如果頁面需要認證但用戶未登入，導向 Auth 頁面
    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
        next('/auth')
    } else if (to.path === '/auth' && authStore.isLoggedIn) {
        // 已登入時訪問 /auth 會被導向 /
        next('/')
    } else {
        next()
    }
})

export default router
