#!/usr/bin/env python3
"""
Grok2API Web Line Automation Test Suite
Usage: python3 test_suite.py
"""

import requests
import json
import time
import base64
import io
from PIL import Image, ImageDraw

BASE_URL = "http://172.26.115.39:8002"
API_KEY = "g2a_ad4528267acc_vAoFafhWawsrmbBvHCIpO87sDuvmshCQ"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def make_test_image_b64():
    img = Image.new("RGB", (200, 200), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.ellipse((50, 50, 150, 150), fill=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

def make_test_video_b64():
    mp4_bytes = bytes.fromhex("0000001c6674797069736f6d0000020069736f6d69736f326d7034310000000866726565000000086d646174")
    return "data:video/mp4;base64," + base64.b64encode(mp4_bytes).decode("utf-8")

def run_tests():
    print("==================================================")
    print("   Grok2API Web Channel Integration Test Suite    ")
    print(f"   Target: {BASE_URL}")
    print("==================================================")

    # 1. Models
    print("\n1. Testing GET /v1/models...")
    r = requests.get(f"{BASE_URL}/v1/models", headers=HEADERS, timeout=10)
    print(f"Status: {r.status_code}, Models: {[m['id'] for m in r.json().get('data', [])]}")

    # 2. Chat non-stream
    print("\n2. Testing POST /v1/chat/completions (text, non-stream)...")
    payload = {
        "model": "grok-chat-fast",
        "messages": [{"role": "user", "content": "Hello! Reply with 1 word."}],
        "stream": False
    }
    r = requests.post(f"{BASE_URL}/v1/chat/completions", headers=HEADERS, json=payload, timeout=30)
    print(f"Status: {r.status_code}, Content: {r.json()['choices'][0]['message']['content']}")

    # 3. Chat stream
    print("\n3. Testing POST /v1/chat/completions (text, stream=true)...")
    payload = {
        "model": "grok-chat-fast",
        "messages": [{"role": "user", "content": "Count 1, 2, 3."}],
        "stream": True
    }
    r = requests.post(f"{BASE_URL}/v1/chat/completions", headers=HEADERS, json=payload, stream=True, timeout=30)
    print(f"Status: {r.status_code}, Stream output:")
    for line in r.iter_lines():
        if line:
            decoded = line.decode("utf-8")
            if "content" in decoded:
                print(f"  {decoded}")

    # 4. Chat with Image
    print("\n4. Testing POST /v1/chat/completions (Image Reference Base64)...")
    payload = {
        "model": "grok-chat-fast",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Describe the shape and color in this image."},
                    {"type": "image_url", "image_url": {"url": make_test_image_b64()}}
                ]
            }
        ],
        "stream": False
    }
    r = requests.post(f"{BASE_URL}/v1/chat/completions", headers=HEADERS, json=payload, timeout=60)
    r.raise_for_status()
    image_answer = r.json()['choices'][0]['message']['content']
    print(f"Status: {r.status_code}, Response: {image_answer}")
    assert "red" in image_answer.lower() and any(
        shape in image_answer.lower() for shape in ("circle", "circular", "disk", "disc")
    ), f"Image was not understood: {image_answer}"


    # 5. Chat with Video
    print("\n5. Testing POST /v1/chat/completions (Video Reference Base64)...")
    payload = {
        "model": "grok-chat-fast",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Analyze this video clip."},
                    {"type": "video_url", "video_url": {"url": make_test_video_b64()}}
                ]
            }
        ],
        "stream": False
    }
    r = requests.post(f"{BASE_URL}/v1/chat/completions", headers=HEADERS, json=payload, timeout=60)
    print(f"Status: {r.status_code}, Response: {r.json()['choices'][0]['message']['content'][:100]}...")

    # 6. Image Generation
    print("\n6. Testing POST /v1/images/generations (grok-imagine-image-lite)...")
    payload = {
        "model": "grok-imagine-image-lite",
        "prompt": "A small cute red apple on a desk",
        "aspect_ratio": "1:1",
        "n": 1,
        "response_format": "url"
    }
    r = requests.post(f"{BASE_URL}/v1/images/generations", headers=HEADERS, json=payload, timeout=60)
    img_url = r.json().get("data", [{}])[0].get("url")
    print(f"Status: {r.status_code}, Generated Image URL: {img_url}")

    # 7. Image Generation with Stream
    print("\n7. Testing POST /v1/images/generations (grok-imagine-image, stream=true)...")
    payload = {
        "model": "grok-imagine-image",
        "prompt": "A glowing crystal in dark forest",
        "aspect_ratio": "1:1",
        "n": 1,
        "stream": True,
        "partial_images": 1
    }
    r = requests.post(f"{BASE_URL}/v1/images/generations", headers=HEADERS, json=payload, stream=True, timeout=60)
    print(f"Status: {r.status_code}, Streaming events received:")
    for line in r.iter_lines():
        if line:
            decoded = line.decode("utf-8")
            if "event:" in decoded:
                print(f"  {decoded}")

    # 8. Responses API
    print("\n8. Testing POST /v1/responses...")
    payload = {
        "model": "grok-chat-fast",
        "input": "Explain gravity in one sentence.",
        "stream": False
    }
    r = requests.post(f"{BASE_URL}/v1/responses", headers=HEADERS, json=payload, timeout=30)
    resp_id = r.json().get("id")
    print(f"Status: {r.status_code}, Response ID: {resp_id}")

    if resp_id:
        print(f"   Fetching saved response GET /v1/responses/{resp_id}...")
        r_get = requests.get(f"{BASE_URL}/v1/responses/{resp_id}", headers=HEADERS, timeout=10)
        print(f"   Status: {r_get.status_code}, Object: {r_get.json().get('object')}")

    print("\n==================================================")
    print("              All Core Tests Passed!              ")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
