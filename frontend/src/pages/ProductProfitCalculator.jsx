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
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Receipt,
  Save,
  History
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import api from "@/utils/api";

const EXPENSE_ITEMS = [
  { id: "materials", name: "Materials", nameId: "Bahan Baku", icon: "📦", placeholder: "Raw material costs" },
  { id: "labor", name: "Labor", nameId: "Tenaga Kerja", icon: "👷", placeholder: "Worker wages" },
  { id: "packaging", name: "Packaging", nameId: "Kemasan", icon: "📫", placeholder: "Boxes, bags, wrappers" },
  { id: "shipping", name: "Shipping", nameId: "Pengiriman", icon: "🚚", placeholder: "Delivery costs" },
  { id: "platform_fee", name: "Platform Fee", nameId: "Biaya Platform", icon: "📱", placeholder: "Marketplace commission" },
  { id: "marketing", name: "Marketing", nameId: "Pemasaran", icon: "📢", placeholder: "Ads, promotions" },
  { id: "utilities", name: "Utilities", nameId: "Utilitas", icon: "⚡", placeholder: "Electricity, water" },
  { id: "other", name: "Other", nameId: "Lainnya", icon: "📝", placeholder: "Miscellaneous" },
];

function ProductProfitCalculator() {
  const { t, language } = useTranslation();
  const [productName, setProductName] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [expenses, setExpenses] = useState(
    EXPENSE_ITEMS.map(item => ({ ...item, amount: "" }))
  );
  const [savedCalcs, setSavedCalcs] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCalculations();
  }, []);

  const loadCalculations = async () => {
    try {
      const response = await api.get("/finance/product-calculations");
      setSavedCalcs(response.data.calculations || []);
    } catch (error) {
      const stored = localStorage.getItem("productCalculations");
      if (stored) {
        setSavedCalcs(JSON.parse(stored));
      }
    }
  };

  const saveCalculation = async () => {
    if (!sellingPrice) return;
    
    setSaving(true);
    try {
      const calcData = {
        productName: productName || "Product",
        sellingPrice: parseFloat(sellingPrice),
        quantity: parseInt(quantity) || 1,
        expenses: expenses.filter(e => e.amount).map(e => ({
          id: e.id,
          name: language === "id" ? e.nameId : e.name,
          amount: parseFloat(e.amount),
        })),
        totalRevenue: result.totalRevenue,
        totalCost: result.totalCost,
        cleanProfit: result.cleanProfit,
        profitMargin: parseFloat(result.profitMargin),
        costPerUnit: result.costPerUnit,
        profitPerUnit: result.profitPerUnit,
      };

      try {
        await api.post("/finance/product-calculations", calcData);
      } catch (e) {
        const stored = localStorage.getItem("productCalculations");
        const current = stored ? JSON.parse(stored) : [];
        localStorage.setItem("productCalculations", JSON.stringify([calcData, ...current]));
      }

      await loadCalculations();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateExpense = (id, value) => {
    setExpenses(prev => prev.map(item => 
      item.id === id ? { ...item, amount: value } : item
    ));
  };

  const calculate = () => {
    const price = parseFloat(sellingPrice) || 0;
    const qty = parseFloat(quantity) || 1;
    
    const totalExpenses = expenses.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);

    const totalRevenue = price * qty;
    const totalCost = totalExpenses * qty;
    const cleanProfit = totalRevenue - totalCost;
    const profitPerUnit = qty > 0 ? cleanProfit / qty : 0;
    const profitMargin = totalRevenue > 0 ? (cleanProfit / totalRevenue) * 100 : 0;
    const costPerUnit = qty > 0 ? totalCost / qty : 0;

    return {
      totalRevenue: Math.round(totalRevenue),
      totalCost: Math.round(totalCost),
      cleanProfit: Math.round(cleanProfit),
      profitPerUnit: Math.round(profitPerUnit),
      profitMargin: profitMargin.toFixed(1),
      costPerUnit: Math.round(costPerUnit),
    };
  };

  const result = calculate();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const isLoss = result.cleanProfit < 0;
  const hasInputs = sellingPrice || expenses.some(e => e.amount);

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
          <h1 className="text-2xl font-bold">{t("productProfit") || "Product Profit Calculator"}</h1>
          <p className="text-muted-foreground text-sm">
            {t("productProfitDesc") || "Calculate clean profit by product with detailed expenses"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
          <History className="h-4 w-4 mr-2" />
          {t("history") || "History"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t("productInfo") || "Product Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("productName") || "Product Name"}</Label>
                <Input
                  placeholder={t("enterProductName") || "Enter product name"}
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("sellingPrice") || "Selling Price (per unit)"}</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                  />
                </div>
                <div>
                  <Label>{t("quantity") || "Quantity"}</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expense Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t("expenses") || "Expenses (per unit)"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {expenses.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <Label className="text-sm">
                      {language === "id" ? item.nameId : item.name}
                    </Label>
                    <Input
                      type="number"
                      placeholder={item.placeholder}
                      value={item.amount}
                      onChange={(e) => updateExpense(item.id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {hasInputs ? (
            <>
              {/* Main Result */}
              <Card className={isLoss ? "border-red-500 bg-red-50" : "bg-primary text-primary-foreground"}>
                <CardContent className="py-6 text-center">
                  <p className="text-sm opacity-80">
                    {t("cleanProfit") || "Clean Profit"}{parseInt(quantity) > 1 ? ` (${quantity} ${t("units") || "units"})` : ""}
                  </p>
                  <p className="text-4xl font-bold mt-2">
                    {formatCurrency(result.cleanProfit)}
                  </p>
                  {isLoss && (
                    <p className="text-sm mt-2 text-red-600">
                      {t("lossWarning") || "You are making a loss!"}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">{t("revenue") || "Revenue"}</span>
                    </div>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(result.totalRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">total</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingDown className="h-4 w-4" />
                      <span className="text-sm">{t("totalCost") || "Total Cost"}</span>
                    </div>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(result.totalCost)}
                    </p>
                    <p className="text-xs text-muted-foreground">total</p>
                  </CardContent>
                </Card>
              </div>

              {/* Per Unit Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("perUnitBreakdown") || "Per Unit Breakdown"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("sellingPrice") || "Selling Price"}</span>
                    <span className="font-medium">
                      {formatCurrency(parseFloat(sellingPrice) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("totalCost") || "Total Cost"}</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(result.costPerUnit)}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold">
                    <span>{t("profit") || "Profit"}</span>
                    <span className={isLoss ? "text-red-600" : "text-green-600"}>
                      {isLoss ? "-" : "+"}{formatCurrency(Math.abs(result.profitPerUnit))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("margin") || "Margin"}</span>
                    <span className="font-medium">
                      {result.profitMargin}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Expense Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("expenseBreakdown") || "Expense Breakdown"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {expenses.filter(e => e.amount).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        <span className="text-muted-foreground">
                          {language === "id" ? item.nameId : item.name}
                        </span>
                      </span>
                      <span className="font-medium">
                        {formatCurrency(parseFloat(item.amount))}
                      </span>
                    </div>
                  ))}
                  <hr />
                  <div className="flex justify-between font-medium">
                    <span>{t("total") || "Total"}</span>
                    <span>{formatCurrency(result.costPerUnit)}/unit</span>
                  </div>
                </CardContent>
              </Card>

              {hasInputs && (
                <Button className="w-full" onClick={saveCalculation} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? (t("saving") || "Saving...") : (t("saveCalculation") || "Save Calculation")}
                </Button>
              )}

              {showHistory && savedCalcs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {t("savedCalculations") || "Saved Calculations"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {savedCalcs.slice(0, 5).map((calc, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <p className="font-medium">{calc.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(calc.sellingPrice)} x {calc.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${calc.cleanProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(calc.cleanProfit)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {calc.profitMargin}% margin
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {t("enterExpenses") || "Enter selling price and expenses to calculate"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-muted/50">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">
                <strong>{t("tip") || "Tip"}:</strong>{" "}
                {t("profitTip") || "Include ALL costs - even small ones add up. Your profit margin should cover your time and be positive."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProductProfitCalculator;