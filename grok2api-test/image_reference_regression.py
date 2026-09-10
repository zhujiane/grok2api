#!/usr/bin/env python3
"""Verify actual visual understanding. Set GROK2API_BASE_URL and GROK2API_API_KEY."""
import base64
import io
import json
import os
import time

import requests
from PIL import Image, ImageDraw, ImageFont


def fixture(color, shape):
    image = Image.new('RGB', (400, 400), 'white')
    draw = ImageDraw.Draw(image)
    if shape == 'bottle':
        draw.rounded_rectangle((115, 85, 285, 355), radius=30, fill=color)
        draw.rectangle((150, 40, 250, 90), fill='black')
        draw.rectangle((120, 165, 280, 270), fill='white')
        font = ImageFont.truetype('DejaVuSans.ttf', 26)
        draw.text((127, 180), 'AURORA', fill='black', font=font)
        draw.text((140, 225), '500 mL', fill='black', font=font)
    elif shape == 'circle':
        draw.ellipse((60, 60, 340, 340), fill=color)
    else:
        draw.rectangle((60, 60, 340, 340), fill=color)
    output = io.BytesIO()
    image.save(output, format='PNG')
    return 'data:image/png;base64,' + base64.b64encode(output.getvalue()).decode()


def run():
    base = os.environ.get('GROK2API_BASE_URL', 'http://172.26.115.39:8002').rstrip('/')
    headers = {'Authorization': 'Bearer ' + os.environ['GROK2API_API_KEY']}
    results = []
    for color, shape, stream in [('red', 'circle', False), ('blue', 'square', True), ('green', 'bottle', False)]:
        start = time.monotonic()
        response = requests.post(base + '/v1/chat/completions', headers=headers, json={
            'model': 'grok-chat-fast', 'stream': stream,
            'messages': [{'role': 'user', 'content': [
                {'type': 'text', 'text': ('参考图像 ，生成一段 产品介绍文章 ， 200字' if shape == 'bottle' else 'Describe the shape and color in this image in English.')},
                {'type': 'image_url', 'image_url': {'url': fixture(color, shape)}},
            ]}],
        }, stream=stream, timeout=90)
        response.raise_for_status()
        if stream:
            parts = []
            done = False
            for line in response.iter_lines(decode_unicode=True):
                if not line or not line.startswith('data: '):
                    continue
                data = line[6:]
                if data == '[DONE]':
                    done = True
                    break
                event = json.loads(data)
                assert 'error' not in event, event
                for choice in event.get('choices', []):
                    parts.append(choice.get('delta', {}).get('content', '') or '')
            assert done, 'SSE ended without [DONE]'
            answer = ''.join(parts)
        else:
            answer = response.json()['choices'][0]['message']['content']
        shapes = ('circle', 'circular', 'disk', 'disc') if shape == 'circle' else ('square',)
        passed = color in answer.lower() and any(s in answer.lower() for s in shapes)
        if shape == 'bottle':
            passed = 'AURORA' in answer.upper() and '500' in answer and '绿' in answer
        result = {'color': color, 'shape': shape, 'stream': stream,
                  'status': response.status_code, 'seconds': round(time.monotonic() - start, 2),
                  'passed': passed, 'answer': answer}
        print(json.dumps(result, ensure_ascii=False), flush=True)
        results.append(result)
    assert all(r['passed'] for r in results), 'Image understanding regression'


if __name__ == '__main__':
    run()
