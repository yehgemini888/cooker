/**
 * AI Image Prompt Generator for Ingredients
 * 
 * 執行方式:
 * - Node.js: node generate_prompts.js > prompts.md
 * - Browser: 複製貼上到 Console
 */

const fs = require('fs');
const path = require('path');

// 中文名稱 -> 英文名稱 對照表
const chineseToEnglish = {
    // Grains 穀物
    '白米': 'white rice',
    '糙米': 'brown rice',
    '燕麥': 'oatmeal',
    '小米': 'millet',
    '紫米': 'purple rice',
    '糯米': 'glutinous rice',
    '薏仁': 'barley (Job\'s tears)',
    '米粉': 'rice vermicelli noodles',
    '烏龍麵': 'udon noodles',
    '義大利麵': 'pasta',
    '麵條': 'noodles',
    '冬粉': 'glass noodles (bean thread)',
    '麵粉': 'flour',
    '在來米粉': 'rice flour',
    '吐司': 'white bread slices',
    '饅頭': 'steamed bun (mantou)',
    '餛飩皮': 'wonton wrappers',
    '捲餅皮': 'tortilla wraps',
    '麵包粉': 'bread crumbs',

    // Vegetables 蔬菜
    '紅蘿蔔': 'carrot',
    '南瓜': 'pumpkin (whole and sliced)',
    '地瓜': 'sweet potato',
    '菠菜': 'spinach leaves',
    '青花菜': 'broccoli',
    '馬鈴薯': 'potato',
    '洋蔥': 'onion',
    '白花椰菜': 'cauliflower',
    '小松菜': 'komatsuna (Japanese mustard spinach)',
    '青江菜': 'bok choy (pak choi)',
    '莧菜': 'amaranth leaves',
    '高麗菜': 'cabbage',
    '玉米': 'corn on the cob',
    '番茄': 'tomato',
    '冬瓜': 'winter melon (sliced)',
    '絲瓜': 'luffa (Chinese okra)',
    '甜菜根': 'beetroot',
    '黑木耳': 'black fungus (wood ear mushroom)',
    '秋葵': 'okra',
    '櫛瓜': 'zucchini',
    '白蘿蔔': 'daikon radish',
    '芋頭': 'taro',
    '山藥': 'Chinese yam',
    '甜椒': 'bell pepper (red, yellow, green)',
    '海帶芽': 'wakame seaweed',
    '海苔': 'nori seaweed sheets',
    '韭菜花': 'chive flowers',
    '薑': 'ginger root',
    '蒜頭': 'garlic bulb',
    '九層塔': 'Thai basil',
    '剝皮辣椒': 'pickled green chili',
    '蓮藕': 'lotus root (sliced)',
    '香菇': 'shiitake mushroom',
    '蘑菇': 'button mushroom',

    // Fruits 水果
    '蘋果': 'apple (red)',
    '香蕉': 'banana',
    '梨子': 'pear',
    '酪梨': 'avocado (whole and halved)',
    '木瓜': 'papaya (whole and sliced)',
    '葡萄': 'grapes (purple)',
    '鳳梨': 'pineapple',
    '草莓': 'strawberries',

    // Protein 蛋白質
    '蛋黃': 'egg yolk',
    '雞肉': 'raw chicken breast',
    '豬肉': 'raw pork loin',
    '鮭魚': 'raw salmon fillet',
    '豆腐': 'silken tofu block',
    '吻仔魚': 'whitebait (tiny fish)',
    '牛肉': 'raw beef steak',
    '鯛魚': 'sea bream fillet',
    '鮪魚': 'tuna steak',
    '鱈魚': 'cod fillet',
    '干貝': 'scallops',
    '虱目魚': 'milkfish fillet',
    '豬肝': 'raw pork liver',
    '鱸魚': 'sea bass fillet',
    '鯖魚': 'mackerel fillet',
    '蝦仁': 'raw shrimp (peeled)',
    '蛤蜊': 'clams',
    '排骨': 'pork spare ribs',
    '培根': 'bacon strips',
    '毛豆': 'edamame beans',
    '皇帝豆': 'lima beans',
    '鷹嘴豆': 'chickpeas',
    '紅豆': 'red azuki beans',
    '綠豆': 'mung beans',
    '黑芝麻': 'black sesame seeds',
    '皮蛋': 'century egg (preserved egg)',
    '鹹蛋': 'salted duck egg',
    '柴魚': 'bonito flakes (katsuobushi)',

    // Dairy 乳製品
    '優格': 'plain yogurt in a bowl',
    '起司': 'cheese slices',
    '鮮奶': 'milk in a glass bottle',

    // Other 其他
    '味噌': 'miso paste',
    '滴雞精': 'chicken essence (liquid)',
};

// 讀取 JSON 檔案
const filePath = path.join(__dirname, 'src', 'data', 'ingredients_master.json');
const ingredients = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 生成 Markdown 表格
let markdown = `## Ingredient AI Image Prompts

> **Total:** ${ingredients.length} ingredients
> **Generated:** ${new Date().toISOString().split('T')[0]}

| ID | Name | AI Prompt (Copy this) |
| :--- | :--- | :--- |
`;

ingredients.forEach(ingredient => {
    const id = ingredient.id;
    const chineseName = ingredient.name;

    // 取得英文名稱
    let englishName = chineseToEnglish[chineseName];

    // 如果沒有對照，使用 ID 轉換 (kebab-case to Title Case)
    if (!englishName) {
        englishName = id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        // 標記需要手動翻譯
        englishName += ' ⚠️';
    }

    // 生成 Prompt
    const prompt = `A high-quality product photograph of raw ${englishName}, isolated on a completely transparent background, studio lighting, highly detailed, 8k resolution.`;

    markdown += `| \`${id}\` | ${chineseName} | \`${prompt}\` |\n`;
});

console.log(markdown);

// 同時輸出到檔案
fs.writeFileSync(path.join(__dirname, 'ingredient_prompts.md'), markdown, 'utf8');
console.log('\n\n✅ Prompts saved to: ingredient_prompts.md');
