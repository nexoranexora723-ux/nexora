#!/usr/bin/env python3
"""Download gallery images for top 20 products by fetching album pages"""
import json, re, subprocess, os
from concurrent.futures import ThreadPoolExecutor, as_completed

CD = '/home/z/my-project'
OUT_DIR = f'{CD}/public/products/top20'
os.makedirs(OUT_DIR, exist_ok=True)

# Products with their album IDs and Yupoo category IDs
products = [
    {'sku': 'YP-182425674', 'name': 'Gucci-Tote-Bag', 'album_id': '182425674', 'cat': '3478225'},
    {'sku': 'YP-221612364', 'name': 'Dior-Bag', 'album_id': '221612364', 'cat': '3477366'},
    {'sku': 'YP-197961911', 'name': 'Gucci-Sneakers', 'album_id': '197961911', 'cat': '3832718'},
    {'sku': 'YP-88697449', 'name': 'LV-Shoes', 'album_id': '88697449', 'cat': '2865347'},
    {'sku': 'YP-246144864', 'name': 'Loewe-Shoes', 'album_id': '246144864', 'cat': '2871173'},
    {'sku': 'YP-246379286', 'name': 'Hermes-Shoes', 'album_id': '246379286', 'cat': '5280335'},
    {'sku': 'YP-235747004', 'name': 'Vacheron-Constantin', 'album_id': '235747004', 'cat': '3102018'},
    {'sku': 'YP-208057007', 'name': 'Gucci-Glasses', 'album_id': '208057007', 'cat': '2865360'},
    {'sku': 'YP-209951728', 'name': 'Prada-Glasses', 'album_id': '209951728', 'cat': '36036'},
    {'sku': 'YP-175388179', 'name': 'Flamengo-Jersey', 'album_id': '175388179', 'cat': '2965852'},
    {'sku': 'YP-187112537', 'name': 'DG-Bag', 'album_id': '187112537', 'cat': '3478225'},
]

big_pattern = re.compile(r'photo\.yupoo\.com/paypalshop/([a-f0-9]+)/big\.', re.IGNORECASE)

def fetch_and_download(product):
    name = product['name']
    album_id = product['album_id']
    cat = product['cat']
    url = f'https://paypalshop.x.yupoo.com/albums/{album_id}?uid=1&isSubCate=false&referrercate={cat}'
    
    try:
        r = subprocess.run(['curl', '-s', '-H', 'Referer: https://paypalshop.x.yupoo.com/albums',
            '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            '--max-time', '20', url], capture_output=True, timeout=30)
        body = r.stdout.decode('utf-8', errors='replace')
        
        hashes = list(dict.fromkeys(big_pattern.findall(body)))
        if not hashes:
            return (name, 0, 0)
        
        downloaded = 0
        for idx, h in enumerate(hashes[:10]):  # max 10 photos
            outfile = f'{OUT_DIR}/{name}-{idx+1}.jpg'
            if os.path.exists(outfile) and os.path.getsize(outfile) > 5000:
                downloaded += 1
                continue
            img_url = f'https://photo.yupoo.com/paypalshop/{h}/big.jpg'
            r2 = subprocess.run(['curl', '-s', '-o', outfile,
                '-H', 'Referer: https://paypalshop.x.yupoo.com/',
                '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                '--max-time', '15', img_url], capture_output=True, timeout=25)
            size = os.path.getsize(outfile) if os.path.exists(outfile) else 0
            if size > 5000:
                downloaded += 1
            else:
                if os.path.exists(outfile): os.remove(outfile)
        
        return (name, len(hashes), downloaded)
    except Exception as e:
        return (name, 0, 0)

print(f"Downloading galleries for {len(products)} products...")
total_photos = 0
with ThreadPoolExecutor(max_workers=5) as ex:
    futs = {ex.submit(fetch_and_download, p): p for p in products}
    for fut in as_completed(futs):
        name, found, downloaded = fut.result()
        total_photos += downloaded
        print(f"  {name}: {found} found, {downloaded} downloaded")

print(f"\n=== TOTAL: {total_photos} gallery images downloaded ===")
print(f"Total files in {OUT_DIR}: {len(os.listdir(OUT_DIR))}")
