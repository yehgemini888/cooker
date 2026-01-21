
import json
import os

file_path = r'c:\Users\Benson\Desktop\cooker\src\data\ingredients_master.json'

mapping = {
  "bok-choy": "https://www.themealdb.com/images/ingredients/Pak Choi.png",
  "rice-noodle": "https://www.themealdb.com/images/ingredients/Rice Vermicelli.png",
  "glass-noodle": "https://www.themealdb.com/images/ingredients/Glass Noodles.png",
  "soy-sauce": "https://www.themealdb.com/images/ingredients/Soy Sauce.png",
  "scallop": "https://www.themealdb.com/images/ingredients/Scallops.png",
  "pork-ribs": "https://www.themealdb.com/images/ingredients/Pork.png",
  "chicken-essence": "https://cdn-icons-png.flaticon.com/512/3058/3058995.png", 
  "whitebait": "https://cdn-icons-png.flaticon.com/512/2970/2970094.png",
  "milkfish": "https://cdn-icons-png.flaticon.com/512/3065/3065584.png",
  "clam": "https://cdn-icons-png.flaticon.com/512/2906/2906334.png",
  "pork-liver": "https://cdn-icons-png.flaticon.com/512/7222/7222067.png",
  "winter-melon": "https://www.themealdb.com/images/ingredients/Cantaloupe.png", 
  "luffa": "https://www.themealdb.com/images/ingredients/Zucchini.png",
  "kelp": "https://cdn-icons-png.flaticon.com/512/3361/3361370.png",
  "seaweed": "https://cdn-icons-png.flaticon.com/512/7518/7518597.png",
  "bonito": "https://cdn-icons-png.flaticon.com/512/8662/8662369.png",
  "mantou": "https://cdn-icons-png.flaticon.com/512/1037/1037675.png",
  "wonton-wrapper": "https://www.themealdb.com/images/ingredients/Wonton Wrappers.png"
}

print(f"Reading {file_path}...")
with open(file_path, 'r', encoding='utf-8') as f:
    ingredients = json.load(f)

updated_count = 0
for ingredient in ingredients:
    ing_id = ingredient.get('id')
    if ing_id in mapping:
        print(f"Updating {ing_id} -> {mapping[ing_id]}")
        ingredient['imageUrl'] = mapping[ing_id]
        updated_count += 1

print(f"Updated {updated_count} ingredients based on manual mapping.")

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(ingredients, f, indent=4, ensure_ascii=False)

print("Done.")
