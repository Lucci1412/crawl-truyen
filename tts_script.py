
import asyncio
import edge_tts
import sys
import os
import re

async def generate_audio(text, voice, rate, pitch, output_path):
    try:
        # Clean text - remove special characters that might cause issues
        # Keep original text without cleaning
        text = text.strip()
        
        # Ensure text is not empty
        if not text:
            print("Error: Empty text", file=sys.stderr)
            return False
        
        # Generate audio directly without length limits
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        await communicate.save(output_path)
        
        # Check if file was actually created and has content
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            return True
        else:
            print("Error: No audio was received. Please verify that your parameters are correct.", file=sys.stderr)
            return False
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return False

async def main():
    if len(sys.argv) != 6:
        print("Usage: python script.py <text> <voice> <rate> <pitch> <output_path>")
        sys.exit(1)
    
    text = sys.argv[1]
    voice = sys.argv[2]
    rate = sys.argv[3]
    pitch = sys.argv[4]
    output_path = sys.argv[5]
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Debug info
    print(f"Debug: text length = {len(text)}", file=sys.stderr)
    print(f"Debug: voice = {voice}", file=sys.stderr)
    print(f"Debug: rate = {rate}", file=sys.stderr)
    print(f"Debug: pitch = {pitch}", file=sys.stderr)
    print(f"Debug: output_path = {output_path}", file=sys.stderr)
    
    success = await generate_audio(text, voice, rate, pitch, output_path)
    if success:
        print("SUCCESS")
    else:
        print("FAILED")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
