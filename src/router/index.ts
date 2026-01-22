import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        // 主要 Tab 頁面
        {
            path: '/',
            redirect: '/profile',
        },
        {
            path: '/profile',
            name: 'profile',
            component: () => import('../views/ProfileView.vue'),
        },
        {
            path: '/pantry',
            name: 'pantry',
            component: () => import('../views/PantryView.vue'),
        },
        {
            path: '/ingredients',
            name: 'ingredients',
            component: () => import('../views/IngredientsView.vue'),
        },
        {
            path: '/recipes',
            name: 'recipes',
            component: () => import('../views/RecipesView.vue'),
        },
        {
            path: '/plan',
            name: 'plan',
            component: () => import('../views/PlanView.vue'),
        },
        {
            path: '/shopping',
            name: 'shopping',
            component: () => import('../views/ShoppingListView.vue'),
        },
        // 詳情頁面
        {
            path: '/ingredient/:id',
            name: 'ingredient-detail',
            component: () => import('../views/IngredientDetailView.vue'),
        },
        {
            path: '/recipe/:id',
            name: 'recipe-detail',
            component: () => import('../views/RecipeDetailView.vue'),
        },
        // 其他頁面
        {
            path: '/wizard',
            name: 'wizard',
            component: () => import('../views/WizardView.vue'),
        },
        {
            path: '/home',
            name: 'home',
            component: () => import('../views/HomeView.vue'),
        },
    ],
})

export default router
