const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.create({
  data: {
    productId: '1',
    category: 'Suku Cadang & Peralatan Servis',
    subCategory: 'Suku Cadang Komputer & Laptop',
    name: 'Battery Cmos Panasonic',
    spec: '',
    qty: 10,
    sellPrice: 7000,
    costPrice: 6000,
    retailPrice: 0,
    warranty: ''
  }
}).then(console.log).catch(console.error).finally(() => prisma.$disconnect());
