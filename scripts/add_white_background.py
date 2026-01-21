import os
from PIL import Image

input_dir = 'src/assets/ingredients'
output_dir = 'src/assets/ingredients-white'

# Ensure output directory exists
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

print(f"Processing images from {input_dir} to {output_dir}...")

processed_count = 0

for filename in os.listdir(input_dir):
    if filename.lower().endswith('.png'):
        file_path = os.path.join(input_dir, filename)
        
        try:
            with Image.open(file_path) as img:
                # Ensure image has alpha channel
                img = img.convert("RGBA")
                
                # Create a white background image of the same size
                white_bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
                
                # Composite the ingredient image onto the white background
                # alpha_composite requires both images to be RGBA
                white_bg.alpha_composite(img)
                
                # Convert to RGB (removes alpha channel, final image is opaque)
                final_img = white_bg.convert("RGB")
                
                # Save to output directory
                output_path = os.path.join(output_dir, filename)
                final_img.save(output_path, "PNG")
                processed_count += 1
                
        except Exception as e:
            print(f"Error processing {filename}: {e}")

print(f"Done. Processed {processed_count} images.")
