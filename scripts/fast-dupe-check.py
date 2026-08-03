import subprocess, hashlib, os, json
from concurrent.futures import ThreadPoolExecutor, as_completed

# Get hashes from DB
result = subprocess.run(['bun', 'run', '-e', '''
const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()
async function main() {
  const products = await prisma.product.findMany({ select: { sku: true, name: true, imageUrl: true }, take: 300 })
  const hashes = []
  for (const p of products) {
    const m = p.imageUrl?.match(/yupoo-img\\/([a-f0-9]+)\\//)
    if (m) hashes.push({ hash: m[1], sku: p.sku, name: p.name.substring(0, 50) })
  }
  console.log(JSON.stringify(hashes))
  await prisma.$disconnect()
}
main()
'''], capture_output=True, text, timeout=30, cwd='/home/z/my-project', env={**os.environ, 'DATABASE_URL': 'postgresql://neondb_owner:npg_GRnEhQ0cN3Am@ep-lucky-pine-axg8brc6-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require'})

# Hmm bun -e might not work, let's try a different approach
# Just get hashes from the API
print("Getting products from API...")
resp = subprocess.run(['curl', '-s', '--max-time', '15', 'https://nexora-inky-mu.vercel.app/api/products?limit=300'], capture_output=True, text=True, timeout=20)
data = json.loads(resp.stdout)
products = data.get('products', [])
print(f"Got {len(products)} products")

# Extract hashes
hash_list = []
for p in products:
    img = p.get('imageUrl', '')
    if '/yupoo-img/' in img:
        hash_val = img.split('/yupoo-img/')[1].split('/')[0]
        hash_list.append({'hash': hash_val, 'sku': p['sku'], 'name': p['name'][:50]})

print(f"Hashes to check: {len(hash_list)}")

# Download and compare
def check_image(item):
    h = item['hash']
    try:
        r = subprocess.run(['curl', '-s', '--max-time', '10', f'https://nexora-inky-mu.vercel.app/api/yupoo-img/{h}/big'], capture_output=True, timeout=15)
        if len(r.stdout) < 5000:
            return None
        md5 = hashlib.md5(r.stdout).hexdigest()
        return {'md5': md5, 'hash': h, 'sku': item['sku'], 'name': item['name'], 'size': len(r.stdout)}
    except:
        return None

print("Downloading and comparing images...")
results = []
with ThreadPoolExecutor(max_workers=20) as ex:
    futs = {ex.submit(check_image, item): item for item in hash_list}
    for fut in as_completed(futs):
        r = fut.result()
        if r:
            results.append(r)

print(f"\nChecked: {len(results)} images")

# Find duplicates
md5_map = {}
for r in results:
    if r['md5'] not in md5_map:
        md5_map[r['md5']] = []
    md5_map[r['md5']].append(r)

dupes = {k: v for k, v in md5_map.items() if len(v) > 1}
print(f"Unique images: {len(md5_map)}")
print(f"DUPLICATE groups: {len(dupes)}")

if dupes:
    total_dup = 0
    skus_to_delete = []
    print("\n=== DUPLICATES FOUND ===")
    for md5, items in dupes.items():
        total_dup += len(items)
        print(f"\nMD5: {md5[:16]}... ({len(items)} products with SAME image):")
        for item in items:
            print(f"  {item['sku']}: {item['name']} | hash: {item['hash']} | size: {item['size']}")
        # Keep first, delete rest
        for item in items[1:]:
            skus_to_delete.append(item['sku'])
    
    print(f"\nTotal products with duplicate image: {total_dup}")
    print(f"Products to DELETE: {len(skus_to_delete)}")
    
    # Save for deletion
    with open('/tmp/skus-to-delete.json', 'w') as f:
        json.dump(skus_to_delete, f)
    print(f"\nSaved to /tmp/skus-to-delete.json")
else:
    print("\nNo duplicates found in first 300 products.")
