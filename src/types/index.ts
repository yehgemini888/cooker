/**
 * 食材分類類型
 */
export type IngredientCategory =
    | 'grain'      // 穀物類
    | 'vegetable'  // 蔬菜類
    | 'fruit'      // 水果類
    | 'protein'    // 蛋白質類
    | 'dairy'      // 乳製品類
    | 'other';     // 其他

/**
 * 食材介面定義
 */
export interface Ingredient {
    /** 唯一識別碼 */
    id: string;
    /** 食材名稱 */
    name: string;
    /** 食材分類 */
    category: IngredientCategory;
    /** 食材圖片路徑 */
    imageUrl?: string;
    /** 營養價值重點說明 */
    nutrition_highlight?: string;
    /** 醫師臨床觀察 */
    doctor_note?: string;
    /** 挑選指南 */
    picking_guide?: string;
    /** 調理機攻略 */
    processing_guide?: string;
    /** 是否為高過敏源 */
    allergy_risk?: boolean;
}

/**
 * 營養標籤類型
 */
export type NutritionTag =
    | 'iron'           // 鐵質
    | 'calcium'        // 鈣質
    | 'protein'        // 蛋白質
    | 'vitamin-a'      // 維生素A
    | 'vitamin-c'      // 維生素C
    | 'vitamin-b'      // 維生素B群
    | 'fiber'          // 膳食纖維
    | 'carbohydrate'   // 碳水化合物
    | 'omega-3'        // Omega-3
    | 'zinc'           // 鋅
    | 'potassium';     // 鉀

/**
 * 食譜介面定義
 */
export interface Recipe {
    /** 唯一識別碼 */
    id: string;
    /** 食譜標題 */
    title: string;
    /** 最小適用月齡 */
    min_month: number;
    /** 最大適用月齡 */
    max_month: number;
    /** 使用的食材ID列表 */
    ingredient_ids: string[];
    /** 製作步驟 */
    steps: string[];
    /** 營養標籤 */
    nutrition_tags: NutritionTag[];
    /** 小提示 */
    tips: string;
    /** 食譜圖片路徑 (optional) */
    imageUrl?: string;
    /** 預估烹調時間 (分鐘, optional) */
    cooking_time?: number;
    /** 難易度 (optional) */
    difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * 寶寶食材記錄介面
 */
export interface BabyIngredientRecord {
    /** 食材ID */
    ingredient_id: string;
    /** 首次嘗試日期 */
    first_tried_date: string;
    /** 過敏反應 */
    allergy_reaction: boolean;
    /** 備註 */
    notes: string;
}

/**
 * 寶寶資料介面
 */
export interface BabyProfile {
    /** 寶寶ID */
    id: string;
    /** 寶寶名稱 */
    name: string;
    /** 出生日期 */
    birth_date: string;
    /** 已嘗試的食材記錄 */
    tried_ingredients: BabyIngredientRecord[];
}
