const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const dummyProducts = [
  {
    productId: 'BRG-LPT-001',
    category: 'Komputer & Perangkat Cerdas',
    subCategory: 'Laptop (Consumer, Gaming, Business)',
    name: 'Lenovo ThinkPad E14 Gen 4',
    spec: 'Intel Core i5-1235U, RAM 16GB DDR4, SSD 512GB NVMe, 14" FHD IPS, Win 11 Pro',
    qty: 8,
    costPrice: 9800000,
    sellPrice: 11500000,
    retailPrice: 12000000,
    warranty: '1 Tahun Resmi Lenovo'
  },
  {
    productId: 'BRG-LPT-002',
    category: 'Komputer & Perangkat Cerdas',
    subCategory: 'Laptop (Consumer, Gaming, Business)',
    name: 'ASUS ROG Strix G16 (2024)',
    spec: 'Intel Core i7-13650HX, RAM 16GB DDR5, SSD 1TB Gen4, RTX 4060 8GB, 16" QHD 240Hz',
    qty: 5,
    costPrice: 21500000,
    sellPrice: 24500000,
    retailPrice: 25000000,
    warranty: '2 Tahun Resmi ASUS'
  },
  {
    productId: 'BRG-PC-001',
    category: 'Komputer & Perangkat Cerdas',
    subCategory: 'Desktop PC (Branded, Custom Build, All-in-One, Mini PC)',
    name: 'PC Rakitan Office Core i5 Gen 12',
    spec: 'Core i5-12400, Mobo H610M, RAM 16GB DDR4, SSD NVMe 512GB, PSU 500W 80+, Casing Simbadda',
    qty: 12,
    costPrice: 5200000,
    sellPrice: 6400000,
    retailPrice: 6800000,
    warranty: '1 Tahun Garansi Toko'
  },
  {
    productId: 'BRG-CMP-001',
    category: 'Komponen PC (Hardware Internal)',
    subCategory: 'Penyimpanan Internal (SSD, HDD, NVMe)',
    name: 'Samsung 980 Pro M.2 NVMe Gen4 1TB',
    spec: 'Read up to 7,000 MB/s, Write up to 5,000 MB/s, PCIe 4.0 x4, TLC V-NAND',
    qty: 30,
    costPrice: 1450000,
    sellPrice: 1750000,
    retailPrice: 1850000,
    warranty: '5 Tahun Garansi Resmi'
  },
  {
    productId: 'BRG-CMP-002',
    category: 'Komponen PC (Hardware Internal)',
    subCategory: 'Memori (RAM)',
    name: 'Kingston FURY Beast DDR4 16GB (2x8GB) 3200MHz',
    spec: 'Dual Channel Kit, CL16-18-18, Low-profile Black Heat Spreader',
    qty: 25,
    costPrice: 580000,
    sellPrice: 720000,
    retailPrice: 780000,
    warranty: 'Lifetime Warranty'
  },
  {
    productId: 'BRG-NET-001',
    category: 'Jaringan & Keamanan (Networking)',
    subCategory: 'Router & Access Point',
    name: 'MikroTik RouterBOARD RB750Gr3 (hEX)',
    spec: '5x Gigabit Ethernet, Dual Core 880MHz, 256MB RAM, USB, microSD, RouterOS L4',
    qty: 20,
    costPrice: 720000,
    sellPrice: 875000,
    retailPrice: 925000,
    warranty: '1 Tahun Resmi'
  },
  {
    productId: 'BRG-NET-002',
    category: 'Jaringan & Keamanan (Networking)',
    subCategory: 'Switch & Hub',
    name: 'TP-Link TL-SG1016D 16-Port Gigabit Switch',
    spec: '16x 10/100/1000Mbps RJ45 Ports, Steel Case 13-inch Rackmount/Desktop, Plug and Play',
    qty: 10,
    costPrice: 850000,
    sellPrice: 1050000,
    retailPrice: 1150000,
    warranty: '1 Tahun Resmi'
  },
  {
    productId: 'BRG-PER-001',
    category: 'Periferal & Aksesoris',
    subCategory: 'Monitor & Proyektor',
    name: 'LG 24MP400-B 24" IPS Full HD Monitor',
    spec: '23.8" IPS 1080p, 75Hz, AMD FreeSync, OnScreen Control, HDMI & VGA, Wall Mountable',
    qty: 15,
    costPrice: 1200000,
    sellPrice: 1450000,
    retailPrice: 1550000,
    warranty: '3 Tahun Resmi LG'
  },
  {
    productId: 'BRG-PER-002',
    category: 'Periferal & Aksesoris',
    subCategory: 'Keyboard, Mouse & Mousepad',
    name: 'Logitech MK295 Silent Wireless Combo',
    spec: 'SilentTouch Tech, 2.4GHz Nano Receiver, Full-size Keyboard & Compact Mouse',
    qty: 35,
    costPrice: 360000,
    sellPrice: 450000,
    retailPrice: 490000,
    warranty: '1 Tahun Resmi'
  },
  {
    productId: 'BRG-PRN-001',
    category: 'Printer & Scanner',
    subCategory: 'Printer (Inkjet, Laser, Dot Matrix)',
    name: 'Epson EcoTank L3210 All-in-One Ink Tank',
    spec: 'Print, Scan, Copy, Spill-free Ink Refill, Borderless 4R, Heat-Free Technology',
    qty: 14,
    costPrice: 2100000,
    sellPrice: 2400000,
    retailPrice: 2500000,
    warranty: '2 Tahun Resmi Epson'
  }
];

async function main() {
  console.log('--- Menambahkan 10 Produk Dummy ke Database Stok ---');
  let createdCount = 0;
  let updatedCount = 0;

  for (const item of dummyProducts) {
    const existing = await prisma.product.findUnique({
      where: { productId: item.productId }
    });

    if (existing) {
      await prisma.product.update({
        where: { productId: item.productId },
        data: item
      });
      console.log(`[UPDATE] ${item.productId} - ${item.name}`);
      updatedCount++;
    } else {
      await prisma.product.create({
        data: item
      });
      console.log(`[INSERT] ${item.productId} - ${item.name}`);
      createdCount++;
    }
  }

  const total = await prisma.product.count();
  console.log(`\nSelesai! Berhasil membuat ${createdCount} baru, memperbarui ${updatedCount}. Total produk di database: ${total}`);
}

main()
  .catch((err) => {
    console.error('Error saat seeding dummy produk:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
