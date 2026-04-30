import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare,
  ArrowLeft,
  Send,
  Bot,
  User,
  Loader2,
  Trash2
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import api from "@/utils/api";
import { loadMockFinanceData, getProductFinancials } from "@/utils/mockFinance";

function FinanceAI() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [productCalcs, setProductCalcs] = useState([]);
  const [userCalcs, setUserCalcs] = useState([]);
  const [clearing, setClearing] = useState(false);
  const messagesEnd = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadData = async () => {
    // Load chat history
    try {
      const chatRes = await api.get("/ai/finance-chats");
      if (chatRes.data.chats?.length > 0) {
        setMessages(chatRes.data.chats.map(c => ({ role: c.role, content: c.content })));
        return;
      }
    } catch (e) {
      console.log("No saved chats");
    }

    // Load products and analytics
    try {
      const [productsRes, analyticsRes] = await Promise.all([
        api.get("/finance/products").catch(() => ({ data: { products: [] } })),
        api.get("/analytics/sales?period=30").catch(() => ({ data: {} }))
      ]);
      
      if (productsRes.data.products?.length > 0) {
        setProductCalcs(productsRes.data.products);
      } else {
        throw new Error("No products from API");
      }
      
      if (analyticsRes.data.totalRevenue) {
        setAnalytics({
          totalRevenue: analyticsRes.data.totalRevenue,
          totalSales: analyticsRes.data.totalRevenue,
          orderCount: analyticsRes.data.completedOrders,
          recentDays: analyticsRes.data.recentDays
        });
      }
    } catch (error) {
      const mockProds = getProductFinancials();
      setProductCalcs(mockProds);

      const mockData = loadMockFinanceData();
      if (mockData) {
        setAnalytics(mockData.summary);
      }
    }

    try {
      const calcRes = await api.get("/finance/product-calculations");
      setUserCalcs(calcRes.data.calculations || []);
    } catch (error) {
      const stored = localStorage.getItem("productCalculations");
      if (stored) {
        setUserCalcs(JSON.parse(stored));
      }
    }
  };

  const clearChats = async () => {
    if (!window.confirm("Clear all chat history?")) return;
    
    setClearing(true);
    try {
      await api.delete("/ai/finance-chats");
      setMessages([]);
    } catch (error) {
      console.error("Failed to clear chats:", error);
    } finally {
      setClearing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const allProductCalcs = [...userCalcs, ...productCalcs];

    try {
      const response = await api.post("/ai/financial-consultant", {
        query: userMsg,
        analytics: analytics,
        productCalculations: allProductCalcs
      });

      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: response.data.response 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: t("aiError") || "Maaf, saya sedang mengalami kesulitan. Coba lagi nanti."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const quickQuestions = [
    t("aiQ1") || "Berapa keuntungan bersih produk saya?",
    t("aiQ2") || "Produk mana yang paling menguntungkan?",
    t("aiQ3") || "Bagaimana cara meningkatkan profit?",
    t("aiQ4") || "Apakah ada produk merugi?",
  ];

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/finance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{t("financeAI") || "AI Financial Consultant"}</h1>
          <p className="text-muted-foreground text-sm">
            {t("financeAIDesc") || "Tanya tentang profit dan bisnis Anda"}
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearChats} disabled={clearing}>
            <Trash2 className="h-4 w-4 mr-2" />
            {clearing ? "Clearing..." : "Clear Chats"}
          </Button>
        )}
      </div>

      {messages.length === 0 && (
        <Card className="mb-6">
          <CardContent className="py-8 text-center">
            <Bot className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-xl font-bold mb-2">
              {t("aiGreeting") || "Halo! Saya asisten keuangan AI Anda."}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t("aiGreetingDesc") || "Saya bisa menganalisis:"}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <span className="px-3 py-1 bg-muted rounded-full text-sm">
                {t("dashStats") || "Statistik penjualan"}
              </span>
              <span className="px-3 py-1 bg-muted rounded-full text-sm">
                {t("productProfit") || "Laba produk"}
              </span>
              <span className="px-3 py-1 bg-muted rounded-full text-sm">
                {t("expenses") || "Pengeluaran"}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {quickQuestions.map((q, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setInput(q);
                  }}
                >
                  {q}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {productCalcs.length > 0 && (
        <Card className="mb-6 bg-muted/50">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              {t("dataReady") || "Data yang bisa saya analisi:"}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>
                <strong>{mockProductCalcs.length}</strong> {t("calcProducts") || "produk"}
              </span>
              {analytics && (
                <>
                  <span>
                    <strong>{formatCurrency(analytics.totalRevenue)}</strong> {t("sales") || "penjualan"}
                  </span>
                  <span>
                    <strong>{formatCurrency(analytics.netProfit)}</strong> {t("profit") || "laba bersih"}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="flex flex-col h-[500px]">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t("chat") || "Chat"}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`flex-1 ${msg.role === "user" ? "text-right" : ""}`}>
                <div className={`inline-block p-3 rounded-lg ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="inline-block p-3 rounded-lg bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={messagesEnd} />
        </CardContent>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder={t("askAI") || "Tanyakan tentang keuangan Anda..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default FinanceAI;