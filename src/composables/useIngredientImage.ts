/**
 * 食材圖片載入 Composable
 * 處理本地圖片的動態載入，使用 Vite 的 import.meta.glob
 */

// 預先載入所有食材圖片
const ingredientImages = import.meta.glob<{ default: string }>(
    '@/assets/ingredients/*.png',
    { eager: true }
)

// 建立 id -> 圖片 URL 的映射
const imageMap: Record<string, string> = {}

for (const path in ingredientImages) {
    // 從路徑中提取檔名 (不含副檔名)
    // 例如: /src/assets/ingredients/apple.png -> apple
    const match = path.match(/\/([^/]+)\.png$/)
    if (match) {
        const id = match[1]
        imageMap[id] = ingredientImages[path].default
    }
}

// 預設圖片
const DEFAULT_IMAGE = 'https://placehold.co/200x200/e2e8f0/64748b?text=Food'

/**
 * 根據食材 ID 取得圖片 URL
 * @param ingredientId 食材 ID
 * @returns 圖片 URL (本地或預設)
 */
export function getIngredientImageUrl(ingredientId: string): string {
    return imageMap[ingredientId] || DEFAULT_IMAGE
}

/**
 * 檢查食材是否有本地圖片
 * @param ingredientId 食材 ID
 * @returns 是否有本地圖片
 */
export function hasLocalImage(ingredientId: string): boolean {
    return ingredientId in imageMap
}

/**
 * 取得所有已載入的食材圖片 ID 列表
 * @returns 食材 ID 陣列
 */
export function getAvailableImageIds(): string[] {
    return Object.keys(imageMap)
}

export default {
    getIngredientImageUrl,
    hasLocalImage,
    getAvailableImageIds
}
