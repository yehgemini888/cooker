
const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'Benson', 'Desktop', 'cooker', 'src', 'data', 'ingredients_master.json');

console.log(`Reading ${filePath}...`);
try {
    const data = fs.readFileSync(filePath, 'utf8');
    const ingredients = JSON.parse(data);

    let updatedCount = 0;
    ingredients.forEach(ingredient => {
        if (ingredient.id) {
            // Convert kebab-case to Title Case
            const titleName = ingredient.id
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            ingredient.imageUrl = `https://www.themealdb.com/images/ingredients/${titleName}.png`;
            updatedCount++;
        }
    });

    console.log(`Updated ${updatedCount} ingredients.`);
    fs.writeFileSync(filePath, JSON.stringify(ingredients, null, 4), 'utf8');
    console.log("Done.");

} catch (err) {
    console.error("Error:", err);
}
