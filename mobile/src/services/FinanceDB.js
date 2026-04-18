import * as SQLite from 'expo-sqlite';

const DB_NAME = 'finance.db';

class FinanceDB {
    constructor() {
        this.db = null;
    }

    async init() {
        if (this.db) return this.db;
        
        this.db = await SQLite.openDatabaseAsync(DB_NAME);
        
        await this.db.execAsync(`
            CREATE TABLE IF NOT EXISTS expenses (
                id TEXT PRIMARY KEY,
                amount REAL NOT NULL,
                category TEXT,
                description TEXT,
                date TEXT,
                createdAt TEXT,
                updatedAt TEXT,
                syncStatus TEXT DEFAULT 'local',
                syncId TEXT
            );
            
            CREATE TABLE IF NOT EXISTS invoices (
                id TEXT PRIMARY KEY,
                orderId TEXT,
                invoiceNumber TEXT,
                customerName TEXT,
                items TEXT,
                total REAL,
                createdAt TEXT,
                syncStatus TEXT DEFAULT 'local',
                syncId TEXT
            );
            
            CREATE TABLE IF NOT EXISTS finance_settings (
                key TEXT PRIMARY KEY,
                value TEXT
            );
            
            CREATE TABLE IF NOT EXISTS product_costs (
                id TEXT PRIMARY KEY,
                productId TEXT,
                productName TEXT,
                materialCost REAL DEFAULT 0,
                laborCost REAL DEFAULT 0,
                shippingCost REAL DEFAULT 0,
                platformFee REAL DEFAULT 0,
                platformFeeType TEXT DEFAULT 'percent',
                otherCosts REAL DEFAULT 0,
                createdAt TEXT,
                updatedAt TEXT
            );
        `);
        
        console.log('✅ Finance DB initialized');
        return this.db;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // Expenses
    async addExpense(expense) {
        const db = await this.init();
        const now = new Date().toISOString();
        const id = this.generateId();
        
        await db.runAsync(
            `INSERT INTO expenses (id, amount, category, description, date, createdAt, updatedAt, syncStatus)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'local')`,
            [id, expense.amount, expense.category, expense.description, expense.date, now, now]
        );
        
        return id;
    }

    async updateExpense(id, updates) {
        const db = await this.init();
        const now = new Date().toISOString();
        
        const fields = [];
        const values = [];
        
        if (updates.amount !== undefined) { fields.push('amount = ?'); values.push(updates.amount); }
        if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
        if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
        if (updates.date !== undefined) { fields.push('date = ?'); values.push(updates.date); }
        
        fields.push('updatedAt = ?', "syncStatus = 'local'");
        values.push(now, id);
        
        await db.runAsync(
            `UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
    }

    async deleteExpense(id) {
        const db = await this.init();
        await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
    }

    async getExpenses() {
        const db = await this.init();
        return await db.getAllAsync('SELECT * FROM expenses ORDER BY date DESC');
    }

    async getExpensesByDateRange(startDate, endDate) {
        const db = await this.init();
        return await db.getAllAsync(
            'SELECT * FROM expenses WHERE date >= ? AND date <= ? ORDER BY date DESC',
            [startDate, endDate]
        );
    }

    async getTotalExpenses() {
        const db = await this.init();
        const result = await db.getFirstAsync('SELECT SUM(amount) as total FROM expenses');
        return result?.total || 0;
    }

    // Invoices
    async addInvoice(invoice) {
        const db = await this.init();
        const now = new Date().toISOString();
        const id = this.generateId();
        const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
        
        await db.runAsync(
            `INSERT INTO invoices (id, orderId, invoiceNumber, customerName, items, total, createdAt, syncStatus)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'local')`,
            [id, invoice.orderId, invoiceNumber, invoice.customerName, JSON.stringify(invoice.items), invoice.total, now]
        );
        
        return { id, invoiceNumber };
    }

    async getInvoices() {
        const db = await this.init();
        const invoices = await db.getAllAsync('SELECT * FROM invoices ORDER BY createdAt DESC');
        return invoices.map(inv => ({
            ...inv,
            items: inv.items ? JSON.parse(inv.items) : []
        }));
    }

    async deleteInvoice(id) {
        const db = await this.init();
        await db.runAsync('DELETE FROM invoices WHERE id = ?', [id]);
    }

    async getTotalIncome() {
        const db = await this.init();
        const result = await db.getFirstAsync('SELECT SUM(total) as total FROM invoices');
        return result?.total || 0;
    }

    // Settings
    async setSetting(key, value) {
        const db = await this.init();
        await db.runAsync(
            'INSERT OR REPLACE INTO finance_settings (key, value) VALUES (?, ?)',
            [key, value]
        );
    }

    async getSetting(key) {
        const db = await this.init();
        const result = await db.getFirstAsync('SELECT value FROM finance_settings WHERE key = ?', [key]);
        return result?.value;
    }

    // Product Costs
    async saveProductCosts(costs) {
        const db = await this.init();
        const now = new Date().toISOString();
        
        if (costs.id) {
            await db.runAsync(
                `UPDATE product_costs SET 
                    productName = ?, materialCost = ?, laborCost = ?, shippingCost = ?,
                    platformFee = ?, platformFeeType = ?, otherCosts = ?, updatedAt = ?
                WHERE id = ?`,
                [costs.productName, costs.materialCost, costs.laborCost, costs.shippingCost,
                costs.platformFee, costs.platformFeeType || 'percent', costs.otherCosts, now, costs.id]
            );
            return costs.id;
        } else {
            const id = this.generateId();
            await db.runAsync(
                `INSERT INTO product_costs 
                    (id, productId, productName, materialCost, laborCost, shippingCost, platformFee, platformFeeType, otherCosts, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, costs.productId, costs.productName, costs.materialCost, costs.laborCost, costs.shippingCost,
                costs.platformFee, costs.platformFeeType || 'percent', costs.otherCosts, now, now]
            );
            return id;
        }
    }

    async getProductCosts() {
        const db = await this.init();
        return await db.getAllAsync('SELECT * FROM product_costs ORDER BY updatedAt DESC');
    }

    async getProductCostsById(productId) {
        const db = await this.init();
        const result = await db.getFirstAsync(
            'SELECT * FROM product_costs WHERE productId = ? OR id = ?',
            [productId, productId]
        );
        return result;
    }

    async deleteProductCosts(id) {
        const db = await this.init();
        await db.runAsync('DELETE FROM product_costs WHERE id = ?', [id]);
    }

    // Export data
    async exportData() {
        const db = await this.init();
        const expenses = await db.getAllAsync('SELECT * FROM expenses');
        const invoices = await db.getAllAsync('SELECT * FROM invoices');
        
        return JSON.stringify({ expenses, invoices }, null, 2);
    }

    // Import data
    async importData(jsonData) {
        const { expenses, invoices } = JSON.parse(jsonData);
        const db = await this.init();
        
        if (expenses?.length) {
            for (const exp of expenses) {
                await db.runAsync(
                    `INSERT OR REPLACE INTO expenses (id, amount, category, description, date, createdAt, updatedAt, syncStatus)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'local')`,
                    [exp.id, exp.amount, exp.category, exp.description, exp.date, exp.createdAt, exp.updatedAt]
                );
            }
        }
        
        if (invoices?.length) {
            for (const inv of invoices) {
                await db.runAsync(
                    `INSERT OR REPLACE INTO invoices (id, orderId, invoiceNumber, customerName, items, total, createdAt, syncStatus)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'local')`,
                    [inv.id, inv.orderId, inv.invoiceNumber, inv.customerName, inv.items, inv.total, inv.createdAt]
                );
            }
        }
    }
}

const financeDB = new FinanceDB();
export default financeDB;