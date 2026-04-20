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
import { getInvoices, getSellers } from "@/utils/mockFinance";

function FinanceInvoices() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [useMockData, setUseMockData] = useState(false);
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
        console.log("Using mock invoice data for demo");
        const mockInvoices = getInvoices();
        setInvoices(mockInvoices);
        setFilteredInvoices(mockInvoices);
        setUseMockData(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    setSellers(getSellers());
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

  const stats = {
    total: filteredInvoices.length,
    paid: filteredInvoices.filter(i => i.status === "paid").length,
    unpaid: filteredInvoices.filter(i => i.status === "unpaid").length,
    totalAmount: filteredInvoices.reduce((sum, i) => sum + i.amount, 0),
    paidAmount: filteredInvoices
      .filter(i => i.status === "paid")
      .reduce((sum, i) => sum + i.amount, 0),
    unpaidAmount: filteredInvoices
      .filter(i => i.status === "unpaid")
      .reduce((sum, i) => sum + i.amount, 0),
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/finance" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={18} />
          <span>{t("back") || "Back to Finance"}</span>
        </Link>
        <h1 className="text-3xl font-bold">{t("invoices") || "Invoices"}</h1>
        <p className="text-muted-foreground mt-2">
          {t("invoicesDesc") || "Manage invoices from your orders"}
        </p>
      </div>

      {/* Demo Banner */}
      {useMockData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <div className="bg-amber-100 p-2 rounded-full">
            <span className="text-xl">📋</span>
          </div>
          <div>
            <p className="font-medium text-amber-800">Demo Mode - Mock Data</p>
            <p className="text-sm text-amber-600">
              Showing sample data. Connect backend to see real invoices.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">{t("total") || "Total"}</div>
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-4">
            <div className="text-sm text-green-700">{t("paid") || "Paid"}</div>
            <div className="text-xl font-bold text-green-700">{stats.paid}</div>
            <div className="text-xs text-green-600">{formatCurrency(stats.paidAmount)}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="pt-4">
            <div className="text-sm text-red-700">{t("unpaid") || "Unpaid"}</div>
            <div className="text-xl font-bold text-red-700">{stats.unpaid}</div>
            <div className="text-xs text-red-600">{formatCurrency(stats.unpaidAmount)}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 col-span-2 md:col-span-3 lg:col-span-1">
          <CardContent className="pt-4">
            <div className="text-sm text-blue-700">{t("totalAmount") || "Total Amount"}</div>
            <div className="text-lg font-bold text-blue-700">{formatCurrency(stats.totalAmount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Seller Filter */}
            {sellers.length > 0 && (
              <select
                value={selectedSeller}
                onChange={(e) => setSelectedSeller(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Sellers</option>
                {sellers.map(seller => (
                  <option key={seller.sellerId} value={seller.sellerId}>
                    {seller.sellerName}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">{t("all") || "All Status"}</option>
              <option value="paid">{t("paid") || "Paid"}</option>
              <option value="unpaid">{t("unpaid") || "Unpaid"}</option>
            </select>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("search") || "Search invoice, order, customer..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">{t("invoice") || "Invoice"}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">{t("order") || "Order"}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">{t("seller") || "Seller"}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">{t("product") || "Product"}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">{t("customer") || "Customer"}</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">{t("amount") || "Amount"}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">{t("date") || "Date"}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">{t("status") || "Status"}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">{t("action") || "Action"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>{t("noInvoices") || "No invoices found"}</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.invoiceId} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <span className="font-medium text-primary">{invoice.invoiceId}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">{invoice.orderId}</td>
                      <td className="px-4 py-3 text-sm">{invoice.sellerName}</td>
                      <td className="px-4 py-3 text-sm">{invoice.product}</td>
                      <td className="px-4 py-3 text-sm">{invoice.customer}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {formatDate(invoice.date)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {invoice.status === "paid" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                            <CheckCircle className="h-3 w-3" />
                            {t("paid") || "Paid"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                            <XCircle className="h-3 w-3" />
                            {t("unpaid") || "Unpaid"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {invoice.status === "unpaid" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsPaid(invoice.invoiceId)}
                            className="text-xs"
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            {t("markPaid") || "Mark Paid"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FinanceInvoices;