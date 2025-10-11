import { PrismaClient, OrderStatus, ReviewStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedShop() {
  console.log('🛒 Seeding shop data...');

  // Clear existing shop data
  console.log('🗑️  Clearing existing shop data...');
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();

  // Get existing users
  const users = await prisma.user.findMany();
  const admin = users.find(u => u.role === 'ADMIN')!;
  const regularUsers = users.filter(u => u.role === 'USER');

  if (regularUsers.length === 0) {
    console.log('⚠️  No regular users found. Please run the main seed first.');
    return;
  }

  // Get existing categories and products
  const categories = await prisma.category.findMany();
  const products = await prisma.product.findMany();

  if (categories.length === 0 || products.length === 0) {
    console.log('⚠️  No categories or products found. Please run the main seed first.');
    return;
  }

  // Create orders
  console.log('📦 Creating orders...');

  const orders = [];

  // Order 1: Delivered order
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-202401-0001',
      customerId: regularUsers[0].id,
      status: OrderStatus.DELIVERED,
      total: 1508,
      shippingStreet: '12 Rue de la Paix',
      shippingCity: 'Paris',
      shippingState: 'Île-de-France',
      shippingPostalCode: '75002',
      shippingCountry: 'France',
      createdAt: new Date('2024-03-10T14:30:00Z'),
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order1.id,
        productId: products[0].id,
        quantity: 1,
        price: products[0].price,
      },
      {
        orderId: order1.id,
        productId: products[1].id,
        quantity: 1,
        price: products[1].price,
      },
    ],
  });

  orders.push(order1);

  // Order 2: Shipped order
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-202403-0002',
      customerId: regularUsers.length > 1 ? regularUsers[1].id : regularUsers[0].id,
      status: OrderStatus.SHIPPED,
      total: products[2].price * 2,
      shippingStreet: '45 Avenue des Champs',
      shippingCity: 'Lyon',
      shippingState: 'Auvergne-Rhône-Alpes',
      shippingPostalCode: '69001',
      shippingCountry: 'France',
      createdAt: new Date('2024-03-20T09:15:00Z'),
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      productId: products[2].id,
      quantity: 2,
      price: products[2].price,
    },
  });

  orders.push(order2);

  // Order 3: Processing order
  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-202403-0003',
      customerId: regularUsers.length > 2 ? regularUsers[2].id : regularUsers[0].id,
      status: OrderStatus.PROCESSING,
      total: products[3].price + products[4].price,
      shippingStreet: '78 Boulevard Saint-Michel',
      shippingCity: 'Marseille',
      shippingState: 'Provence-Alpes-Côte d\'Azur',
      shippingPostalCode: '13001',
      shippingCountry: 'France',
      createdAt: new Date('2024-03-22T11:20:00Z'),
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order3.id,
        productId: products[3].id,
        quantity: 1,
        price: products[3].price,
      },
      {
        orderId: order3.id,
        productId: products[4].id,
        quantity: 1,
        price: products[4].price,
      },
    ],
  });

  orders.push(order3);

  // Order 4: Pending order
  const order4 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-202403-0004',
      customerId: regularUsers[0].id,
      status: OrderStatus.PENDING,
      total: products[5].price * 3,
      shippingStreet: '23 Rue Victor Hugo',
      shippingCity: 'Toulouse',
      shippingState: 'Occitanie',
      shippingPostalCode: '31000',
      shippingCountry: 'France',
      createdAt: new Date('2024-03-23T08:45:00Z'),
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order4.id,
      productId: products[5].id,
      quantity: 3,
      price: products[5].price,
    },
  });

  orders.push(order4);

  // Order 5: Cancelled order
  const order5 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-202403-0005',
      customerId: regularUsers.length > 1 ? regularUsers[1].id : regularUsers[0].id,
      status: OrderStatus.CANCELLED,
      total: products[6].price,
      shippingStreet: '56 Place de la République',
      shippingCity: 'Bordeaux',
      shippingState: 'Nouvelle-Aquitaine',
      shippingPostalCode: '33000',
      shippingCountry: 'France',
      createdAt: new Date('2024-03-19T15:30:00Z'),
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order5.id,
      productId: products[6].id,
      quantity: 1,
      price: products[6].price,
    },
  });

  orders.push(order5);

  console.log(`✅ Created ${orders.length} orders`);

  // Create reviews
  console.log('⭐ Creating reviews...');

  const reviews = [];

  // Review 1: 5 stars - Approved
  reviews.push(
    await prisma.review.create({
      data: {
        productId: products[0].id,
        customerId: regularUsers[0].id,
        rating: 5,
        comment: 'Excellent produit ! La qualité est exceptionnelle et correspond parfaitement à mes attentes. Je recommande vivement.',
        status: ReviewStatus.APPROVED,
        createdAt: new Date('2024-03-12T10:30:00Z'),
      },
    })
  );

  // Review 2: 5 stars - Approved
  reviews.push(
    await prisma.review.create({
      data: {
        productId: products[1].id,
        customerId: regularUsers.length > 1 ? regularUsers[1].id : regularUsers[0].id,
        rating: 5,
        comment: 'Incroyable performance ! Dépasse toutes mes attentes. Livraison rapide et produit bien emballé.',
        status: ReviewStatus.APPROVED,
        createdAt: new Date('2024-03-21T09:00:00Z'),
      },
    })
  );

  // Review 3: 4 stars - Approved
  reviews.push(
    await prisma.review.create({
      data: {
        productId: products[2].id,
        customerId: regularUsers.length > 2 ? regularUsers[2].id : regularUsers[0].id,
        rating: 4,
        comment: 'Bonne qualité, conforme à la description. Un petit bémol sur le délai de livraison mais le produit en vaut la peine.',
        status: ReviewStatus.APPROVED,
        createdAt: new Date('2024-03-15T14:20:00Z'),
      },
    })
  );

  // Review 4: 5 stars - Approved
  reviews.push(
    await prisma.review.create({
      data: {
        productId: products[3].id,
        customerId: regularUsers[0].id,
        rating: 5,
        comment: 'Après plusieurs semaines d\'utilisation, je ne regrette pas mon achat ! Excellente qualité et durabilité.',
        status: ReviewStatus.APPROVED,
        createdAt: new Date('2024-03-18T11:00:00Z'),
      },
    })
  );

  // Review 5: 4 stars - Approved
  reviews.push(
    await prisma.review.create({
      data: {
        productId: products[4].id,
        customerId: regularUsers.length > 1 ? regularUsers[1].id : regularUsers[0].id,
        rating: 4,
        comment: 'Très bon produit, fait le job. Le prix est un peu élevé mais la qualité est au rendez-vous.',
        status: ReviewStatus.APPROVED,
        createdAt: new Date('2024-03-20T09:45:00Z'),
      },
    })
  );

  // Review 6: 3 stars - Pending (needs moderation)
  reviews.push(
    await prisma.review.create({
      data: {
        productId: products[5].id,
        customerId: regularUsers.length > 2 ? regularUsers[2].id : regularUsers[0].id,
        rating: 3,
        comment: 'Le produit est correct mais j\'attendais mieux pour ce prix. Quelques défauts de finition.',
        status: ReviewStatus.PENDING,
        createdAt: new Date('2024-03-23T10:15:00Z'),
      },
    })
  );

  // Review 7: 2 stars - Approved (negative review)
  reviews.push(
    await prisma.review.create({
      data: {
        productId: products[6].id,
        customerId: regularUsers[0].id,
        rating: 2,
        comment: 'Déçu de la qualité. Le produit ne correspond pas à la description et présente des défauts.',
        status: ReviewStatus.APPROVED,
        createdAt: new Date('2024-03-14T13:30:00Z'),
      },
    })
  );

  // Review 8: 5 stars - Approved
  reviews.push(
    await prisma.review.create({
      data: {
        productId: products[7].id,
        customerId: regularUsers.length > 1 ? regularUsers[1].id : regularUsers[0].id,
        rating: 5,
        comment: 'Parfait ! Exactement ce que je cherchais. Le rapport qualité-prix est imbattable.',
        status: ReviewStatus.APPROVED,
        createdAt: new Date('2024-03-16T16:20:00Z'),
      },
    })
  );

  console.log(`✅ Created ${reviews.length} reviews`);

  console.log('✅ Shop seed completed successfully!');
}

async function main() {
  try {
    await seedShop();
  } catch (error) {
    console.error('❌ Error seeding shop data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
