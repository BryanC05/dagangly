import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calculator,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Percent,
  AlertTriangle
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

function FinanceCalculator() {
  const { t, language } = useTranslation();
  const [form, setForm] = useState({
    cost: "",
    markup: "30",
    quantity: "1",
  });

  const calculate = () => {
    const cost = parseFloat(form.cost) || 0;
    const markup = parseFloat(form.markup) || 0;
    const quantity = parseFloat(form.quantity) || 1;
    
    if (cost <= 0 || markup < 0) return null;
    
    const sellingPrice = cost * (1 + markup / 100);
    const profit = sellingPrice - cost;
    const margin = (profit / sellingPrice) * 100;
    const totalRevenue = sellingPrice * quantity;
    const totalProfit = profit * quantity;
    
    return {
      sellingPrice: Math.round(sellingPrice),
      profit: Math.round(profit),
      margin: margin.toFixed(1),
      totalRevenue: Math.round(totalRevenue),
      totalProfit: Math.round(totalProfit),
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

  const markupPresets = [15, 20, 25, 30, 40, 50];

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
          <h1 className="text-2xl font-bold">{t("calculator") || "Calculator"}</h1>
          <p className="text-muted-foreground text-sm">
            {t("calculatorDesc") || "Calculate selling price and profit margins"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {t("inputCost") || "Input Costs"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t("productionCost") || "Production Cost (per unit)"}</Label>
              <Input
                type="number"
                placeholder={t("enterCost") || "Enter cost"}
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </div>
            
            <div>
              <Label>{t("markup") || "Markup (%)"}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {markupPresets.map((pct) => (
                  <Button
                    key={pct}
                    variant={form.markup === String(pct) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setForm({ ...form, markup: String(pct) })}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                className="mt-2"
                placeholder="Custom markup %"
                value={form.markup}
                onChange={(e) => setForm({ ...form, markup: e.target.value })}
              />
            </div>
            
            <div>
              <Label>{t("quantity") || "Quantity"}</Label>
              <Input
                type="number"
                placeholder="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Main Result */}
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="py-6 text-center">
                  <p className="text-sm opacity-80">
                    {t("sellingPrice") || "Selling Price per Unit"}
                  </p>
                  <p className="text-4xl font-bold mt-2">
                    {formatCurrency(result.sellingPrice)}
                  </p>
                </CardContent>
              </Card>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">{t("profit") || "Profit"}</span>
                    </div>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(result.profit)}
                    </p>
                    <p className="text-xs text-muted-foreground">per unit</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Percent className="h-4 w-4" />
                      <span className="text-sm">{t("margin") || "Margin"}</span>
                    </div>
                    <p className="text-xl font-bold">
                      {result.margin}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Total When Quantity > 1 */}
              {parseInt(form.quantity) > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {t("totalFor") || "Total for"} {form.quantity} units
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("totalRevenue") || "Revenue"}</span>
                      <span className="font-medium">{formatCurrency(result.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>{t("totalProfit") || "Profit"}</span>
                      <span className="font-medium">{formatCurrency(result.totalProfit)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Warning if Loss */}
              {result.profit < 0 && (
                <Card className="border-red-500 bg-red-50">
                  <CardContent className="py-4 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium text-red-600">
                        {t("lossWarning") || "You will make a loss!"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("lossAdvice") || "Increase markup or reduce costs"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {t("enterCost") || "Enter production cost to calculate"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-muted/50">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">
                <strong>{t("tip") || "Tip"}:</strong>{" "}
                {t("markupTip") || "Common markup for small business is 20-40%"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default FinanceCalculator;