import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const productsData = [
  { category: 'Laptop', brand: 'Asus', name: 'Asus ROG Strix G15', modelType: 'G513RC', spec: 'Ryzen 7 6800H, 16GB RAM, 512GB SSD, RTX 3050', costPrice: 13500000, sellPrice: 15000000 },
  { category: 'Laptop', brand: 'Lenovo', name: 'Lenovo Legion 5', modelType: '15ARH7H', spec: 'Ryzen 5 6600H, 16GB RAM, 512GB SSD, RTX 3050Ti', costPrice: 14000000, sellPrice: 15500000 },
  { category: 'Laptop', brand: 'Acer', name: 'Acer Nitro 5', modelType: 'AN515-58', spec: 'Intel Core i5-12500H, 8GB RAM, 512GB SSD, RTX 3050', costPrice: 11500000, sellPrice: 12500000 },
  { category: 'Laptop', brand: 'HP', name: 'HP Victus 15', modelType: 'fa0011TX', spec: 'Intel Core i5-12450H, 8GB RAM, 512GB SSD, GTX 1650', costPrice: 10000000, sellPrice: 11000000 },
  { category: 'Laptop', brand: 'Apple', name: 'MacBook Air M1', modelType: 'MGN63ID/A', spec: 'Apple M1, 8GB RAM, 256GB SSD', costPrice: 12500000, sellPrice: 13800000 },
  { category: 'Laptop', brand: 'Dell', name: 'Dell XPS 13', modelType: '9315', spec: 'Intel Core i7-1250U, 16GB RAM, 512GB SSD', costPrice: 19000000, sellPrice: 21500000 },
  { category: 'Monitor', brand: 'LG', name: 'LG 24MP400', modelType: '24MP400-B', spec: '24" IPS FHD 75Hz', costPrice: 1200000, sellPrice: 1450000 },
  { category: 'Monitor', brand: 'Samsung', name: 'Samsung Odyssey G3', modelType: 'LS24AG320', spec: '24" VA FHD 165Hz', costPrice: 2100000, sellPrice: 2450000 },
  { category: 'Monitor', brand: 'AOC', name: 'AOC 24G2SE', modelType: '24G2SE', spec: '24" VA FHD 165Hz', costPrice: 1950000, sellPrice: 2200000 },
  { category: 'Monitor', brand: 'ViewSonic', name: 'ViewSonic VX2418-P-MHD', modelType: 'VX2418', spec: '24" VA FHD 165Hz', costPrice: 2000000, sellPrice: 2300000 },
  { category: 'Monitor', brand: 'BenQ', name: 'BenQ ZOWIE XL2411K', modelType: 'XL2411K', spec: '24" TN FHD 144Hz', costPrice: 3200000, sellPrice: 3550000 },
  { category: 'Printer', brand: 'Epson', name: 'Epson EcoTank L3210', modelType: 'L3210', spec: 'Print, Scan, Copy', costPrice: 2100000, sellPrice: 2350000 },
  { category: 'Printer', brand: 'Canon', name: 'Canon PIXMA G2020', modelType: 'G2020', spec: 'Print, Scan, Copy', costPrice: 1800000, sellPrice: 2050000 },
  { category: 'Printer', brand: 'HP', name: 'HP Smart Tank 580', modelType: '580', spec: 'Print, Scan, Copy, WiFi', costPrice: 2050000, sellPrice: 2300000 },
  { category: 'Printer', brand: 'Brother', name: 'Brother DCP-T420W', modelType: 'DCP-T420W', spec: 'Print, Scan, Copy, WiFi', costPrice: 2150000, sellPrice: 2400000 },
  { category: 'Accessories', brand: 'Logitech', name: 'Logitech G102 Lightsync', modelType: 'G102', spec: 'Wired Gaming Mouse 8000 DPI', costPrice: 200000, sellPrice: 265000 },
  { category: 'Accessories', brand: 'Logitech', name: 'Logitech MX Master 3S', modelType: 'MX Master 3S', spec: 'Wireless Mouse', costPrice: 1350000, sellPrice: 1600000 },
  { category: 'Accessories', brand: 'Razer', name: 'Razer Viper Mini', modelType: 'Viper Mini', spec: 'Wired Gaming Mouse', costPrice: 350000, sellPrice: 420000 },
  { category: 'Accessories', brand: 'Keychron', name: 'Keychron K2 V2', modelType: 'K2 V2', spec: 'Wireless Mechanical Keyboard', costPrice: 1100000, sellPrice: 1350000 },
  { category: 'Accessories', brand: 'Rexus', name: 'Rexus Daixa M71', modelType: 'Daixa M71', spec: 'Wired Mechanical Keyboard', costPrice: 320000, sellPrice: 415000 },
  { category: 'Accessories', brand: 'Fantech', name: 'Fantech Maxfit61', modelType: 'Maxfit61', spec: '60% Mechanical Keyboard', costPrice: 450000, sellPrice: 550000 },
  { category: 'Accessories', brand: 'HyperX', name: 'HyperX Cloud Stinger 2', modelType: 'Stinger 2', spec: 'Gaming Headset', costPrice: 550000, sellPrice: 680000 },
  { category: 'Networking', brand: 'TP-Link', name: 'TP-Link Archer C6', modelType: 'Archer C6', spec: 'AC1200 Wireless MU-MIMO Gigabit Router', costPrice: 400000, sellPrice: 495000 },
  { category: 'Networking', brand: 'TP-Link', name: 'TP-Link TL-SG105', modelType: 'TL-SG105', spec: '5-Port Gigabit Desktop Switch', costPrice: 180000, sellPrice: 220000 },
  { category: 'Networking', brand: 'Tenda', name: 'Tenda AC1200', modelType: 'AC5', spec: 'Smart Dual-Band WiFi Router', costPrice: 210000, sellPrice: 280000 },
  { category: 'Networking', brand: 'MikroTik', name: 'MikroTik hAP lite', modelType: 'RB941-2nD', spec: 'Home Access Point lite', costPrice: 310000, sellPrice: 375000 },
  { category: 'Networking', brand: 'Ubiquiti', name: 'Ubiquiti UniFi AP AC Lite', modelType: 'UAP-AC-LITE', spec: '802.11ac Dual Radio Access Point', costPrice: 1550000, sellPrice: 1750000 },
  { category: 'Sparepart', brand: 'Intel', name: 'Intel Core i5-12400F', modelType: 'i5-12400F', spec: '6 Cores, 12 Threads, up to 4.4 GHz', costPrice: 2200000, sellPrice: 2450000 },
  { category: 'Sparepart', brand: 'AMD', name: 'AMD Ryzen 5 5600X', modelType: 'Ryzen 5 5600X', spec: '6 Cores, 12 Threads, up to 4.6 GHz', costPrice: 2350000, sellPrice: 2600000 },
  { category: 'Sparepart', brand: 'MSI', name: 'MSI PRO B660M-A DDR4', modelType: 'PRO B660M-A', spec: 'LGA 1700, Micro-ATX', costPrice: 1900000, sellPrice: 2100000 },
  { category: 'Sparepart', brand: 'ASRock', name: 'ASRock B550M Pro4', modelType: 'B550M Pro4', spec: 'AM4, Micro-ATX', costPrice: 1450000, sellPrice: 1650000 },
  { category: 'Sparepart', brand: 'Corsair', name: 'Corsair Vengeance LPX 16GB (2x8GB) DDR4 3200MHz', modelType: 'CMK16GX4M2B3200C16', spec: 'DDR4 3200MHz', costPrice: 650000, sellPrice: 780000 },
  { category: 'Sparepart', brand: 'Kingston', name: 'Kingston FURY Beast 16GB (2x8GB) DDR4 3200MHz', modelType: 'KF432C16BBK2/16', spec: 'DDR4 3200MHz', costPrice: 620000, sellPrice: 750000 },
  { category: 'Sparepart', brand: 'Samsung', name: 'Samsung 980 500GB', modelType: 'MZ-V8V500BW', spec: 'NVMe M.2 SSD', costPrice: 750000, sellPrice: 900000 },
  { category: 'Sparepart', brand: 'WD', name: 'WD Blue SN570 500GB', modelType: 'WDS500G3B0C', spec: 'NVMe M.2 SSD', costPrice: 650000, sellPrice: 780000 },
  { category: 'Sparepart', brand: 'Seagate', name: 'Seagate BarraCuda 1TB', modelType: 'ST1000DM010', spec: '3.5" HDD 7200RPM', costPrice: 580000, sellPrice: 690000 },
  { category: 'Sparepart', brand: 'Corsair', name: 'Corsair CV550', modelType: 'CP-9020210-WW', spec: '550W 80 Plus Bronze', costPrice: 720000, sellPrice: 850000 },
  { category: 'Sparepart', brand: 'FSP', name: 'FSP HV PRO 550W', modelType: 'FSP550-51AAC', spec: '550W 80+ White', costPrice: 580000, sellPrice: 690000 },
  { category: 'Sparepart', brand: 'Deepcool', name: 'Deepcool AK400', modelType: 'AK400', spec: 'CPU Air Cooler', costPrice: 350000, sellPrice: 450000 },
  { category: 'Sparepart', brand: 'NZXT', name: 'NZXT H510 Flow', modelType: 'CA-H52FB-01', spec: 'Compact ATX Mid-Tower Case', costPrice: 1200000, sellPrice: 1450000 }
]

async function main() {
  console.log('Seeding products...')
  
  // Clear existing products if any
  await prisma.product.deleteMany()
  
  let count = 0
  for (const p of productsData) {
    count++
    const productId = `ITM-${count.toString().padStart(3, '0')}`
    
    // Random QTY between 5 and 50
    const qty = Math.floor(Math.random() * 46) + 5
    
    await prisma.product.create({
      data: {
        productId,
        category: p.category,
        subCategory: p.brand,
        name: p.name,
        spec: p.spec,
        qty: qty,
        costPrice: p.costPrice,
        sellPrice: p.sellPrice,
        retailPrice: p.sellPrice * 1.1,
        warranty: '1 Tahun'
      }
    })
  }
  
  console.log(`Successfully seeded ${productsData.length} products.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
