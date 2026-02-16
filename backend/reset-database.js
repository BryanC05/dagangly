require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const ChatRoom = require('./models/ChatRoom');
const Message = require('./models/Message');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/msme-marketplace';

async function clearDatabase() {
  console.log('Clearing database...');
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
  await ChatRoom.deleteMany({});
  await Message.deleteMany({});
  console.log('Database cleared successfully!');
}

async function createSimulationData() {
  console.log('Creating simulation data...\n');

  // Create Sellers
  const sellers = await createSellers();
  console.log(`Created ${sellers.length} sellers`);

  // Create Buyers
  const buyers = await createBuyers();
  console.log(`Created ${buyers.length} buyers`);

  // Create Products
  const products = await createProducts(sellers);
  console.log(`Created ${products.length} products`);

  // Create Orders
  const orders = await createOrders(buyers, sellers, products);
  console.log(`Created ${orders.length} orders`);

  // Create Chat Rooms
  const chatRooms = await createChatRooms(buyers, sellers, orders);
  console.log(`Created ${chatRooms.length} chat rooms`);

  console.log('\nSimulation data created successfully!');
  console.log('\nTest Accounts:');
  console.log('Sellers:');
  sellers.forEach(seller => {
    console.log(`  - ${seller.email} / password123 (${seller.businessName})`);
  });
  console.log('\nBuyers:');
  buyers.forEach(buyer => {
    console.log(`  - ${buyer.email} / password123 (${buyer.name})`);
  });
}

async function createSellers() {
  const sellerData = [
    {
      name: 'Rahul Sharma',
      email: 'rahul.handicrafts@example.com',
      phone: '+91-9876543210',
      businessName: 'Sharma Handicrafts',
      businessType: 'micro',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139], // Delhi
        address: '123 Chandni Chowk',
        city: 'Delhi',
        state: 'Delhi'
      },
      isSeller: true,
      isVerified: true
    },
    {
      name: 'Priya Patel',
      email: 'priya.textiles@example.com',
      phone: '+91-9876543211',
      businessName: 'Patel Textiles',
      businessType: 'small',
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760], // Mumbai
        address: '456 Linking Road',
        city: 'Mumbai',
        state: 'Maharashtra'
      },
      isSeller: true,
      isVerified: true
    },
    {
      name: 'Karthik Reddy',
      email: 'karthik.foods@example.com',
      phone: '+91-9876543212',
      businessName: 'Reddy Foods',
      businessType: 'medium',
      location: {
        type: 'Point',
        coordinates: [78.4867, 17.3850], // Hyderabad
        address: '789 Jubilee Hills',
        city: 'Hyderabad',
        state: 'Telangana'
      },
      isSeller: true,
      isVerified: true
    },
    {
      name: 'Anita Desai',
      email: 'anita.fashion@example.com',
      phone: '+91-9876543213',
      businessName: 'Desai Fashion Studio',
      businessType: 'small',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716], // Bangalore
        address: '234 Commercial Street',
        city: 'Bangalore',
        state: 'Karnataka'
      },
      isSeller: true,
      isVerified: true
    }
  ];

  const sellers = [];
  for (const data of sellerData) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const seller = new User({
      ...data,
      password: hashedPassword
    });
    await seller.save();
    sellers.push(seller);
  }
  return sellers;
}

async function createBuyers() {
  const buyerData = [
    {
      name: 'Arjun Kumar',
      email: 'arjun.k@example.com',
      phone: '+91-9988776655'
    },
    {
      name: 'Sneha Gupta',
      email: 'sneha.g@example.com',
      phone: '+91-9988776656'
    },
    {
      name: 'Vikram Singh',
      email: 'vikram.s@example.com',
      phone: '+91-9988776657'
    },
    {
      name: 'Meera Iyer',
      email: 'meera.i@example.com',
      phone: '+91-9988776658'
    },
    {
      name: 'Rajesh Khanna',
      email: 'rajesh.k@example.com',
      phone: '+91-9988776659'
    },
    {
      name: 'Deepika Rao',
      email: 'deepika.r@example.com',
      phone: '+91-9988776660'
    }
  ];

  const buyers = [];
  for (const data of buyerData) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const buyer = new User({
      ...data,
      password: hashedPassword,
      location: {
        type: 'Point',
        coordinates: [77.1025, 28.7041], // Default Delhi area
        address: 'Sample Address',
        city: 'Delhi',
        state: 'Delhi'
      }
    });
    await buyer.save();
    buyers.push(buyer);
  }
  return buyers;
}

