import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Package,
  ArrowLeft,
  DollarSign,
  Save,
  Plus,
  Trash2,
  Edit2
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/store/authStore";
import api from "@/utils/api";

const EXPENSE_FIELDS = [
  { key: "materials", label: "Bahan Baku", labelEn: "Materials", icon: "📦" },
  { key: "labor", label: "Tenaga Kerja", labelEn: "Labor", icon: "👷" },
  { key: "packaging", label: "Kemasan", labelEn: "Packaging", icon: "📫" },
  { key: "platformFee", label: "Biaya Platform", labelEn: "Platform Fee", icon: "📱" },
  { key: "other", label: "Lainnya", labelEn: "Other", icon: "📝" },
];

function ProductExpenses() {
  const { t, language } = useTranslation();
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProducts();
  }, [user]);

  const loadProducts = async () => {
    const sellerId = user?.sellerId || user?._id || user?.id;
    console.log("Loading products for sellerId:", sellerId);
    console.log("Full user:", user);
    try {
      const response = await api.get("/finance/products", { 
        params: { sellerId } 
      });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (product) => {
    const expenses = product.expenses || {};
    setEditingProduct({
      name: product.name,
      price: product.price,
      expenses: {
        materials: expenses.materials || 0,
        labor: expenses.labor || 0,
        packaging: expenses.packaging || 0,
        platformFee: expenses.platformFee || 0,
        other: expenses.other || 0,
      }
    });
  };

  const saveExpenses = async () => {
    if (!editingProduct) return;
    
    const sellerId = user?.sellerId || user?._id || user?.id;
    setSaving(true);
    setMessage("");
    
    try {
      await api.put("/finance/products/expenses", {
        sellerId: sellerId,
        product: editingProduct.name,
        expenses: editingProduct.expenses,
      });
      
      setMessage("✓ Expenses updated!");
      loadProducts();
      setEditingProduct(null);
    } catch (error) {
      console.error("Save error:", error);
      setMessage("✗ Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const calculateProfit = (expenses, price) => {
    const total = Object.values(expenses).reduce((a, b) => a + b, 0);
    const profit = price - total;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    return { total, profit, margin };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  useEffect(() => {
    loadProducts();
  }, [user]);

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
          <h1 className="text-2xl font-bold">
            {t("productExpenses") || "Product Expenses"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("productExpensesDesc") || "Manage expenses per product to calculate profit"}
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-muted rounded-lg text-center">
          {message}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No products found. Add products first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const expenses = product.expenses || {};
            const { total, profit, margin } = calculateProfit(expenses, product.price);
            
            return (
              <Card key={product._id}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-bold">{formatCurrency(product.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Cost</p>
                        <p className="font-bold text-red-600">{formatCurrency(total)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Profit</p>
                        <p className={`font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(profit)} ({margin.toFixed(1)}%)
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => startEdit(product)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {editingProduct?.name === product.name && (
                  <CardContent className="border-t">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      {EXPENSE_FIELDS.map((field) => (
                        <div key={field.key}>
                          <Label className="flex items-center gap-1 mb-1">
                            <span>{field.icon}</span>
                            <span>{language === "id" ? field.label : field.labelEn}</span>
                          </Label>
                          <Input
                            type="number"
                            value={editingProduct.expenses[field.key]}
                            onChange={(e) => setEditingProduct({
                              ...editingProduct,
                              expenses: {
                                ...editingProduct.expenses,
                                [field.key]: parseFloat(e.target.value) || 0
                              }
                            })}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setEditingProduct(null)}>
                        Cancel
                      </Button>
                      <Button onClick={saveExpenses} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Saving..." : "Save Expenses"}
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductExpenses;