import api from '../api/api';
import financeDB from './FinanceDB';

class FinanceSync {
    async syncExpenses() {
        try {
            const localExpenses = await financeDB.getExpenses();
            
            const expensesPayload = localExpenses.map(exp => ({
                id: exp.id,
                amount: exp.amount,
                category: exp.category,
                description: exp.description,
                date: exp.date,
                localId: exp.id,
            }));
            
            const response = await api.post('/finance/expenses/sync', { expenses: expensesPayload });
            return response.data;
        } catch (error) {
            console.error('Sync expenses failed:', error);
            throw error;
        }
    }

    async getExpenses() {
        try {
            const response = await api.get('/finance/expenses');
            return response.data;
        } catch (error) {
            console.error('Get expenses failed:', error);
            throw error;
        }
    }

    async syncInvoices() {
        try {
            const localInvoices = await financeDB.getInvoices();
            
            const invoicesPayload = localInvoices.map(inv => ({
                localId: inv.id,
                orderId: inv.orderId,
                invoiceNumber: inv.invoiceNumber,
                customerName: inv.customerName,
                items: inv.items,
                total: inv.total,
            }));
            
            const response = await api.post('/finance/invoices/sync', { invoices: invoicesPayload });
            return response.data;
        } catch (error) {
            console.error('Sync invoices failed:', error);
            throw error;
        }
    }

    async getSummary() {
        try {
            const response = await api.get('/finance/summary');
            return response.data;
        } catch (error) {
            console.error('Get summary failed:', error);
            throw error;
        }
    }

    async autoSync() {
        const syncEnabled = await financeDB.getSetting('syncEnabled');
        if (syncEnabled !== 'true') {
            return { synced: false, reason: 'sync disabled' };
        }

        try {
            await this.syncExpenses();
            await this.syncInvoices();
            return { synced: true };
        } catch (error) {
            return { synced: false, error: error.message };
        }
    }
}

const financeSync = new FinanceSync();
export default financeSync;