async function createProducts(sellers) {
  const productData = [
    // Rahul's Handicrafts
    {
      name: 'Handcrafted Wooden Elephant',
      description: 'Beautiful hand-carved wooden elephant made from sustainable teak wood. Perfect for home decor.',
      price: 1299,
      category: 'handicrafts',
      stock: 15,
      unit: 'pieces',
      seller: sellers[0]._id,
      location: sellers[0].location,
      images: ['https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?w=400']
    },
    {
      name: 'Brass Decorative Bowl',
      description: 'Traditional brass bowl with intricate engravings. Can be used for decoration or serving.',
      price: 899,
      category: 'handicrafts',
      stock: 20,
      unit: 'pieces',
      seller: sellers[0]._id,
      location: sellers[0].location,
      images: ['https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400']
    },
    {
      name: 'Kashmiri Wool Shawl',
      description: 'Authentic Kashmiri wool shawl with traditional embroidery. Warm and elegant.',
      price: 2499,
      category: 'clothing',
      stock: 10,
      unit: 'pieces',
      seller: sellers[0]._id,
      location: sellers[0].location,
      images: ['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400']
    },
    // Priya's Textiles
    {
      name: 'Handloom Cotton Saree',
      description: 'Pure cotton handloom saree with traditional motifs. Comfortable for daily wear.',
      price: 1599,
      category: 'clothing',
      stock: 25,
      unit: 'pieces',
      seller: sellers[1]._id,
      location: sellers[1].location,
      images: ['https://images.unsplash.com/photo-1610030469668-6e6b264d64b3?w=400']
    },
    {
      name: 'Block Print Bed Sheet Set',
      description: 'Beautiful block printed cotton bed sheet set with 2 pillow covers. Queen size.',
      price: 1899,
      category: 'home',
      stock: 18,
      unit: 'sets',
      seller: sellers[1]._id,
      location: sellers[1].location,
      images: ['https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400']
    },
    {
      name: 'Embroidered Table Runner',
      description: 'Elegant embroidered table runner with traditional Indian designs.',
      price: 699,
      category: 'home',
      stock: 30,
      unit: 'pieces',
      seller: sellers[1]._id,
      location: sellers[1].location,
      images: ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400']
    },
    // Karthik's Foods
    {
      name: 'Organic Turmeric Powder',
      description: '100% organic turmeric powder from Andhra Pradesh farms. 250g pack.',
      price: 149,
      category: 'food',
      stock: 100,
      unit: 'packs',
      seller: sellers[2]._id,
      location: sellers[2].location,
      images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400']
    },
    {
      name: 'Homemade Mango Pickle',
      description: 'Traditional Andhra style mango pickle made with organic mangoes and spices. 500g.',
      price: 299,
      category: 'food',
      stock: 50,
      unit: 'jars',
      seller: sellers[2]._id,
      location: sellers[2].location,
      images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400']
    },
    {
      name: 'Premium Basmati Rice',
      description: 'Aged premium basmati rice from Punjab. Long grain, aromatic. 5kg pack.',
      price: 899,
      category: 'food',
      stock: 40,
      unit: 'packs',
      seller: sellers[2]._id,
      location: sellers[2].location,
      images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400']
    },
    {
      name: 'Cold Pressed Coconut Oil',
      description: 'Pure cold pressed coconut oil for cooking and hair care. 1 liter.',
      price: 449,
      category: 'food',
      stock: 60,
      unit: 'bottles',
      seller: sellers[2]._id,
      location: sellers[2].location,
      images: ['https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?w=400']
    },
    // Anita's Fashion
    {
      name: 'Designer Kurti',
      description: 'Stylish cotton kurti with modern prints. Perfect for casual and office wear.',
      price: 1299,
      category: 'clothing',
      stock: 22,
      unit: 'pieces',
      seller: sellers[3]._id,
      location: sellers[3].location,
      images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400']
    },
    {
      name: 'Silk Scarf',
      description: 'Elegant silk scarf with hand-painted designs. Can be styled multiple ways.',
      price: 799,
      category: 'clothing',
      stock: 35,
      unit: 'pieces',
      seller: sellers[3]._id,
      location: sellers[3].location,
      images: ['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400']
    },
    {
      name: 'Embroidered Handbag',
      description: 'Beautiful embroidered handbag with traditional mirror work. Spacious and stylish.',
      price: 1699,
      category: 'clothing',
      stock: 15,
      unit: 'pieces',
      seller: sellers[3]._id,
      location: sellers[3].location,
      images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400']
    }
  ];

  const products = [];
  for (const data of productData) {
    const product = new Product({
      ...data,
      isAvailable: true,
      rating: Math.floor(Math.random() * 2) + 3 + Math.random(), // Random rating 3.0-5.0
      totalReviews: Math.floor(Math.random() * 50) + 5
    });
    await product.save();
    products.push(product);
  }
  return products;
}

