import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
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
            path: '/ingredient/:id',
            name: 'ingredient-detail',
            component: () => import('../views/IngredientDetailView.vue'),
        },
        {
            path: '/recipe/:id',
            name: 'recipe-detail',
            component: () => import('../views/RecipeDetailView.vue'),
        },
        {
            path: '/recipes',
            name: 'recipes',
            component: () => import('../views/RecipesView.vue'),
        },
        {
            path: '/wizard',
            name: 'wizard',
            component: () => import('../views/WizardView.vue'),
        },
    ],
})

export default router
