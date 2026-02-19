-- ============================================
-- 寶寶副食品助手 - Supabase Schema
-- ============================================
-- 版本: 1.0
-- 建立日期: 2024-02-19
-- 基於 Architect_Zero 的設計
-- ============================================

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用戶資料表 (profiles)
-- ============================================
-- 擴展 Supabase Auth 用戶資料
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- RLS 策略
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- 2. 寶寶檔案表 (baby_profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS public.baby_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    birthday DATE NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_baby_profiles_user_id ON public.baby_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_baby_profiles_is_active ON public.baby_profiles(is_active);

-- RLS 策略
ALTER TABLE public.baby_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own baby profiles"
    ON public.baby_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own baby profiles"
    ON public.baby_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own baby profiles"
    ON public.baby_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own baby profiles"
    ON public.baby_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 3. 食材狀態表 (ingredient_states)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ingredient_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES public.baby_profiles(id) ON DELETE CASCADE,
    ingredient_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_tried' CHECK (status IN ('not_tried', 'tried', 'loved', 'disliked')),
    allergy BOOLEAN NOT NULL DEFAULT FALSE,
    preference INTEGER NOT NULL DEFAULT 1 CHECK (preference BETWEEN 0 AND 2),
    note TEXT,
    first_tried_at DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(baby_id, ingredient_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_ingredient_states_baby_id ON public.ingredient_states(baby_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_states_ingredient_id ON public.ingredient_states(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_states_status ON public.ingredient_states(status);
CREATE INDEX IF NOT EXISTS idx_ingredient_states_allergy ON public.ingredient_states(allergy) WHERE allergy = TRUE;

-- RLS 策略
ALTER TABLE public.ingredient_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their baby's ingredient states"
    ON public.ingredient_states FOR SELECT
    USING (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their baby's ingredient states"
    ON public.ingredient_states FOR INSERT
    WITH CHECK (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their baby's ingredient states"
    ON public.ingredient_states FOR UPDATE
    USING (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their baby's ingredient states"
    ON public.ingredient_states FOR DELETE
    USING (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- 4. 食譜評分表 (recipe_ratings)
-- ============================================
CREATE TABLE IF NOT EXISTS public.recipe_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES public.baby_profiles(id) ON DELETE CASCADE,
    recipe_id TEXT NOT NULL,
    rating TEXT NOT NULL CHECK (rating IN ('like', 'normal', 'dislike')),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(baby_id, recipe_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_baby_id ON public.recipe_ratings(baby_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id ON public.recipe_ratings(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_rating ON public.recipe_ratings(rating);

-- RLS 策略
ALTER TABLE public.recipe_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their baby's recipe ratings"
    ON public.recipe_ratings FOR SELECT
    USING (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their baby's recipe ratings"
    ON public.recipe_ratings FOR INSERT
    WITH CHECK (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their baby's recipe ratings"
    ON public.recipe_ratings FOR UPDATE
    USING (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their baby's recipe ratings"
    ON public.recipe_ratings FOR DELETE
    USING (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- 5. 最愛食譜表 (favorite_recipes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.favorite_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES public.baby_profiles(id) ON DELETE CASCADE,
    recipe_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(baby_id, recipe_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_favorite_recipes_baby_id ON public.favorite_recipes(baby_id);
CREATE INDEX IF NOT EXISTS idx_favorite_recipes_recipe_id ON public.favorite_recipes(recipe_id);

-- RLS 策略
ALTER TABLE public.favorite_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their baby's favorite recipes"
    ON public.favorite_recipes FOR SELECT
    USING (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their baby's favorite recipes"
    ON public.favorite_recipes FOR INSERT
    WITH CHECK (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their baby's favorite recipes"
    ON public.favorite_recipes FOR DELETE
    USING (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- 6. 冰箱庫存表 (pantry_items)
-- ============================================
CREATE TABLE IF NOT EXISTS public.pantry_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES public.baby_profiles(id) ON DELETE CASCADE,
    ingredient_id TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'piece',
    expiry_date DATE,
    location TEXT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(baby_id, ingredient_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_pantry_items_baby_id ON public.pantry_items(baby_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_ingredient_id ON public.pantry_items(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expiry_date ON public.pantry_items(expiry_date);

-- RLS 策略
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their baby's pantry items"
    ON public.pantry_items FOR SELECT
    USING (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their baby's pantry items"
    ON public.pantry_items FOR INSERT
    WITH CHECK (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their baby's pantry items"
    ON public.pantry_items FOR UPDATE
    USING (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their baby's pantry items"
    ON public.pantry_items FOR DELETE
    USING (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- 7. 飲食計劃表 (meal_plans)
-- ============================================
CREATE TABLE IF NOT EXISTS public.meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES public.baby_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    recipe_id TEXT,
    custom_meal TEXT,
    note TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(baby_id, date, meal_type)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_meal_plans_baby_id ON public.meal_plans(baby_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_date ON public.meal_plans(date);
CREATE INDEX IF NOT EXISTS idx_meal_plans_completed ON public.meal_plans(completed);

-- RLS 策略
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their baby's meal plans"
    ON public.meal_plans FOR SELECT
    USING (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their baby's meal plans"
    ON public.meal_plans FOR INSERT
    WITH CHECK (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their baby's meal plans"
    ON public.meal_plans FOR UPDATE
    USING (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their baby's meal plans"
    ON public.meal_plans FOR DELETE
    USING (
        baby_id IN (
            SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- 觸發器：自動更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為所有表格建立觸發器
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_baby_profiles_updated_at
    BEFORE UPDATE ON public.baby_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredient_states_updated_at
    BEFORE UPDATE ON public.ingredient_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_ratings_updated_at
    BEFORE UPDATE ON public.recipe_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pantry_items_updated_at
    BEFORE UPDATE ON public.pantry_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at
    BEFORE UPDATE ON public.meal_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 觸發器：自動建立用戶 Profile
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 當新用戶註冊時自動建立 profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 完成
-- ============================================
-- 執行此 SQL 文件後，您的 Supabase 資料庫將包含：
-- ✅ 7 個資料表（profiles, baby_profiles, ingredient_states, recipe_ratings, favorite_recipes, pantry_items, meal_plans）
-- ✅ 完整的 RLS 策略（用戶只能存取自己的資料）
-- ✅ 自動更新 updated_at 的觸發器
-- ✅ 新用戶自動建立 profile 的觸發器
-- ✅ 適當的索引以提高查詢效能
-- ============================================
