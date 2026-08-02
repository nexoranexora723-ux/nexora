#!/usr/bin/env python3
"""Download all images for the top 20 products to public/products/top20/"""
import json, subprocess, os, sys
from concurrent.futures import ThreadPoolExecutor, as_completed

CD = '/home/z/my-project'
OUT_DIR = f'{CD}/public/products/top20'
os.makedirs(OUT_DIR, exist_ok=True)

# Product data: sku -> {name, hashes}
products = [
    {'sku': 'YP-135911334', 'name': 'LV-ZIPPY-Wallet', 'hash': 'bc698430', 'gallery': 121},
    {'sku': 'YP-135911793', 'name': 'LV-ZIPPY-Coin-Purse', 'hash': '19389aaa', 'gallery': 67},
    {'sku': 'YP-182425674', 'name': 'Gucci-Tote-Bag', 'hash': '780e18d4', 'gallery': 10},
    {'sku': 'YP-221612364', 'name': 'Dior-Bag', 'hash': '85002452', 'gallery': 10},
    {'sku': 'YP-187112537', 'name': 'DG-Bag', 'hash': '344294fa', 'gallery': 10},
    {'sku': 'YP-246144864', 'name': 'Loewe-Shoes', 'hash': 'f1c8d0330d', 'gallery': 10},
    {'sku': 'YP-197961911', 'name': 'Gucci-Sneakers', 'hash': 'a4e27e2b', 'gallery': 9},
    {'sku': 'YP-88697449', 'name': 'LV-Shoes', 'hash': '21e3ded7', 'gallery': 10},
    {'sku': 'YP-246379286', 'name': 'Hermes-Shoes', 'hash': '8774ee3508', 'gallery': 10},
    {'sku': 'YP-235747004', 'name': 'Vacheron-Constantin', 'hash': '916236e48c', 'gallery': 10},
    {'sku': 'YP-208057007', 'name': 'Gucci-Glasses', 'hash': '09f38f40', 'gallery': 8},
    {'sku': 'YP-209951728', 'name': 'Prada-Glasses', 'hash': 'ded2c55c', 'gallery': 10},
    {'sku': 'YP-107242645', 'name': 'Balenciaga', 'hash': 'c91f61e7', 'gallery': 1},
    {'sku': 'YP-107827821', 'name': 'Burberry', 'hash': '94bc8d5f', 'gallery': 1},
    {'sku': 'YP-107827808', 'name': 'Prada-Guide', 'hash': 'a8f4af6e', 'gallery': 1},
    {'sku': 'YP-107240509', 'name': 'North-Face', 'hash': '9e5a7657', 'gallery': 1},
    {'sku': 'YP-175388179', 'name': 'Flamengo-Jersey', 'hash': 'ace740b2', 'gallery': 10},
]

def download_image(sku, name, hash_id, idx, total):
    """Download a single image"""
    url = f'https://photo.yupoo.com/paypalshop/{hash_id}/big.jpg'
    outfile = f'{OUT_DIR}/{name}-{idx}.jpg'
    
    if os.path.exists(outfile) and os.path.getsize(outfile) > 5000:
        return True
    
    try:
        r = subprocess.run([
            'curl', '-s', '-o', outfile,
            '-H', 'Referer: https://paypalshop.x.yupoo.com/',
            '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            '--max-time', '20',
            url
        ], capture_output=True, timeout=30)
        
        size = os.path.getsize(outfile) if os.path.exists(outfile) else 0
        if size < 5000:
            if os.path.exists(outfile):
                os.remove(outfile)
            # Try medium instead of big
            url_med = f'https://photo.yupoo.com/paypalshop/{hash_id}/medium.jpg'
            subprocess.run([
                'curl', '-s', '-o', outfile,
                '-H', 'Referer: https://paypalshop.x.yupoo.com/',
                '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                '--max-time', '20',
                url_med
            ], capture_output=True, timeout=30)
            size = os.path.getsize(outfile) if os.path.exists(outfile) else 0
            if size < 5000:
                return False
        return True
    except:
        return False

# Build download list
download_list = []
for p in products:
    # Cover image (index 0)
    download_list.append((p['sku'], p['name'], p['hash'], 0, 1))
    # We only download cover for now (gallery would need fetching album pages)
    # For products with gallery > 1, we'd need to fetch the album page first

print(f"Downloading {len(download_list)} cover images for {len(products)} top products...")
print(f"Output: {OUT_DIR}/")

ok = 0
fail = 0
with ThreadPoolExecutor(max_workers=10) as ex:
    futs = {ex.submit(download_image, sku, name, h, idx, total): (sku, name, idx) for sku, name, h, idx, total in download_list}
    for fut in as_completed(futs):
        sku, name, idx = futs[fut]
        if fut.result():
            ok += 1
            print(f"  ✓ {name}-{idx}.jpg")
        else:
            fail += 1
            print(f"  ✗ {name}-{idx}.jpg")

print(f"\n=== DONE: {ok} downloaded, {fail} failed ===")
print(f"Files in {OUT_DIR}: {len(os.listdir(OUT_DIR))}")
