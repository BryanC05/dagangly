import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  XCircle,
  Filter,
  Receipt,
  Search,
  DollarSign
} from "lucide-react";
import api from "@/utils/api";
import { useTranslation } from "@/hooks/useTranslation";

function FinanceInvoices() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/finance/invoices");
        setInvoices(response.data);
        setFilteredInvoices(response.data);
      } catch (error) {
        console.log("Error fetching invoice data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = invoices;
    
    if (selectedSeller !== "all") {
      result = result.filter(inv => inv.sellerId === selectedSeller);
    }
    
    if (statusFilter !== "all") {
      result = result.filter(inv => inv.status === statusFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(inv => 
        inv.invoiceId.toLowerCase().includes(term) ||
        inv.orderId.toLowerCase().includes(term) ||
        inv.customer.toLowerCase().includes(term) ||
        inv.product.toLowerCase().includes(term)
      );
    }
    
    setFilteredInvoices(result);
  }, [statusFilter, searchTerm, selectedSeller, invoices]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleMarkAsPaid = (invoiceId) => {
    setInvoices(prev => 
      prev.map(inv => 
        inv.invoiceId === invoiceId 
          ? { ...inv, status: "paid" } 
          : inv
      )
    );
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-xl"></div>)}
          </div>
          <div className="h-64 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  const totalUnpaid = filteredInvoices
    .filter(inv => inv.status === "unpaid" || inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalPaid = filteredInvoices
    .filter(inv => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/finance">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{t("invoices") || "Invoices"}</h1>
          <p className="text-muted-foreground">
            {t("invoicesDesc") || "Manage customer invoices and payments"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-900/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500 text-white rounded-lg">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Total Invoices</h3>
            </div>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{filteredInvoices.length}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-200 dark:border-amber-900/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-500 text-white rounded-lg">
                <Receipt className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-amber-900 dark:text-amber-100">Unpaid</h3>
            </div>
            <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(totalUnpaid)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200 dark:border-green-900/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500 text-white rounded-lg">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-green-900 dark:text-green-100">Paid</h3>
            </div>
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Invoice History
            </CardTitle>
            
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search invoices..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground hidden md:block" />
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full md:w-auto px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
              <FileText className="h-12 w-12 text-muted/50 mb-3" />
              <p>No invoices found matching your filters.</p>
              {(statusFilter !== "all" || searchTerm) && (
                <Button 
                  variant="link" 
                  onClick={() => {
                    setStatusFilter("all");
                    setSearchTerm("");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Invoice ID</th>
                    <th className="px-6 py-3 font-medium">Customer</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.invoiceId} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        {inv.invoiceId}
                        <div className="text-xs text-muted-foreground font-normal mt-0.5">Order: {inv.orderId}</div>
                      </td>
                      <td className="px-6 py-4">
                        {inv.customer}
                        <div className="text-xs text-muted-foreground mt-0.5 max-w-[150px] truncate" title={inv.product}>
                          {inv.product}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(inv.date)}</td>
                      <td className="px-6 py-4 font-bold">{formatCurrency(inv.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          inv.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          inv.status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {inv.status === 'paid' && <CheckCircle className="h-3 w-3" />}
                          {inv.status === 'overdue' && <XCircle className="h-3 w-3" />}
                          {inv.status === 'unpaid' && <FileText className="h-3 w-3" />}
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.status !== 'paid' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 text-xs font-medium border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-900/50"
                            onClick={() => handleMarkAsPaid(inv.invoiceId)}
                          >
                            Mark Paid
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 text-xs text-muted-foreground"
                          >
                            View
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FinanceInvoices;
