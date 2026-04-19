import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Receipt, 
  Plus, 
  Trash2,
  ArrowLeft,
  Calculator
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import api from "@/utils/api";

const EXPENSE_CATEGORIES = [
  { id: "supplies", name: "Supplies", nameId: "Bahan Baku", icon: "📦" },
  { id: "utilities", name: "Utilities", nameId: "Utilitas", icon: "⚡" },
  { id: "transport", name: "Transport", nameId: "Transportasi", icon: "🚚" },
  { id: "marketing", name: "Marketing", nameId: "Pemasaran", icon: "📢" },
  { id: "equipment", name: "Equipment", nameId: "Peralatan", icon: "🔧" },
  { id: "rent", name: "Rent", nameId: "Sewa", icon: "🏠" },
  { id: "other", name: "Other", nameId: "Lainnya", icon: "📝" },
];

function FinanceExpenses() {
  const { t, language } = useTranslation();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: "",
    category: "supplies",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      // Try to fetch from backend
      const response = await api.get("/finance/expenses");
      setExpenses(response.data.expenses || []);
    } catch (error) {
      // Use localStorage as fallback for web
      const stored = localStorage.getItem("expenses");
      setExpenses(stored ? JSON.parse(stored) : []);
    } finally {
      setLoading(false);
    }
  };

  const saveExpense = async () => {
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) return;
    
    setSaving(true);
    try {
      const expense = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description,
        date: newExpense.date,
        createdAt: new Date().toISOString(),
      };
      
      // Try backend first
      try {
        await api.post("/finance/expenses/sync", { expenses: [expense] });
      } catch (e) {
        // Save to localStorage on web
        const stored = localStorage.getItem("expenses");
        const current = stored ? JSON.parse(stored) : [];
        localStorage.setItem("expenses", JSON.stringify([expense, ...current]));
      }
      
      setExpenses((prev) => [expense, ...prev]);
      setNewExpense({
        amount: "",
        category: "supplies",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setShowAdd(false);
    } catch (error) {
      console.error("Failed to save expense:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (id) => {
    try {
      // Try backend
      await api.delete(`/finance/expenses/${id}`);
    } catch (e) {
      // Remove from localStorage
      const stored = localStorage.getItem("expenses");
      if (stored) {
        const current = JSON.parse(stored);
        localStorage.setItem("expenses", JSON.stringify(current.filter(e => e.id !== id)));
      }
    }
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getCategoryName = (catId) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.id === catId);
    return language === "id" ? (cat?.nameId || catId) : (cat?.name || catId);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/finance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{t("expenses") || "Expenses"}</h1>
          <p className="text-muted-foreground text-sm">
            {t("expensesDesc") || "Track your business expenses"}
          </p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("add") || "Add"}
        </Button>
      </div>

      {/* Add Expense Form */}
      {showAdd && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("addExpense") || "Add Expense"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t("amount") || "Amount"}</Label>
              <Input
                type="number"
                placeholder="0"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("category") || "Category"}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={newExpense.category === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewExpense({ ...newExpense, category: cat.id })}
                  >
                    <span className="mr-1">{cat.icon}</span>
                    {language === "id" ? cat.nameId : cat.name}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>{t("description") || "Description"}</Label>
              <Input
                placeholder={t("description") || "Description"}
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("date") || "Date"}</Label>
              <Input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveExpense} disabled={saving}>
                {saving ? t("saving") || "Saving..." : t("save") || "Save"}
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>
                {t("cancel") || "Cancel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t("totalExpenses") || "Total Expenses"}</span>
            <span className="text-2xl font-bold">{formatCurrency(totalExpenses)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded"></div>
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noExpenses") || "No expenses yet"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <Card key={expense.id} className="flex items-center justify-between">
              <CardContent className="flex-1 flex items-center gap-4 py-4">
                <div className="text-2xl">
                  {EXPENSE_CATEGORIES.find(c => c.id === expense.category)?.icon || "📝"}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{getCategoryName(expense.category)}</p>
                  <p className="text-sm text-muted-foreground">{expense.description || "-"}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(expense.amount)}</p>
                  <p className="text-xs text-muted-foreground">{expense.date}</p>
                </div>
              </CardContent>
              <Button
                variant="ghost"
                size="icon"
                className="mr-4 text-red-500"
                onClick={() => deleteExpense(expense.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default FinanceExpenses;