async function createOrders(buyers, sellers, products) {
  const orders = [];
  const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
  const paymentMethods = ['cash', 'qris', 'ewallet', 'bank_transfer'];
  const paymentStatuses = ['pending', 'completed'];

  // Create orders for each buyer
  for (const buyer of buyers) {
    // Each buyer makes 2-4 orders
    const numOrders = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < numOrders; i++) {
      // Pick a random seller
      const seller = sellers[Math.floor(Math.random() * sellers.length)];
      
      // Get products from this seller
      const sellerProducts = products.filter(p => p.seller.toString() === seller._id.toString());
      
      if (sellerProducts.length === 0) continue;

      // Pick 1-3 products from this seller
      const numProducts = Math.floor(Math.random() * 3) + 1;
      const selectedProducts = [];
      const orderProducts = [];
      let totalAmount = 0;

      for (let j = 0; j < numProducts; j++) {
        const product = sellerProducts[Math.floor(Math.random() * sellerProducts.length)];
        if (selectedProducts.includes(product._id.toString())) continue;
        
        selectedProducts.push(product._id.toString());
        const quantity = Math.floor(Math.random() * 3) + 1;
        
        orderProducts.push({
          product: product._id,
          quantity: quantity,
          price: product.price
        });
        
        totalAmount += product.price * quantity;
      }

      if (orderProducts.length === 0) continue;

      // Random status and dates
      const statusIndex = Math.floor(Math.random() * statuses.length);
      const status = statuses[statusIndex];
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days

      const order = new Order({
        buyer: buyer._id,
        seller: seller._id,
        products: orderProducts,
        totalAmount: totalAmount,
        status: status,
        paymentStatus: status === 'delivered' ? 'completed' : Math.random() > 0.5 ? 'completed' : 'pending',
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        deliveryAddress: {
          address: `${Math.floor(Math.random() * 999) + 1} Main Street`,
          city: buyer.location?.city || 'Delhi',
          state: buyer.location?.state || 'Delhi',
          pincode: `${Math.floor(Math.random() * 900000) + 100000}`,
          coordinates: [
            buyer.location?.coordinates?.[0] || 77.1025,
            buyer.location?.coordinates?.[1] || 28.7041
          ]
        },
        notes: Math.random() > 0.7 ? 'Please deliver after 6 PM' : '',
        createdAt: createdAt
      });

      await order.save();
      orders.push(order);
    }
  }

  return orders;
}

async function createChatRooms(buyers, sellers, orders) {
  const chatRooms = [];

  // Create chat rooms for orders
  for (const order of orders) {
    const chatRoom = new ChatRoom({
      order: order._id,
      buyer: order.buyer,
      seller: order.seller,
      chatType: 'order',
      unreadCount: {
        buyer: Math.floor(Math.random() * 3),
        seller: Math.floor(Math.random() * 3)
      }
    });
    await chatRoom.save();
    chatRooms.push(chatRoom);

    // Create 2-5 messages for each chat room
    const numMessages = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < numMessages; i++) {
      const isBuyer = Math.random() > 0.5;
      const message = new Message({
        chatRoom: chatRoom._id,
        sender: isBuyer ? order.buyer : order.seller,
        content: isBuyer 
          ? ['Hi, I placed an order!', 'When will it be delivered?', 'Thanks!', 'Is it ready yet?'][Math.floor(Math.random() * 4)]
          : ['Thank you for your order!', 'It will be ready tomorrow', 'Your order is confirmed', 'Yes, ready for pickup!'][Math.floor(Math.random() * 4)],
        isRead: Math.random() > 0.3,
        createdAt: new Date(order.createdAt.getTime() + i * 3600000)
      });
      await message.save();
    }
  }

  // Create some direct chat rooms
  for (const buyer of buyers.slice(0, 3)) {
    const seller = sellers[Math.floor(Math.random() * sellers.length)];
    const chatRoom = new ChatRoom({
      buyer: buyer._id,
      seller: seller._id,
      chatType: 'direct',
      order: null,
      unreadCount: {
        buyer: 0,
        seller: 1
      }
    });
    await chatRoom.save();
    chatRooms.push(chatRoom);

    // Add initial message
    const message = new Message({
      chatRoom: chatRoom._id,
      sender: buyer._id,
      content: 'Hi, do you have this item in stock?',
      isRead: false,
      createdAt: new Date()
    });
    await message.save();
    chatRoom.lastMessage = message._id;
    await chatRoom.save();
  }

  return chatRooms;
}

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    await clearDatabase();
    await createSimulationData();

    await mongoose.disconnect();
    console.log('\nDone! Database reset complete.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
