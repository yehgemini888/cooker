/**
 * 更新 ingredients_master.json 中的 imageUrl 路徑
 * 將所有 imageUrl 改為指向本地 assets 資料夾中的圖片
 * 
 * 使用方式: node scripts/update-image-paths.js
 */

const fs = require('fs');
const path = require('path');

// 設定路徑
const JSON_PATH = path.join(__dirname, '../src/data/ingredients_master.json');
const IMAGES_DIR = path.join(__dirname, '../src/assets/ingredients');

// 讀取 JSON 檔案
console.log('📖 讀取 ingredients_master.json...');
const ingredients = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// 取得所有可用的圖片檔案
const availableImages = new Set(
    fs.readdirSync(IMAGES_DIR)
        .filter(f => f.endsWith('.png'))
        .map(f => f.replace('.png', ''))
);

console.log(`🖼️  找到 ${availableImages.size} 張本地圖片`);

// 統計資訊
let updated = 0;
let missing = [];

// 更新每個食材的 imageUrl
ingredients.forEach(ingredient => {
    const id = ingredient.id;

    if (availableImages.has(id)) {
        // 有對應的本地圖片，更新路徑
        ingredient.imageUrl = `/src/assets/ingredients/${id}.png`;
        updated++;
    } else {
        // 沒有對應的本地圖片，記錄下來
        missing.push({
            id: id,
            name: ingredient.name,
            currentUrl: ingredient.imageUrl
        });
    }
});

// 寫回 JSON 檔案
console.log('\n💾 寫入更新後的 JSON...');
fs.writeFileSync(JSON_PATH, JSON.stringify(ingredients, null, 4), 'utf-8');

// 輸出結果
console.log('\n✅ 更新完成！');
console.log(`   已更新: ${updated} 個食材`);
console.log(`   缺少圖片: ${missing.length} 個食材`);

if (missing.length > 0) {
    console.log('\n⚠️  以下食材缺少本地圖片，仍使用原始 URL:');
    missing.forEach(m => {
        console.log(`   - ${m.id} (${m.name})`);
    });
}
