import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  ArrowDownRight,
  Wallet,
  FileText,
  Bot,
  Package
} from "lucide-react";
import api from "@/utils/api";
import { useTranslation } from "@/hooks/useTranslation";
import { loadMockFinanceData, getSellers } from "@/utils/mockFinance";
import { useAuthStore } from "@/store/authStore";

function FinanceDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalExpenses: 0,
    netProfit: 0,
    orderCount: 0,
  });
  const [useMockData, setUseMockData] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState("all");

  useEffect(() => {
    // Only show finance to sellers
    if (user && !user.isSeller) {
      navigate("/");
      return;
    }
    setSellers(getSellers());
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use logged-in user's ID as default sellerId (they are a seller viewing their own dashboard)
        const sellerId = selectedSeller === "all" 
          ? (user?.id || user?._id) 
          : selectedSeller;
        console.log("Fetching summary with sellerId:", sellerId);
        const response = await api.get("/finance/summary", { params: { sellerId } });
        console.log("Summary response:", JSON.stringify(response.data, null, 2));
        setStats({
          totalSales: response.data.totalSales || 0,
          totalExpenses: response.data.totalExpenses || 0,
          netProfit: response.data.netProfit || 0,
          orderCount: response.data.orderCount || 0,
        });
        setUseMockData(false);
      } catch (error) {
        console.log("Using mock finance data for demo", error);
        const sellerId = selectedSeller === "all" ? undefined : selectedSeller;
        const mockData = loadMockFinanceData(sellerId);
        setStats(mockData.summary);
        setUseMockData(true);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id || user?._id) {
      fetchData();
    }
  }, [selectedSeller, user]);

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
      title: t("productProfit") || "Product Profit",
      description: t("productProfitDesc") || "Calculate profit with detailed expenses",
      icon: TrendingUp,
      href: "/finance/profit-calculator",
      color: "bg-green-500",
    },
    {
      title: t("productExpenses") || "Product Expenses",
      description: t("productExpensesDesc") || "Manage expense per product",
      icon: Package,
      href: "/finance/product-expenses",
      color: "bg-orange-500",
    },
    {
      title: t("financeAI") || "AI Consultant",
      description: t("financeAIDesc") || "Ask AI about your finances",
      icon: Bot,
      href: "/finance/ai",
      color: "bg-indigo-500",
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t("finance") || "Finance"}</h1>
            <p className="text-muted-foreground mt-2">
              {t("financeSubtitle") || "Manage your business finances"}
            </p>
          </div>
          
          {/* Seller Selector */}
          {sellers.length > 0 && useMockData && (
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedSeller}
                onChange={(e) => setSelectedSeller(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">{t("allSeller") || "All Sellers"}</option>
                {sellers.map(seller => (
                  <option key={seller.sellerId} value={seller.sellerId}>
                    {seller.sellerName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Demo Banner */}
      {useMockData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <div className="bg-amber-100 p-2 rounded-full">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <p className="font-medium text-amber-800">Demo Mode - Mock Data</p>
            <p className="text-sm text-amber-600">
              Showing sample data for testing. Connect backend to see real data.
            </p>
          </div>
        </div>
      )}

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