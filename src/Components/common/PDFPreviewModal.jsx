import React from 'react';
import { X, Printer, Download, Send } from 'lucide-react';

export default function PDFPreviewModal({ isOpen, onClose, docType, data }) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const isInv = docType === 'invoice';
  const title = isInv ? 'INVOICE' : 'QUOTATION';
  const refNum = data.reference || (isInv ? 'INV-2026-001' : 'QT-2026-001');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-amber-200">
        {/* Modal Actions */}
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Document Preview - {refNum}</h3>
            <p className="text-xs text-slate-500">Official JRAM Groups printable format</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 hover:bg-amber-500 cursor-pointer shadow-xs"
            >
              <Printer size={15} /> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Box */}
        <div className="bg-white border p-8 rounded-2xl shadow-xs text-slate-900 text-xs printable-area font-sans space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">JRAM GROUPS<span className="text-amber-500">.</span></h1>
              <p className="text-[11px] text-slate-500">Modern Enterprise Solutions & Digital Operations</p>
              <p className="text-[11px] text-slate-500 mt-1">123 Tech Park, BKC, Mumbai | +91 98765 43210</p>
              <p className="text-[11px] text-slate-500">contact@jramgroups.com | www.jramgroups.com</p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-amber-100 text-amber-900 font-extrabold text-sm rounded-lg inline-block uppercase tracking-wider">
                {title}
              </span>
              <p className="font-bold text-slate-800 text-sm mt-2">{refNum}</p>
              <p className="text-[11px] text-slate-500">Date: {data.invoice_date || data.valid_until || new Date().toISOString().split('T')[0]}</p>
            </div>
          </div>

          {/* Billed To */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Billed To / Client</p>
              <h4 className="font-bold text-slate-900 text-sm mt-0.5">{data.client_detail?.name || data.client_name || data.client?.name || 'Valued Client'}</h4>
              <p className="text-slate-600 mt-0.5">{data.client_detail?.company || data.client?.company || ''}</p>
              <p className="text-slate-500">{data.client_detail?.email || data.client?.email || ''}</p>
              {(data.client_detail?.phone || data.client_detail?.whatsapp) && (
                <p className="text-slate-500 text-[11px] mt-0.5">{data.client_detail?.phone || data.client_detail?.whatsapp}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status & Terms</p>
              <p className="font-bold text-emerald-700 text-sm mt-0.5">{data.payment_status || data.status || 'Active'}</p>
              <p className="text-slate-500">Currency: INR (₹)</p>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-100 font-bold text-slate-700 text-[11px] uppercase">
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-800">
              {(data.items && data.items.length > 0 ? data.items : [
                { description: data.notes || 'Professional Services & Deliverables', qty: 1, price: Number(data.total_amount || 0), amount: Number(data.total_amount || 0) }
              ]).map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3 font-medium">{item.description}</td>
                  <td className="py-3 px-3 text-center">{item.qty || 1}</td>
                  <td className="py-3 px-3 text-right">₹{Number(item.price || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-right font-bold">₹{Number(item.amount || item.price || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end pt-4 border-t">
            <div className="w-64 space-y-2 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{Number(data.subtotal || data.total_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (GST 18%):</span>
                <span>₹{Number(data.tax || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold text-base border-t pt-2">
                <span>Total Amount:</span>
                <span className="text-amber-600">₹{Number(data.total_amount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-6 text-center text-slate-400 text-[10px]">
            <p>Thank you for partnering with JRAM Groups. Computer generated official document.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
