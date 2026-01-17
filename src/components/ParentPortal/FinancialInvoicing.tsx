import { useState, useEffect } from 'react';
import {
  DollarSign,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  term?: string;
  session?: string;
  issueDate: string;
  dueDate: string;
  items: {
    description: string;
    amount: number;
    quantity?: number;
  }[];
  subtotal: number;
  tax?: number;
  totalAmount: number;
  amountPaid: number;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  paymentMethod?: string;
  notes?: string;
}

interface PaymentHistory {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'card' | 'bank_transfer' | 'wallet';
  reference?: string;
  status: 'completed' | 'pending' | 'failed';
}

export const FinancialInvoicing = ({ childId }: { childId: string }) => {
  const { schoolId } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');

  useEffect(() => {
    const fetchFinancialData = async () => {
      if (!childId || !schoolId) return;

      setLoading(true);
      try {
        // Fetch transactions for this child
        const { data: transactions, error: txnError } = await supabase
          .from('financial_transactions')
          .select('*')
          .eq('school_id', schoolId)
          .eq('student_id', childId)
          .order('created_at', { ascending: false });

        if (txnError) throw txnError;

        // Group transactions into invoices
        const invoiceMap = new Map<string, Invoice>();

        (transactions || []).forEach((txn: any) => {
          const invoiceId = txn.id;
          if (!invoiceMap.has(invoiceId)) {
            const dueDate = new Date(txn.created_at);
            dueDate.setDate(dueDate.getDate() + 30); // 30 days payment term

            const isOverdue =
              new Date() > dueDate &&
              txn.status !== 'completed' &&
              txn.status !== 'paid';

            invoiceMap.set(invoiceId, {
              id: invoiceId,
              invoiceNumber: `INV-${txn.id.slice(0, 8).toUpperCase()}`,
              studentId: childId,
              studentName: txn.student_name || 'Student',
              term: txn.term || 'Current',
              session: txn.session || '2025/2026',
              issueDate: txn.created_at,
              dueDate: dueDate.toISOString(),
              items: txn.items || [
                {
                  description: txn.category || 'School Fees',
                  amount: txn.amount,
                },
              ],
              subtotal: txn.amount,
              tax: 0,
              totalAmount: txn.amount,
              amountPaid: txn.status === 'paid' || txn.status === 'completed' ? txn.amount : 0,
              status: isOverdue ? 'overdue' : (txn.status as any),
              paymentMethod: txn.payment_method,
              notes: txn.description,
            });
          }
        });

        const invoicesList = Array.from(invoiceMap.values());
        setInvoices(invoicesList);

        // Fetch payment history
        const { data: payments, error: paymentError } = await supabase
          .from('financial_transactions')
          .select('*')
          .eq('school_id', schoolId)
          .eq('student_id', childId)
          .eq('type', 'fee-payment')
          .order('created_at', { ascending: false });

        if (paymentError) throw paymentError;

        const paymentsList = (payments || []).map((payment: any) => ({
          id: payment.id,
          invoiceId: payment.id,
          amount: payment.amount,
          paymentDate: payment.created_at,
          paymentMethod: payment.payment_method || 'card',
          reference: payment.reference,
          status: payment.status,
        }));

        setPaymentHistory(paymentsList);
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [childId, schoolId]);

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      const element = document.createElement('div');
      element.innerHTML = generateInvoiceHTML(invoice);
      element.style.padding = '20px';
      element.style.backgroundColor = 'white';
      element.style.color = 'black';
      document.body.appendChild(element);

      const canvas = await html2canvas(element, { scale: 2 });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 10, 190, 277);
      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);

      document.body.removeChild(element);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to download invoice');
    }
  };

  const generateInvoiceHTML = (invoice: Invoice): string => {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #009688; padding-bottom: 20px;">
          <h1 style="margin: 0; color: #009688;">INVOICE</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Invoice #${invoice.invoiceNumber}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <div>
            <h3 style="margin: 0 0 10px 0; color: #009688;">School</h3>
            <p style="margin: 5px 0;">EduCore School Management</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">School Details Address</p>
          </div>
          <div>
            <h3 style="margin: 0 0 10px 0; color: #009688;">Student</h3>
            <p style="margin: 5px 0;"><strong>${invoice.studentName}</strong></p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">Student ID: ${invoice.studentId}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; font-size: 14px;">
          <div>
            <p style="margin: 5px 0;"><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Term:</strong> ${invoice.term}</p>
            <p style="margin: 5px 0;"><strong>Session:</strong> ${invoice.session}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f5f5f5; border-bottom: 2px solid #009688;">
              <th style="padding: 10px; text-align: left; font-weight: bold;">Description</th>
              <th style="padding: 10px; text-align: right; font-weight: bold;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
        .map(
          (item) => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px;">${item.description}</td>
                <td style="padding: 10px; text-align: right;">₦${item.amount.toLocaleString()}</td>
              </tr>
            `
        )
        .join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
          <div style="width: 250px;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd;">
              <strong>Subtotal:</strong>
              <span>₦${invoice.subtotal.toLocaleString()}</span>
            </div>
            ${invoice.tax ? `<div style="display: flex; justify-content: space-between; padding: 10px 0;">
              <strong>Tax:</strong>
              <span>₦${invoice.tax.toLocaleString()}</span>
            </div>` : ''}
            <div style="display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; font-weight: bold; color: #009688;">
              <strong>Total Amount:</strong>
              <span>₦${invoice.totalAmount.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; background-color: #f5f5f5;">
              <strong>Amount Paid:</strong>
              <span>₦${invoice.amountPaid.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; color: #d32f2f; font-weight: bold;">
              <strong>Outstanding Balance:</strong>
              <span>₦${(invoice.totalAmount - invoice.amountPaid).toLocaleString()}</span>
            </div>
          </div>
        </div>

        ${invoice.notes ? `<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <strong>Notes:</strong>
          <p style="margin: 5px 0; font-size: 12px;">${invoice.notes}</p>
        </div>` : ''}

        <div style="text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px;">
          <p style="margin: 5px 0;">Thank you for your business</p>
          <p style="margin: 5px 0;">Please contact the school for any inquiries</p>
        </div>
      </div>
    `;
  };

  const filteredInvoices = invoices.filter((invoice) => {
    if (filter === 'all') return true;
    return invoice.status === filter;
  });

  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.amountPaid), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);

  if (loading) {
    return (
      <div className="bg-dark-card border border-white/5 rounded-2xl p-8 text-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-bold">Total Invoiced</h3>
            <DollarSign className="w-5 h-5 text-teal-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            ₦{invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-bold">Amount Paid</h3>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400">₦{totalPaid.toLocaleString()}</div>
        </div>

        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-bold">Outstanding Balance</h3>
            <AlertCircle className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-orange-400">₦{totalOutstanding.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'paid', 'overdue'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-bold transition-colors capitalize ${filter === status
              ? 'bg-teal-500 text-dark-bg'
              : 'bg-dark-card text-gray-400 hover:text-white border border-white/10'
              }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Invoices List */}
      <div className="bg-dark-card border border-white/5 rounded-2xl overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No {filter !== 'all' ? filter : ''} invoices</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-400 font-bold">Invoice</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-bold">Term</th>
                  <th className="px-6 py-4 text-center text-gray-400 font-bold">Amount</th>
                  <th className="px-6 py-4 text-center text-gray-400 font-bold">Paid</th>
                  <th className="px-6 py-4 text-center text-gray-400 font-bold">Balance</th>
                  <th className="px-6 py-4 text-center text-gray-400 font-bold">Status</th>
                  <th className="px-6 py-4 text-center text-gray-400 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInvoices.map((invoice) => {
                  const balance = invoice.totalAmount - invoice.amountPaid;
                  const statusColor =
                    invoice.status === 'paid'
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : invoice.status === 'overdue'
                        ? 'text-red-400 bg-red-500/10'
                        : invoice.status === 'partial'
                          ? 'text-yellow-400 bg-yellow-500/10'
                          : 'text-orange-400 bg-orange-500/10';

                  return (
                    <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4 text-gray-400">{invoice.term}</td>
                      <td className="px-6 py-4 text-center text-white">
                        ₦{invoice.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center text-emerald-400">
                        ₦{invoice.amountPaid.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center text-orange-400">
                        ₦{balance.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor} capitalize flex items-center justify-center gap-2 mx-auto w-fit`}
                        >
                          {invoice.status === 'paid' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : invoice.status === 'overdue' ? (
                            <AlertCircle className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDownloadInvoice(invoice)}
                          className="text-teal-400 hover:text-teal-300 transition-colors"
                          title="Download Invoice"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Payment History</h3>
          <div className="space-y-3">
            {paymentHistory.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-bold">₦{payment.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(payment.paymentDate).toLocaleDateString()} • {payment.paymentMethod}
                  </p>
                </div>
                <span className="text-emerald-400 font-bold capitalize">{payment.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
