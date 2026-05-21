import * as SQLite from "expo-sqlite";

const DB_NAME = "msme_marketplace.db";

function createLocalDatabase() {
  let db = null;
  let isInitialized = false;

  async function initialize() {
    if (isInitialized) return db;

    try {
      db = await SQLite.openDatabaseAsync(DB_NAME);
      await createTables();
      isInitialized = true;
      console.log("[LocalDatabase] Initialized successfully");
      return db;
    } catch (error) {
      console.error("[LocalDatabase] Failed to initialize:", error);
      throw error;
    }
  }

  async function createTables() {
    const createProductsTable = "CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, price REAL DEFAULT 0, category TEXT, images TEXT, stock INTEGER DEFAULT 0, unit TEXT DEFAULT \"pcs\", seller_id TEXT, seller_name TEXT, business_id TEXT, business_name TEXT, location_address TEXT, rating REAL DEFAULT 0, total_reviews INTEGER DEFAULT 0, is_available INTEGER DEFAULT 1, tags TEXT, cached_at TEXT DEFAULT CURRENT_TIMESTAMP);";

    const createOrdersTable = "CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, server_id TEXT, order_number TEXT, buyer_id TEXT, buyer_name TEXT, seller_id TEXT, seller_name TEXT, products TEXT, subtotal REAL DEFAULT 0, shipping_fee REAL DEFAULT 0, discount_amount REAL DEFAULT 0, total_amount REAL DEFAULT 0, status TEXT DEFAULT \"pending\", payment_method TEXT, payment_status TEXT, delivery_address TEXT, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, sync_status TEXT DEFAULT \"pending\", local_only INTEGER DEFAULT 1);";

    const createBusinessesTable = "CREATE TABLE IF NOT EXISTS businesses (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, logo TEXT, email TEXT, phone TEXT, address TEXT, city TEXT, state TEXT, business_type TEXT, is_verified INTEGER DEFAULT 0, rating REAL DEFAULT 0, total_reviews INTEGER DEFAULT 0, owner_id TEXT, cached_at TEXT DEFAULT CURRENT_TIMESTAMP);";

    const createCategoriesTable = "CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT, product_count INTEGER DEFAULT 0);";

    await db.execAsync(createProductsTable);
    await db.execAsync(createOrdersTable);
    await db.execAsync(createBusinessesTable);
    await db.execAsync(createCategoriesTable);
  }

  async function insertProduct(product) {
    const sql = "INSERT OR REPLACE INTO products (id, name, description, price, category, images, stock, unit, seller_id, seller_name, business_id, business_name, location_address, rating, total_reviews, is_available, tags, cached_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    await db.runAsync(sql, [
      product.id,
      product.name,
      product.description || "",
      product.price || 0,
      product.category || "",
      JSON.stringify(product.images || []),
      product.stock || 0,
      product.unit || "pcs",
      (product.seller && product.seller.id) || product.seller_id || "",
      (product.seller && product.seller.name) || product.seller_name || "",
      product.businessId || product.business_id || "",
      (product.business && product.business.name) || product.business_name || "",
      (product.location && product.location.address) || "",
      product.rating || 0,
      product.totalReviews || 0,
      product.isAvailable ? 1 : 0,
      JSON.stringify(product.tags || []),
      new Date().toISOString(),
    ]);
  }

  async function insertProducts(products) {
    for (const product of products) {
      await insertProduct(product);
    }
  }

  async function getProducts(options) {
    options = options || {};
    const category = options.category;
    const search = options.search;
    const limit = options.limit || 100;
    const offset = options.offset || 0;
    
    let sql = "SELECT * FROM products WHERE is_available = 1";
    const params = [];

    if (category && category !== "all") {
      sql += " AND category = ?";
      params.push(category);
    }

    if (search) {
      sql += " AND (name LIKE ? OR description LIKE ?)";
      params.push("%" + search + "%", "%" + search + "%");
    }

    sql += " ORDER BY cached_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const result = await db.getAllAsync(sql, params);
    return result.map(function(row) { return parseProduct(row); });
  }

  async function getProductById(id) {
    const sql = "SELECT * FROM products WHERE id = ?";
    const result = await db.getFirstAsync(sql, [id]);
    return result ? parseProduct(result) : null;
  }

  function parseProduct(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      category: row.category,
      images: JSON.parse(row.images || "[]"),
      stock: row.stock,
      unit: row.unit,
      seller: { id: row.seller_id, name: row.seller_name },
      businessId: row.business_id,
      business: { name: row.business_name },
      location: { address: row.location_address },
      rating: row.rating,
      totalReviews: row.total_reviews,
      isAvailable: row.is_available === 1,
      tags: JSON.parse(row.tags || "[]"),
    };
  }

  async function insertOrder(order) {
    const sql = "INSERT OR REPLACE INTO orders (id, server_id, order_number, buyer_id, buyer_name, seller_id, seller_name, products, subtotal, shipping_fee, discount_amount, total_amount, status, payment_method, payment_status, delivery_address, notes, created_at, updated_at, sync_status, local_only) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    await db.runAsync(sql, [
      order.id,
      order.server_id || null,
      order.order_number || null,
      order.buyer_id || "",
      order.buyer_name || "",
      order.seller_id || "",
      order.seller_name || "",
      JSON.stringify(order.products || []),
      order.subtotal || 0,
      order.shipping_fee || 0,
      order.discount_amount || 0,
      order.total_amount || 0,
      order.status || "pending",
      order.payment_method || "COD",
      order.payment_status || "pending",
      JSON.stringify(order.delivery_address || {}),
      order.notes || "",
      order.created_at || new Date().toISOString(),
      new Date().toISOString(),
      order.sync_status || "pending",
      order.local_only !== undefined ? (order.local_only ? 1 : 0) : 1,
    ]);
  }

  async function getOrders(buyerId) {
    const sql = buyerId 
      ? "SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC"
      : "SELECT * FROM orders ORDER BY created_at DESC";
    const result = buyerId 
      ? await db.getAllAsync(sql, [buyerId])
      : await db.getAllAsync(sql);
    return result.map(function(row) { return parseOrder(row); });
  }

  async function getOrderById(id) {
    const sql = "SELECT * FROM orders WHERE id = ?";
    const result = await db.getFirstAsync(sql, [id]);
    return result ? parseOrder(result) : null;
  }

  async function updateOrderSyncStatus(id, serverId, syncStatus) {
    const sql = "UPDATE orders SET server_id = ?, sync_status = ?, local_only = 0 WHERE id = ?";
    await db.runAsync(sql, [serverId, syncStatus, id]);
  }

  async function getPendingOrders() {
    const sql = "SELECT * FROM orders WHERE sync_status = 'pending' ORDER BY created_at ASC";
    const result = await db.getAllAsync(sql);
    return result.map(function(row) { return parseOrder(row); });
  }

  function parseOrder(row) {
    if (!row) return null;
    return {
      id: row.id,
      server_id: row.server_id,
      order_number: row.order_number,
      buyer_id: row.buyer_id,
      buyer_name: row.buyer_name,
      seller_id: row.seller_id,
      seller_name: row.seller_name,
      products: JSON.parse(row.products || "[]"),
      subtotal: row.subtotal,
      shipping_fee: row.shipping_fee,
      discount_amount: row.discount_amount,
      total_amount: row.total_amount,
      status: row.status,
      payment_method: row.payment_method,
      payment_status: row.payment_status,
      delivery_address: JSON.parse(row.delivery_address || "{}"),
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      sync_status: row.sync_status,
      local_only: row.local_only === 1,
    };
  }

  async function insertBusiness(business) {
    const sql = "INSERT OR REPLACE INTO businesses (id, name, description, logo, email, phone, address, city, state, business_type, is_verified, rating, total_reviews, owner_id, cached_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    await db.runAsync(sql, [
      business.id,
      business.name,
      business.description || "",
      business.logo || "",
      business.email || "",
      business.phone || "",
      business.address || "",
      business.city || "",
      business.state || "",
      business.businessType || "",
      business.isVerified ? 1 : 0,
      business.rating || 0,
      business.totalReviews || 0,
      business.ownerId || "",
      new Date().toISOString(),
    ]);
  }

  async function getBusinesses() {
    const sql = "SELECT * FROM businesses ORDER BY rating DESC";
    const result = await db.getAllAsync(sql);
    return result.map(function(row) { return parseBusiness(row); });
  }

  function parseBusiness(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      logo: row.logo,
      email: row.email,
      phone: row.phone,
      address: row.address,
      city: row.city,
      state: row.state,
      businessType: row.business_type,
      isVerified: row.is_verified === 1,
      rating: row.rating,
      totalReviews: row.total_reviews,
      ownerId: row.owner_id,
    };
  }

  async function insertCategories(categories) {
    for (const cat of categories) {
      const sql = "INSERT OR REPLACE INTO categories (id, name, icon, product_count) VALUES (?, ?, ?, ?)";
      await db.runAsync(sql, [cat.id, cat.name, cat.icon, cat.product_count || 0]);
    }
  }

  async function getCategories() {
    return await db.getAllAsync("SELECT * FROM categories ORDER BY name");
  }

  async function getCategoryCounts() {
    const sql = "SELECT category as id, COUNT(*) as count FROM products GROUP BY category";
    return await db.getAllAsync(sql);
  }

  async function clearProducts() {
    await db.execAsync("DELETE FROM products");
  }

  async function clearOrders() {
    await db.execAsync("DELETE FROM orders WHERE local_only = 1");
  }

  async function clearAll() {
    await db.execAsync("DELETE FROM products");
    await db.execAsync("DELETE FROM orders");
    await db.execAsync("DELETE FROM businesses");
    await db.execAsync("DELETE FROM categories");
  }

  async function getStats() {
    const products = await db.getFirstAsync("SELECT COUNT(*) as count FROM products");
    const orders = await db.getFirstAsync("SELECT COUNT(*) as count FROM orders");
    const pendingOrders = await db.getFirstAsync("SELECT COUNT(*) as count FROM orders WHERE sync_status = 'pending'");
    const businesses = await db.getFirstAsync("SELECT COUNT(*) as count FROM businesses");
    
    return {
      productsCount: products ? products.count : 0,
      ordersCount: orders ? orders.count : 0,
      pendingOrdersCount: pendingOrders ? pendingOrders.count : 0,
      businessesCount: businesses ? businesses.count : 0,
    };
  }

  return {
    initialize,
    insertProduct,
    insertProducts,
    getProducts,
    getProductById,
    insertOrder,
    getOrders,
    getOrderById,
    updateOrderSyncStatus,
    getPendingOrders,
    insertBusiness,
    getBusinesses,
    insertCategories,
    getCategories,
    getCategoryCounts,
    clearProducts,
    clearOrders,
    clearAll,
    getStats,
  };
}

export const localDatabase = createLocalDatabase();
export default localDatabase;
