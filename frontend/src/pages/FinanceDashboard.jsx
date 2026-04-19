import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calculator, 
  Receipt, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  FileText,
  Plus
} from "lucide-react";
import api from "@/utils/api";
import { useTranslation } from "@/hooks/useTranslation";

function FinanceDashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalExpenses: 0,
    netProfit: 0,
    orderCount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/finance/summary");
        setStats({
          totalSales: response.data.totalSales || 0,
          totalExpenses: response.data.totalExpenses || 0,
          netProfit: response.data.netProfit || 0,
          orderCount: response.data.orderCount || 0,
        });
      } catch (error) {
        console.error("Failed to fetch finance summary:", error);
        // Try orders endpoint as fallback
        try {
          const ordersRes = await api.get("/orders/my-orders", { params: { limit: 100 } });
          const orders = ordersRes.data.orders || [];
          const totalSales = orders
            .filter(o => o.status === "delivered" || o.status === "completed")
            .reduce((sum, o) => sum + (o.total || 0), 0);
          setStats({
            totalSales,
            totalExpenses: 0,
            netProfit: totalSales,
            orderCount: orders.filter(o => o.status === "delivered" || o.status === "completed").length,
          });
        } catch (err) {
          console.error("Failed to fetch orders:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const menuCards = [
    {
      title: t("expenses") || "Expenses",
      description: t("expensesDesc") || "Track your business expenses",
      icon: Receipt,
      href: "/finance/expenses",
      color: "bg-red-500",
    },
    {
      title: t("calculator") || "Calculator",
      description: t("calculatorDesc") || "Calculate profit and margins",
      icon: Calculator,
      href: "/finance/calculator",
      color: "bg-blue-500",
    },
    {
      title: t("invoices") || "Invoices",
      description: t("invoicesDesc") || "Generate and manage invoices",
      icon: FileText,
      href: "/finance/invoices",
      color: "bg-purple-500",
    },
  ];

  const statCards = [
    {
      title: t("totalSales") || "Total Sales",
      value: formatCurrency(stats.totalSales),
      icon: DollarSign,
      trend: "+12%",
      trendUp: true,
    },
    {
      title: t("totalExpenses") || "Total Expenses",
      value: formatCurrency(stats.totalExpenses),
      icon: ArrowDownRight,
      trend: "-5%",
      trendUp: true,
    },
    {
      title: t("netProfit") || "Net Profit",
      value: formatCurrency(stats.netProfit),
      icon: TrendingUp,
      trend: stats.netProfit >= 0 ? "+8%" : "-12%",
      trendUp: stats.netProfit >= 0,
    },
    {
      title: t("orders") || "Orders",
      value: stats.orderCount.toString(),
      icon: Receipt,
      trend: "+3",
      trendUp: true,
    },
  ];

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("finance") || "Finance"}</h1>
        <p className="text-muted-foreground mt-2">
          {t("financeSubtitle") || "Manage your business finances"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className={`text-xs mt-1 ${stat.trendUp ? "text-green-500" : "text-red-500"}`}>
                {stat.trend}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-semibold mb-4">
        {t("quickActions") || "Quick Actions"}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {menuCards.map((item, index) => (
          <Link key={index} to={item.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-2 rounded-lg ${item.color}`}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Info Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t("financeInfo") || "Finance Features"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("financeInfo1") || "Track expenses by category"}
            </li>
            <li className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("financeInfo2") || "Calculate product profit margins"}
            </li>
            <li className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("financeInfo3") || "Sync data across devices"}
            </li>
            <li className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("financeInfo4") || "Works offline on mobile"}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default FinanceDashboard;