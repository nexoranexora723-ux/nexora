import subprocess, hashlib, json, os
from concurrent.futures import ThreadPoolExecutor, as_completed

# Get 500 product hashes from DB
result = subprocess.run(['bun', 'run', '-e', '''
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
const products = await prisma.product.findMany({ select: { sku: true, name: true, imageUrl: true }, take: 500 })
const hashes = products.map(p => {
  const m = p.imageUrl?.match(/yupoo-img\\/([a-f0-9]+)\\//)
  return m ? { sku: p.sku, name: p.name.substring(0, 50), hash: m[1] } : null
}).filter(Boolean)
console.log(JSON.stringify(hashes))
await prisma.$disconnect()
'''], capture_output=True, text, timeout=30, cwd='/home/z/my-project')
# Can't run bun -e easily, let's use a different approach
# Just test 50 known hashes directly
