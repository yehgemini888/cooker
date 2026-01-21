
import json
import os

file_path = r'c:\Users\Benson\Desktop\cooker\src\data\ingredients_master.json'

def kebab_to_title(text):
    return ' '.join(word.capitalize() for word in text.split('-'))

print(f"Reading {file_path}...")
with open(file_path, 'r', encoding='utf-8') as f:
    ingredients = json.load(f)

updated_count = 0
for ingredient in ingredients:
    # Convert ID to Title Case
    # Special fix for some known discrepancies if needed, but per instructions we do algorithmic map first
    # e.g. "purple-rice" -> "Purple Rice"
    
    # Check if we should skip manual logic? No, update ALL per instructions.
    
    raw_id = ingredient.get('id', '')
    if raw_id:
        title_name = kebab_to_title(raw_id)
        
        # Specific TheMealDB naming conventions often use specific spellings
        # But we start with the requested rule.
        
        new_url = f"https://www.themealdb.com/images/ingredients/{title_name}.png"
        ingredient['imageUrl'] = new_url
        updated_count += 1

print(f"Updated {updated_count} ingredients.")

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(ingredients, f, indent=4, ensure_ascii=False)

print("Done.")
