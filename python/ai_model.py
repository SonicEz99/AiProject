import sys
import json
from PIL import Image

def process_image(image_path):
    try:
        # Open and process the image
        image = Image.open(image_path)
        
        # Your AI model processing code here
        # This is just a placeholder result
        result = {
            "result": "Example detection",
            "confidence": 0.95
        }
        
        return result
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        result = process_image(image_path)
        # Print JSON output that can be parsed by Node.js
        print(json.dumps(result))