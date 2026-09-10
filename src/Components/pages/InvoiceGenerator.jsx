import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft, Check, Download, Image as ImageIcon, Copy, RotateCcw,
  Plus, Trash2, ChevronDown, ChevronUp, Eye, FileText, CheckCircle2,
  ExternalLink, Sparkles, Building2, User, HelpCircle, Layers, Landmark
} from 'lucide-react';
import { api } from '../../services/api';

export default function InvoiceGenerator() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: editId } = useParams();

  const [clientsList, setClientsList] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'preview' for mobile
  const [zoom, setZoom] = useState(0.85);

  // Collapsible cards state
  const [openCards, setOpenCards] = useState({
    company: true,
    client: true,
    details: true,
    items: true,
    bank: true,
    notes: false,
    signature: false
  });

  const toggleCard = (key) => setOpenCards(p => ({ ...p, [key]: !p[key] }));

  // 1. Company Information
  const [logoUrl, setLogoUrl] = useState(null);
  const [coName, setCoName] = useState('Jram Groups');
  const [coTag, setCoTag] = useState('IT Solutions & Services');
  const [coAddr, setCoAddr] = useState('No. 1, Tech Park, Chennai – 600 001');
  const [coPhone, setCoPhone] = useState('+91 98765 43210');
  const [coEmail, setCoEmail] = useState('info@jramgroups.com');
  const [coWeb, setCoWeb] = useState('www.jramgroups.com');
  const [coGst, setCoGst] = useState('33AABCJ0000A1Z5');

  // 2. Client Information
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clName, setClName] = useState('');
  const [clCo, setClCo] = useState('');
  const [clAddr, setClAddr] = useState('');
  const [clPhone, setClPhone] = useState('');
  const [clEmail, setClEmail] = useState('');
  const [clGst, setClGst] = useState('');

  // 3. Invoice Details
  const [invNum, setInvNum] = useState('');
  const [invDate, setInvDate] = useState('');
  const [invDue, setInvDue] = useState('');
  const [invPo, setInvPo] = useState('');
  const [invSub, setInvSub] = useState('');
  const [invCur, setInvCur] = useState('₹');
  const [payStatus, setPayStatus] = useState('unpaid'); // 'unpaid' | 'partial' | 'paid'
  const [projectId, setProjectId] = useState(null);

  // 4. Services & Products Items
  const [items, setItems] = useState([
    { id: 1, name: 'Web Application Development', desc: 'Custom enterprise software with responsive modern UI', qty: 1, price: 65000, total: 65000 },
    { id: 2, name: 'Cloud Infrastructure Setup', desc: 'AWS/VPS hosting configuration & continuous deployment', qty: 1, price: 20000, total: 20000 },
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [discountRate, setDiscountRate] = useState(0);

  // 5. Bank & Payment Details
  const [bkName, setBkName] = useState('HDFC Bank');
  const [bkAcName, setBkAcName] = useState('Jram Groups');
  const [bkAcNum, setBkAcNum] = useState('50100123456789');
  const [bkIfsc, setBkIfsc] = useState('HDFC0001234');
  const [bkBranch, setBkBranch] = useState('Anna Nagar, Chennai');
  const [bkUpi, setBkUpi] = useState('jramgroups@hdfcbank');
  const [bkNote, setBkNote] = useState('Include invoice number in payment reference.');

  // 6. Notes & Terms
  const [qNotes, setQNotes] = useState('Thank you for your business!');
  const [qTerms, setQTerms] = useState('1. Payment due within 30 days.\n2. Late payment may attract 1.5% monthly interest.\n3. Make all payments payable to Jram Groups.');

  // 7. Signature Block
  const [sigClName, setSigClName] = useState('');
  const [sigClRole, setSigClRole] = useState('Managing Director');
  const [sigCoName, setSigCoName] = useState('Mr. J. Ramkumar');
  const [sigCoRole, setSigCoRole] = useState('Founder & CEO, Jram Groups');

  // Toast
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg, isError = false) => {
    setToastMsg({ text: msg, isError });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const docRef = useRef(null);

  // Fetch CRM Clients
  useEffect(() => {
    setLoadingClients(true);
    api.clients.list()
      .then(res => {
        const list = res.data || res.results || (Array.isArray(res) ? res : []);
        setClientsList(list);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingClients(false));
  }, []);

  // Initialize dates & number or load incoming state
  useEffect(() => {
    const today = new Date();
    const due = new Date(today);
    due.setDate(due.getDate() + 30);

    const todayStr = today.toISOString().split('T')[0];
    const dueStr = due.toISOString().split('T')[0];

    setInvDate(todayStr);
    setInvDue(dueStr);
    setInvNum(`JRG-INV-${today.getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`);
    setInvPo(`PO-${today.getFullYear()}-001`);

    if (location.state?.selectedClient) {
      const c = location.state.selectedClient;
      setSelectedClientId(c.id);
      setClName(c.name || '');
      setClCo(c.company || '');
      setClAddr([c.address, c.city, c.state].filter(Boolean).join(', '));
      setClPhone(c.phone || c.whatsapp || '');
      setClEmail(c.email || '');
      setClGst(c.gst_vat_number || '');
      setSigClName(c.name || '');
      setSigClRole(c.designation || 'Authorized Signatory');
    }

    if (location.state?.createdProject) {
      const p = location.state.createdProject;
      setProjectId(p.id);
      setInvSub(p.name || 'Project Implementation');
      if (p.budget) {
        setItems([
          {
            id: Date.now(),
            name: p.name || 'Project Implementation',
            desc: p.description || p.service_type || 'Project milestone deliverables',
            qty: 1,
            price: Number(p.budget),
            total: Number(p.budget)
          }
        ]);
      }
    }
  }, [location.state]);

  // Load existing invoice if editId is provided
  useEffect(() => {
    if (!editId) return;
    api.finance.getInvoice(editId)
      .then(inv => {
        if (!inv) return;
        setInvNum(inv.reference || '');
        setInvDate(inv.invoice_date || '');
        setInvDue(inv.due_date || '');
        setInvCur(inv.currency || '₹');
        setInvSub(inv.subject || '');
        setInvPo(inv.po_number || '');
        setTaxRate(inv.tax_rate ?? 0);
        setDiscountRate(inv.discount_rate ?? 0);
        setQNotes(inv.notes || '');
        setQTerms(inv.terms || '');

        if (inv.payment_status === 'Paid') setPayStatus('paid');
        else if (inv.payment_status === 'Partially Paid' || inv.payment_status === 'Partial') setPayStatus('partial');
        else setPayStatus('unpaid');

        if (inv.items && Array.isArray(inv.items) && inv.items.length > 0) {
          setItems(inv.items);
        }
        if (inv.client) setSelectedClientId(inv.client);
        if (inv.project) setProjectId(inv.project);

        if (inv.company_details) {
          const cd = inv.company_details;
          if (cd.name) setCoName(cd.name);
          if (cd.tagline) setCoTag(cd.tagline);
          if (cd.address) setCoAddr(cd.address);
          if (cd.phone) setCoPhone(cd.phone);
          if (cd.email) setCoEmail(cd.email);
          if (cd.website) setCoWeb(cd.website);
          if (cd.gst) setCoGst(cd.gst);
          if (cd.logo) setLogoUrl(cd.logo);
        }

        if (inv.client_details) {
          const cld = inv.client_details;
          if (cld.name) setClName(cld.name);
          if (cld.company) setClCo(cld.company);
          if (cld.address) setClAddr(cld.address);
          if (cld.phone) setClPhone(cld.phone);
          if (cld.email) setClEmail(cld.email);
          if (cld.gst) setClGst(cld.gst);
        } else if (inv.client_detail) {
          const c = inv.client_detail;
          setClName(c.name || '');
          setClCo(c.company || '');
          setClAddr([c.address, c.city, c.state, c.postal_code].filter(Boolean).join(', ') || c.address || '');
          setClPhone(c.phone || c.whatsapp || '');
          setClEmail(c.email || '');
          setClGst(c.gst_vat_number || '');
        }

        if (inv.bank_details) {
          const bd = inv.bank_details;
          if (bd.bank_name) setBkName(bd.bank_name);
          if (bd.account_name) setBkAcName(bd.account_name);
          if (bd.account_number) setBkAcNum(bd.account_number);
          if (bd.ifsc) setBkIfsc(bd.ifsc);
          if (bd.branch) setBkBranch(bd.branch);
          if (bd.upi) setBkUpi(bd.upi);
          if (bd.payment_note) setBkNote(bd.payment_note);
        }

        if (inv.signature_details) {
          const sd = inv.signature_details;
          if (sd.sig_cl_name) setSigClName(sd.sig_cl_name);
          if (sd.sig_cl_role) setSigClRole(sd.sig_cl_role);
          if (sd.sig_co_name) setSigCoName(sd.sig_co_name);
          if (sd.sig_co_role) setSigCoRole(sd.sig_co_role);
        }
        showToast(`Loaded invoice ${inv.reference}`);
      })
      .catch(err => {
        console.error(err);
        showToast('Error loading invoice', true);
      });
  }, [editId]);

  // Handle Client Selection
  const handleSelectClient = (cid) => {
    setSelectedClientId(cid);
    if (!cid) return;
    const c = clientsList.find(x => String(x.id) === String(cid));
    if (c) {
      setClName(c.name || '');
      setClCo(c.company || '');
      setClAddr([c.address, c.city, c.state, c.postal_code].filter(Boolean).join(', ') || c.address || '');
      setClPhone(c.phone || c.whatsapp || '');
      setClEmail(c.email || '');
      setClGst(c.gst_vat_number || '');
      setSigClName(c.name || '');
      setSigClRole(c.designation || 'Authorized Signatory');
      showToast(`Selected client: ${c.name} (${c.company})`);
    }
  };

  // Logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoUrl(ev.target.result);
      showToast('Logo uploaded ✓');
    };
    reader.readAsDataURL(file);
  };

  // Items handling
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now() + Math.random(), name: '', desc: '', qty: 1, price: 0, total: 0 }
    ]);
  };

  const handleRemoveItem = (id) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleUpdateItem = (id, field, value) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, [field]: value };
      if (field === 'qty' || field === 'price') {
        const q = field === 'qty' ? (parseFloat(value) || 0) : it.qty;
        const p = field === 'price' ? (parseFloat(value) || 0) : it.price;
        updated.total = q * p;
      }
      return updated;
    }));
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (it.total || 0), 0);
  const discountAmount = (subtotal * (parseFloat(discountRate) || 0)) / 100;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableBase * (parseFloat(taxRate) || 0)) / 100;
  const grandTotal = taxableBase + taxAmount;

  const formatCurrency = (val) => {
    return `${invCur}${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateDisplay = (d) => {
    if (!d) return '—';
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  // HTML2Canvas capture helper
  const captureDocCanvas = async () => {
    const el = docRef.current;
    if (!el) throw new Error('Document preview not found');
    const html2canvas = window.html2canvas;
    if (!html2canvas) throw new Error('html2canvas library is loading... Please retry in a moment');
    return await html2canvas(el, {
      scale: 2.8,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 794
    });
  };

  // Export handlers
  const handleDownloadPNG = async () => {
    try {
      showToast('Generating high-res PNG...');
      const canvas = await captureDocCanvas();
      const a = document.createElement('a');
      a.download = `${invNum || 'invoice'}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      showToast('PNG Downloaded Successfully! ✓');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error generating PNG', true);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      showToast('Building official PDF...');
      const canvas = await captureDocCanvas();
      const jsPDF = window.jspdf?.jsPDF;
      if (!jsPDF) throw new Error('jsPDF library is loading... Please retry');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      let dw = pw;
      let dh = pw / ratio;
      if (dh > ph) {
        dh = ph;
        dw = ph * ratio;
      }
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pw - dw) / 2, 0, dw, dh, undefined, 'FAST');
      pdf.save(`${invNum || 'invoice'}.pdf`);
      showToast('PDF Saved Successfully! ✓');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error generating PDF', true);
    }
  };

  const handleCopyImage = async () => {
    try {
      showToast('Rendering for clipboard...');
      const canvas = await captureDocCanvas();
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          showToast('Invoice image copied to clipboard! ✓');
        } catch {
          showToast('Clipboard direct copy restricted. Please use Download PNG', true);
        }
      }, 'image/png');
    } catch (err) {
      showToast(err.message || 'Error copying image', true);
    }
  };

  const handleResetForm = () => {
    if (!confirm('Are you sure you want to reset all form inputs?')) return;
    setItems([]);
    setTaxRate(0);
    setDiscountRate(0);
    setClName('');
    setClCo('');
    setClAddr('');
    setClPhone('');
    setClEmail('');
    setClGst('');
    setInvSub('');
    setInvPo('');
    setPayStatus('unpaid');
    showToast('Form reset');
  };

  // SAVE & DONE (Writes to DB and redirects back to /invoices)
  const handleDone = async () => {
    let finalClientId = selectedClientId;
    if (!finalClientId) {
      const matched = clientsList.find(
        c => (clName && c.name?.toLowerCase() === clName.toLowerCase()) ||
          (clCo && c.company?.toLowerCase() === clCo.toLowerCase())
      );
      if (matched) {
        finalClientId = matched.id;
      } else if (clName.trim() || clCo.trim()) {
        try {
          const newClient = await api.clients.create({
            name: clName.trim() || clCo.trim(),
            company: clCo.trim() || clName.trim(),
            email: clEmail || 'contact@client.com',
            phone: clPhone || '+91 00000 00000',
            address: clAddr || '',
            gst_vat_number: clGst || '',
          });
          finalClientId = (newClient.data || newClient).id;
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (!finalClientId) {
      alert('Please select or specify a Client for this invoice.');
      setOpenCards(p => ({ ...p, client: true }));
      return;
    }

    setSaving(true);
    try {
      const backendStatus = payStatus === 'paid' ? 'Paid' : payStatus === 'partial' ? 'Partially Paid' : 'Pending';

      const payload = {
        reference: invNum || `INV-${Date.now().toString().slice(-6)}`,
        client: finalClientId,
        project: projectId || null,
        invoice_date: invDate || new Date().toISOString().split('T')[0],
        due_date: invDue || new Date().toISOString().split('T')[0],
        currency: invCur,
        subject: invSub,
        po_number: invPo,
        items: items,
        subtotal: subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total_amount: grandTotal,
        payment_status: backendStatus,
        tax_rate: parseFloat(taxRate) || 0,
        discount_rate: parseFloat(discountRate) || 0,
        company_details: {
          name: coName,
          tagline: coTag,
          address: coAddr,
          phone: coPhone,
          email: coEmail,
          website: coWeb,
          gst: coGst,
          logo: logoUrl,
        },
        client_details: {
          name: clName,
          company: clCo,
          address: clAddr,
          phone: clPhone,
          email: clEmail,
          gst: clGst,
        },
        bank_details: {
          bank_name: bkName,
          account_name: bkAcName,
          account_number: bkAcNum,
          ifsc: bkIfsc,
          branch: bkBranch,
          upi: bkUpi,
          payment_note: bkNote,
        },
        signature_details: {
          sig_cl_name: sigClName || clName,
          sig_cl_role: sigClRole,
          sig_co_name: sigCoName,
          sig_co_role: sigCoRole,
        },
        terms: qTerms,
        notes: qNotes,
      };

      if (editId) {
        await api.finance.updateInvoice(editId, payload);
      } else {
        await api.finance.createInvoice(payload);
      }

      alert(`Invoice ${payload.reference} saved successfully to database!`);
      navigate('/invoices');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error saving invoice to database');
    } finally {
      setSaving(false);
    }
  };

  const hasBankDetails = bkName || bkAcNum || bkIfsc;

  return (
    <div className="h-screen flex flex-col bg-[#f0ede4] text-[#0a0a0a] font-['DM_Sans',sans-serif] overflow-hidden">
      {/* ── TOP HEADER ── */}
      <header className="h-[56px] bg-[#0a0a0a] flex items-center justify-between px-4 sm:px-6 z-30 border-b-2 border-[#f5c400] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center gap-1 text-xs"
            title="Back to Invoices List"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline font-semibold">Back</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-[36px] h-[36px] bg-[#f5c400] rounded-lg grid place-items-center font-['Bebas_Neue',sans-serif] font-bold text-xl text-[#0a0a0a] shadow-xs">
              J
            </div>
            <div className="font-['Bebas_Neue',sans-serif] text-xl text-white tracking-wider">
              Jram <span className="text-[#f5c400]">Groups</span>
            </div>
          </div>
          <div className="hidden sm:block w-[1px] h-6 bg-white/20 mx-1"></div>
          <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#f5c400]/15 border border-[#f5c400]/30 text-[#f5c400] text-[11px] font-bold px-3 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f5c400]"></span>
            INVOICE GENERATOR
          </span>
        </div>

        {/* Right side with DONE button */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-white/60 text-xs">
            <span>Total Due:</span>
            <span className="text-[#f5c400] font-bold font-mono text-sm">{formatCurrency(grandTotal)}</span>
          </div>

          <button
            onClick={handleDone}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-[#f5c400] hover:bg-[#e0a800] text-[#0a0a0a] font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-[#f5c400]/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Check size={16} className="stroke-[3]" />
            <span>{saving ? 'Saving...' : 'Done'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden h-10 bg-[#1a1508] flex flex-shrink-0 border-b border-amber-950/40">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 flex items-center justify-center gap-1.5 font-bold text-xs transition-all ${activeTab === 'form' ? 'text-[#f5c400] border-b-2 border-[#f5c400]' : 'text-white/50'
            }`}
        >
          📝 Form Editor
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 flex items-center justify-center gap-1.5 font-bold text-xs transition-all ${activeTab === 'preview' ? 'text-[#f5c400] border-b-2 border-[#f5c400]' : 'text-white/50'
            }`}
        >
          👁 Live A4 Document
        </button>
      </div>

      {/* ── MAIN SPLIT VIEW ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ══ LEFT FORM PANEL (430px) ══ */}
        <div
          className={`w-full md:w-[430px] md:min-w-[340px] md:max-w-[430px] flex-shrink-0 bg-white border-r border-[#f0e8a0] flex flex-col h-full overflow-hidden ${activeTab === 'form' ? 'flex' : 'hidden md:flex'
            }`}
        >
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">

            {/* 1. Company Info Card */}
            <div className="border border-[#f0e8a0] rounded-xl overflow-hidden bg-white shadow-2xs">
              <div
                onClick={() => toggleCard('company')}
                className="flex items-center gap-2.5 px-3 py-2.5 bg-[#fffaec] border-b border-[#f0e8a0] cursor-pointer select-none hover:bg-amber-100/50 transition-colors"
              >
                <div className="w-6 h-6 bg-[#f5c400] rounded-md grid place-items-center text-xs text-[#0a0a0a] font-bold">
                  🏢
                </div>
                <span className="font-bold text-xs text-[#0a0a0a] flex-1">Company Information</span>
                {openCards.company ? <ChevronUp size={14} className="text-amber-800" /> : <ChevronDown size={14} className="text-amber-800" />}
              </div>

              {openCards.company && (
                <div className="p-3 space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Company Logo</label>
                    {logoUrl ? (
                      <div className="flex items-center gap-2.5 p-2 bg-[#fffaec] border border-[#f0e8a0] rounded-lg">
                        <img src={logoUrl} alt="Logo" className="max-h-8 max-w-[70px] object-contain rounded" />
                        <span className="text-xs text-amber-950 font-medium flex-1">Logo uploaded ✓</span>
                        <button
                          type="button"
                          onClick={() => setLogoUrl(null)}
                          className="text-xs text-red-600 hover:underline font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="border-1.5 border-dashed border-[#ccb840] rounded-lg p-3 text-center cursor-pointer bg-[#fffaec] hover:bg-[#fff8d0] flex flex-col items-center justify-center gap-1 transition-all">
                        <span className="text-lg">🖼</span>
                        <span className="text-xs text-amber-900 font-semibold">Click to upload company logo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Company Name</label>
                      <input
                        type="text"
                        value={coName}
                        onChange={e => setCoName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Tagline</label>
                      <input
                        type="text"
                        value={coTag}
                        onChange={e => setCoTag(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Address</label>
                    <input
                      type="text"
                      value={coAddr}
                      onChange={e => setCoAddr(e.target.value)}
                      placeholder="No. 1, Tech Park, Chennai – 600 001"
                      className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Phone</label>
                      <input
                        type="text"
                        value={coPhone}
                        onChange={e => setCoPhone(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Email</label>
                      <input
                        type="email"
                        value={coEmail}
                        onChange={e => setCoEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Website</label>
                      <input
                        type="text"
                        value={coWeb}
                        onChange={e => setCoWeb(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">GST / Tax ID</label>
                      <input
                        type="text"
                        value={coGst}
                        onChange={e => setCoGst(e.target.value)}
                        placeholder="33AABCJ0000A1Z5"
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-mono font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Client Information Card */}
            <div className="border border-[#f0e8a0] rounded-xl overflow-hidden bg-white shadow-2xs">
              <div
                onClick={() => toggleCard('client')}
                className="flex items-center gap-2.5 px-3 py-2.5 bg-[#fffaec] border-b border-[#f0e8a0] cursor-pointer select-none hover:bg-amber-100/50 transition-colors"
              >
                <div className="w-6 h-6 bg-[#f5c400] rounded-md grid place-items-center text-xs text-[#0a0a0a] font-bold">
                  👤
                </div>
                <span className="font-bold text-xs text-[#0a0a0a] flex-1">Bill To — Client Information</span>
                {openCards.client ? <ChevronUp size={14} className="text-amber-800" /> : <ChevronDown size={14} className="text-amber-800" />}
              </div>

              {openCards.client && (
                <div className="p-3 space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                      Choose from CRM Clients
                    </label>
                    <select
                      value={selectedClientId}
                      onChange={(e) => handleSelectClient(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#fff8d0] border border-[#ccb840] rounded-lg text-xs font-bold focus:bg-white focus:outline-none"
                    >
                      <option value="">-- Choose Existing Client (Auto-fill) --</option>
                      {clientsList.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.company ? `(${c.company})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Contact Name</label>
                      <input
                        type="text"
                        value={clName}
                        onChange={e => setClName(e.target.value)}
                        placeholder="Rajesh Kumar"
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Company Name</label>
                      <input
                        type="text"
                        value={clCo}
                        onChange={e => setClCo(e.target.value)}
                        placeholder="Client Corp"
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Billing Address</label>
                    <input
                      type="text"
                      value={clAddr}
                      onChange={e => setClAddr(e.target.value)}
                      placeholder="45, Anna Salai, Chennai – 600 002"
                      className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Phone</label>
                      <input
                        type="text"
                        value={clPhone}
                        onChange={e => setClPhone(e.target.value)}
                        placeholder="+91 99887 76655"
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Email</label>
                      <input
                        type="email"
                        value={clEmail}
                        onChange={e => setClEmail(e.target.value)}
                        placeholder="rajesh@client.com"
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">GST / Tax ID</label>
                    <input
                      type="text"
                      value={clGst}
                      onChange={e => setClGst(e.target.value)}
                      placeholder="33AABCC0000B1Z5"
                      className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-mono font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Invoice Details Card */}
            <div className="border border-[#f0e8a0] rounded-xl overflow-hidden bg-white shadow-2xs">
              <div
                onClick={() => toggleCard('details')}
                className="flex items-center gap-2.5 px-3 py-2.5 bg-[#fffaec] border-b border-[#f0e8a0] cursor-pointer select-none hover:bg-amber-100/50 transition-colors"
              >
                <div className="w-6 h-6 bg-[#f5c400] rounded-md grid place-items-center text-xs text-[#0a0a0a] font-bold">
                  📄
                </div>
                <span className="font-bold text-xs text-[#0a0a0a] flex-1">Invoice Details</span>
                {openCards.details ? <ChevronUp size={14} className="text-amber-800" /> : <ChevronDown size={14} className="text-amber-800" />}
              </div>

              {openCards.details && (
                <div className="p-3 space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Invoice #</label>
                      <input
                        type="text"
                        value={invNum}
                        onChange={e => setInvNum(e.target.value)}
                        className="w-full px-2 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-mono font-bold focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Invoice Date</label>
                      <input
                        type="date"
                        value={invDate}
                        onChange={e => setInvDate(e.target.value)}
                        className="w-full px-2 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Due Date</label>
                      <input
                        type="date"
                        value={invDue}
                        onChange={e => setInvDue(e.target.value)}
                        className="w-full px-2 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">PO / Ref #</label>
                      <input
                        type="text"
                        value={invPo}
                        onChange={e => setInvPo(e.target.value)}
                        placeholder="PO-2025-001"
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-mono font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Project / Subject</label>
                      <input
                        type="text"
                        value={invSub}
                        onChange={e => setInvSub(e.target.value)}
                        placeholder="Website Development"
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Currency</label>
                      <select
                        value={invCur}
                        onChange={e => setInvCur(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-bold focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      >
                        <option value="₹">INR (₹)</option>
                        <option value="$">USD ($)</option>
                        <option value="€">EUR (€)</option>
                        <option value="£">GBP (£)</option>
                        <option value="AED ">AED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Payment Status</label>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPayStatus('unpaid')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${payStatus === 'unpaid'
                              ? 'bg-red-50 text-red-700 border-red-300 shadow-2xs'
                              : 'bg-[#fffaec] text-slate-600 border-[#f0e8a0]'
                            }`}
                        >
                          Unpaid
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayStatus('partial')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${payStatus === 'partial'
                              ? 'bg-orange-50 text-orange-700 border-orange-300 shadow-2xs'
                              : 'bg-[#fffaec] text-slate-600 border-[#f0e8a0]'
                            }`}
                        >
                          Partial
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayStatus('paid')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${payStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                              : 'bg-[#fffaec] text-slate-600 border-[#f0e8a0]'
                            }`}
                        >
                          Paid
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Services & Products Card */}
            <div className="border border-[#f0e8a0] rounded-xl overflow-hidden bg-white shadow-2xs">
              <div
                onClick={() => toggleCard('items')}
                className="flex items-center gap-2.5 px-3 py-2.5 bg-[#fffaec] border-b border-[#f0e8a0] cursor-pointer select-none hover:bg-amber-100/50 transition-colors"
              >
                <div className="w-6 h-6 bg-[#f5c400] rounded-md grid place-items-center text-xs text-[#0a0a0a] font-bold">
                  📦
                </div>
                <span className="font-bold text-xs text-[#0a0a0a] flex-1">Services &amp; Products</span>
                {openCards.items ? <ChevronUp size={14} className="text-amber-800" /> : <ChevronDown size={14} className="text-amber-800" />}
              </div>

              {openCards.items && (
                <div className="p-3 space-y-3 text-xs">
                  <div className="overflow-x-auto border border-[#f0e8a0] rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-[#0a0a0a] text-white">
                        <tr className="text-[9.5px] uppercase font-bold tracking-wider">
                          <th className="py-1.5 px-2 text-left">Item / Service</th>
                          <th className="py-1.5 px-2 text-left">Description</th>
                          <th className="py-1.5 px-1 text-center w-12">Qty</th>
                          <th className="py-1.5 px-1.5 text-right w-20">Price</th>
                          <th className="py-1.5 px-2 text-right w-20">Total</th>
                          <th className="py-1.5 px-1 text-center w-7"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#fffaec]">
                        {items.map(it => (
                          <tr key={it.id}>
                            <td className="p-1">
                              <input
                                type="text"
                                value={it.name}
                                onChange={e => handleUpdateItem(it.id, 'name', e.target.value)}
                                placeholder="Service"
                                className="w-full p-1 bg-[#fffaec] border border-[#f0e8a0] rounded text-xs"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                value={it.desc}
                                onChange={e => handleUpdateItem(it.id, 'desc', e.target.value)}
                                placeholder="Description"
                                className="w-full p-1 bg-[#fffaec] border border-[#f0e8a0] rounded text-xs"
                              />
                            </td>
                            <td className="p-1 w-12">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={it.qty}
                                onChange={e => handleUpdateItem(it.id, 'qty', e.target.value)}
                                className="w-full p-1 text-center bg-[#fffaec] border border-[#f0e8a0] rounded text-xs font-mono"
                              />
                            </td>
                            <td className="p-1 w-20">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={it.price}
                                onChange={e => handleUpdateItem(it.id, 'price', e.target.value)}
                                className="w-full p-1 text-right bg-[#fffaec] border border-[#f0e8a0] rounded text-xs font-mono"
                              />
                            </td>
                            <td className="p-1 text-right w-20">
                              <span className="font-mono text-[11px] font-bold bg-[#fff8d0] px-1.5 py-1 rounded block border border-[#e6d878] whitespace-nowrap">
                                {formatCurrency(it.total)}
                              </span>
                            </td>
                            <td className="p-1 text-center w-7">
                              <button
                                onClick={() => handleRemoveItem(it.id)}
                                className="w-5 h-5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 grid place-items-center transition-colors cursor-pointer"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={handleAddItem}
                    className="w-full py-2 bg-[#fffaec] hover:bg-[#fef3b0] border border-dashed border-[#ccb840] rounded-lg text-amber-950 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    ＋ Add Row
                  </button>

                  {/* Financial Controls & Totals */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#f0e8a0]">
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Tax / GST %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={taxRate}
                          onChange={e => setTaxRate(e.target.value)}
                          className="w-full px-2 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-mono font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Discount %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={discountRate}
                          onChange={e => setDiscountRate(e.target.value)}
                          className="w-full px-2 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-mono font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                        />
                      </div>
                    </div>

                    <div className="border border-[#f0e8a0] rounded-lg overflow-hidden bg-white shadow-2xs">
                      <div className="p-2 border-b border-[#f0e8a0] flex justify-between text-xs">
                        <span className="text-slate-600">Subtotal</span>
                        <span className="font-mono font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="p-2 border-b border-[#f0e8a0] flex justify-between text-xs text-emerald-700 bg-emerald-50/50">
                          <span>Discount</span>
                          <span className="font-mono font-bold">-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      {taxAmount > 0 && (
                        <div className="p-2 border-b border-[#f0e8a0] flex justify-between text-xs text-slate-700">
                          <span>Tax</span>
                          <span className="font-mono font-semibold text-slate-900">+{formatCurrency(taxAmount)}</span>
                        </div>
                      )}
                      <div className="p-2.5 bg-[#0a0a0a] text-white flex justify-between items-center text-xs">
                        <span className="font-bold text-white/80">Total Due</span>
                        <span className="font-mono font-black text-[#f5c400] text-sm">{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Bank & Payment Details Card */}
            <div className="border border-[#f0e8a0] rounded-xl overflow-hidden bg-white shadow-2xs">
              <div
                onClick={() => toggleCard('bank')}
                className="flex items-center gap-2.5 px-3 py-2.5 bg-[#fffaec] border-b border-[#f0e8a0] cursor-pointer select-none hover:bg-amber-100/50 transition-colors"
              >
                <div className="w-6 h-6 bg-[#f5c400] rounded-md grid place-items-center text-xs text-[#0a0a0a] font-bold">
                  🏦
                </div>
                <span className="font-bold text-xs text-[#0a0a0a] flex-1">Bank &amp; Payment Details</span>
                {openCards.bank ? <ChevronUp size={14} className="text-amber-800" /> : <ChevronDown size={14} className="text-amber-800" />}
              </div>

              {openCards.bank && (
                <div className="p-3 space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={bkName}
                        onChange={e => setBkName(e.target.value)}
                        placeholder="HDFC Bank"
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Account Name</label>
                      <input
                        type="text"
                        value={bkAcName}
                        onChange={e => setBkAcName(e.target.value)}
                        placeholder="Jram Groups"
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Account Number</label>
                      <input
                        type="text"
                        value={bkAcNum}
                        onChange={e => setBkAcNum(e.target.value)}
                        placeholder="50100123456789"
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-mono font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={bkIfsc}
                        onChange={e => setBkIfsc(e.target.value)}
                        placeholder="HDFC0001234"
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-mono font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Branch</label>
                      <input
                        type="text"
                        value={bkBranch}
                        onChange={e => setBkBranch(e.target.value)}
                        placeholder="Anna Nagar, Chennai"
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">UPI ID (optional)</label>
                      <input
                        type="text"
                        value={bkUpi}
                        onChange={e => setBkUpi(e.target.value)}
                        placeholder="jramgroups@hdfcbank"
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-mono font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Payment Note</label>
                    <textarea
                      rows={2}
                      value={bkNote}
                      onChange={e => setBkNote(e.target.value)}
                      placeholder="Include invoice number in payment reference."
                      className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 6. Notes & Terms Card */}
            <div className="border border-[#f0e8a0] rounded-xl overflow-hidden bg-white shadow-2xs">
              <div
                onClick={() => toggleCard('notes')}
                className="flex items-center gap-2.5 px-3 py-2.5 bg-[#fffaec] border-b border-[#f0e8a0] cursor-pointer select-none hover:bg-amber-100/50 transition-colors"
              >
                <div className="w-6 h-6 bg-[#f5c400] rounded-md grid place-items-center text-xs text-[#0a0a0a] font-bold">
                  📝
                </div>
                <span className="font-bold text-xs text-[#0a0a0a] flex-1">Notes &amp; Terms</span>
                {openCards.notes ? <ChevronUp size={14} className="text-amber-800" /> : <ChevronDown size={14} className="text-amber-800" />}
              </div>

              {openCards.notes && (
                <div className="p-3 space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Notes</label>
                    <textarea
                      rows={2}
                      value={qNotes}
                      onChange={e => setQNotes(e.target.value)}
                      placeholder="Thank you for your business!"
                      className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Terms &amp; Conditions</label>
                    <textarea
                      rows={3}
                      value={qTerms}
                      onChange={e => setQTerms(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 7. Signature Block Card */}
            <div className="border border-[#f0e8a0] rounded-xl overflow-hidden bg-white shadow-2xs">
              <div
                onClick={() => toggleCard('signature')}
                className="flex items-center gap-2.5 px-3 py-2.5 bg-[#fffaec] border-b border-[#f0e8a0] cursor-pointer select-none hover:bg-amber-100/50 transition-colors"
              >
                <div className="w-6 h-6 bg-[#f5c400] rounded-md grid place-items-center text-xs text-[#0a0a0a] font-bold">
                  ✍️
                </div>
                <span className="font-bold text-xs text-[#0a0a0a] flex-1">Signature Block</span>
                {openCards.signature ? <ChevronUp size={14} className="text-amber-800" /> : <ChevronDown size={14} className="text-amber-800" />}
              </div>

              {openCards.signature && (
                <div className="p-3 space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Client Signatory</label>
                      <input
                        type="text"
                        value={sigClName}
                        onChange={e => setSigClName(e.target.value)}
                        placeholder="Rajesh Kumar"
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Client Designation</label>
                      <input
                        type="text"
                        value={sigClRole}
                        onChange={e => setSigClRole(e.target.value)}
                        placeholder="Managing Director"
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Company Signatory</label>
                      <input
                        type="text"
                        value={sigCoName}
                        onChange={e => setSigCoName(e.target.value)}
                        placeholder="Mr. J. Ramkumar"
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Designation</label>
                      <input
                        type="text"
                        value={sigCoRole}
                        onChange={e => setSigCoRole(e.target.value)}
                        placeholder="Founder & CEO, Jram Groups"
                        className="w-full px-2.5 py-1.5 bg-[#fffaec] border border-[#f0e8a0] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#e0a800]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Action Footer Bar */}
          <div className="p-3 bg-[#0a0a0a] border-t-2 border-[#f5c400] space-y-2 flex-shrink-0">
            <button
              onClick={handleDownloadPDF}
              className="w-full py-2 px-3 rounded-xl bg-[#f5c400] hover:bg-[#e0a800] text-[#0a0a0a] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#f5c400]/20 transition-all cursor-pointer"
            >
              <FileText size={14} className="stroke-[2.5]" />
              <span>Download PDF</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadPNG}
                className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all cursor-pointer"
              >
                <ImageIcon size={13} />
                <span>PNG Image</span>
              </button>
              <button
                onClick={handleCopyImage}
                className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all cursor-pointer"
              >
                <Copy size={13} />
                <span>Copy Image</span>
              </button>
            </div>

            <button
              onClick={handleResetForm}
              className="w-full py-1 text-[11px] text-white/40 hover:text-red-400 text-center font-semibold cursor-pointer transition-colors"
            >
              Reset Form
            </button>
          </div>
        </div>

        {/* ══ RIGHT PREVIEW PANEL (A4 Live Document) ══ */}
        <div
          className={`flex-1 min-w-0 bg-[#ccc8b8] flex-col overflow-hidden ${activeTab === 'preview' ? 'flex' : 'hidden md:flex'
            }`}
        >
          {/* Top preview toolbar */}
          <div className="h-10 bg-[#16120a]/70 backdrop-blur-md border-b border-[#f5c400]/20 flex items-center justify-between px-4 z-10 flex-shrink-0">
            <span className="text-[10px] font-bold text-[#f5c400]/70 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f5c400] animate-pulse"></span>
              A4 Live Invoice Preview
            </span>

            <div className="flex items-center bg-white/10 border border-white/15 rounded-lg overflow-hidden font-mono text-xs">
              {[
                { label: '50%', val: 0.5 },
                { label: '70%', val: 0.7 },
                { label: '90%', val: 0.9 },
                { label: '100%', val: 1.0 },
              ].map(z => (
                <button
                  key={z.label}
                  onClick={() => setZoom(z.val)}
                  className={`px-2.5 py-1 transition-colors cursor-pointer ${zoom === z.val ? 'bg-[#f5c400] text-[#0a0a0a] font-bold' : 'text-white/60 hover:text-white'
                    }`}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Viewport with Scaler */}
          <div className="flex-1 overflow-auto p-6 sm:p-10 flex justify-center items-start">
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                width: `${794 * zoom}px`,
                height: 'auto',
                transition: 'transform 0.15s ease-out'
              }}
              className="flex-shrink-0"
            >
              {/* ════ A4 INVOICE DOCUMENT SHELL ════ */}
              <div
                ref={docRef}
                id="idoc"
                style={{
                  width: '794px',
                  minHeight: '1122px',
                  background: '#ffffff',
                  boxShadow: '0 8px 40px rgba(0,0,0,.18), 0 1px 4px rgba(0,0,0,.07)',
                  borderRadius: '2px',
                  fontFamily: "'DM Sans', sans-serif",
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Left yellow sidebar stripe */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '6px',
                    background: 'linear-gradient(180deg, #f5c400 0%, #e0a800 50%, #f5c400 100%)',
                    zIndex: 20
                  }}
                />

                {/* ── HEADER ── */}
                <div style={{ padding: '34px 40px 0 52px', position: 'relative', overflow: 'hidden' }}>
                  {/* Faint watermark */}
                  <div
                    style={{
                      position: 'absolute',
                      right: '-14px',
                      top: '-8px',
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '148px',
                      color: '#f5c400',
                      opacity: 0.07,
                      letterSpacing: '-4px',
                      lineHeight: 1,
                      pointerEvents: 'none',
                      userSelect: 'none',
                      zIndex: 0
                    }}
                  >
                    INVOICE
                  </div>

                  {/* Dot Grid accent */}
                  <div
                    style={{
                      position: 'absolute',
                      right: '38px',
                      top: '28px',
                      width: '80px',
                      height: '80px',
                      backgroundImage: 'radial-gradient(circle, #f5c400 1.5px, transparent 1.5px)',
                      backgroundSize: '12px 12px',
                      opacity: 0.28,
                      pointerEvents: 'none'
                    }}
                  />

                  {/* Top content row */}
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', paddingBottom: '24px' }}>
                    {/* Left Brand Col */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                          style={{
                            width: '56px',
                            height: '56px',
                            background: '#0a0a0a',
                            borderRadius: '14px',
                            display: 'grid',
                            placeItems: 'center',
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: '28px',
                            color: '#f5c400',
                            flexShrink: 0,
                            overflow: 'hidden'
                          }}
                        >
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            coName.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div>
                          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '30px', color: '#0a0a0a', letterSpacing: '1.2px', lineHeight: 1 }}>
                            {coName}
                          </div>
                          <div style={{ fontSize: '9px', fontWeight: 600, color: '#8a7430', letterSpacing: '2.5px', textTransform: 'uppercase', marginTop: '3px' }}>
                            {coTag.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {[coAddr, coPhone, coEmail, coWeb].filter(Boolean).map((line, idx) => (
                          <div key={idx} style={{ fontSize: '10.5px', color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '3px', height: '3px', background: '#f5c400', borderRadius: '50%', flexShrink: 0 }}></span>
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>

                      {coGst && (
                        <div
                          style={{
                            display: 'inline-block',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '9px',
                            background: '#fff8d0',
                            border: '1px solid #e6d878',
                            color: '#5a4a1a',
                            padding: '3px 9px',
                            borderRadius: '4px',
                            letterSpacing: '0.5px',
                            marginTop: '4px',
                            width: 'fit-content'
                          }}
                        >
                          GST: {coGst}
                        </div>
                      )}
                    </div>

                    {/* Right Title Col */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '64px', color: '#0a0a0a', letterSpacing: '3px', lineHeight: 1 }}>
                          INVOICE
                        </div>
                        <div style={{ height: '4px', background: '#f5c400', width: '100%', marginTop: '2px', borderRadius: '2px' }} />
                      </div>

                      <div style={{ marginTop: '10px', textAlign: 'right' }}>
                        <div style={{ fontSize: '8px', fontWeight: 700, color: '#8a7430', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                          Invoice Number
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '15px', fontWeight: 500, color: '#0a0a0a', letterSpacing: '0.5px' }}>
                          #{invNum || 'JRG-INV-001'}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '5px 14px',
                          borderRadius: '20px',
                          letterSpacing: '0.3px',
                          marginTop: '9px',
                          background: payStatus === 'paid' ? '#f0fdf4' : payStatus === 'partial' ? '#fff7ed' : '#fef2f2',
                          color: payStatus === 'paid' ? '#15803d' : payStatus === 'partial' ? '#c2410c' : '#b91c1c',
                          border: `1.5px solid ${payStatus === 'paid' ? '#86efac' : payStatus === 'partial' ? '#fdba74' : '#fca5a5'}`
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'block' }}></span>
                        <span>{payStatus === 'paid' ? 'Paid' : payStatus === 'partial' ? 'Partial' : 'Unpaid'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Meta Bar */}
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      borderTop: '1.5px solid #0a0a0a',
                      margin: '0 -40px 0 -52px',
                      padding: '12px 40px 12px 52px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      background: '#ffffff'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#8a7430', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '3px' }}>
                        Invoice Date
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0a0a0a' }}>
                        {formatDateDisplay(invDate)}
                      </div>
                    </div>

                    <div style={{ borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
                      <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#8a7430', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '3px' }}>
                        Due Date
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: payStatus !== 'paid' ? '#b91c1c' : '#0a0a0a' }}>
                        {formatDateDisplay(invDue)}
                      </div>
                    </div>

                    <div style={{ borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
                      <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#8a7430', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '3px' }}>
                        Subject
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {invSub || '—'}
                      </div>
                    </div>

                    <div style={{ borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
                      <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#8a7430', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '3px' }}>
                        PO / Ref
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0a0a0a' }}>
                        {invPo || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Header Bottom Gold Accent */}
                  <div style={{ height: '3px', background: '#f5c400', margin: '0 -40px 0 -52px' }} />
                </div>

                {/* ── PARTIES (From & Bill To) ── */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', padding: '0 40px 0 52px' }}>
                  <div style={{ flex: 1, padding: '16px 0' }}>
                    <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#c98400', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '16px', height: '2px', background: '#f5c400', borderRadius: '2px', display: 'block' }}></span>
                      From
                    </div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: '13.5px', color: '#0a0a0a', marginBottom: '5px' }}>
                      {coName}
                    </div>
                    <div style={{ fontSize: '10px', color: '#666', lineHeight: 1.8 }}>
                      {[coAddr, coPhone, coEmail, coWeb, coGst ? `GST: ${coGst}` : ''].filter(Boolean).map((l, i) => (
                        <div key={i}>{l}</div>
                      ))}
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: '16px 0 16px 24px', borderLeft: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#c98400', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '16px', height: '2px', background: '#f5c400', borderRadius: '2px', display: 'block' }}></span>
                      Bill To
                    </div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: '13.5px', color: '#0a0a0a', marginBottom: '5px' }}>
                      {clCo || clName || 'Client Company'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#666', lineHeight: 1.8 }}>
                      {[clName, clAddr, clPhone, clEmail, clGst ? `GST: ${clGst}` : ''].filter(Boolean).map((l, i) => (
                        <div key={i}>{l}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── BODY ── */}
                <div style={{ flex: 1, padding: '18px 40px 18px 52px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                  {/* Items Table */}
                  <div>
                    <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#c98400', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Services &amp; Products</span>
                      <span style={{ flex: 1, height: '1px', background: '#efefef' }}></span>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                      <thead>
                        <tr style={{ background: '#0a0a0a' }}>
                          <th style={{ padding: '9px 12px', textAlign: 'left', fontSize: '8.5px', fontWeight: 600, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: '.8px', width: '25%' }}>Item / Service</th>
                          <th style={{ padding: '9px 12px', textAlign: 'left', fontSize: '8.5px', fontWeight: 600, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: '.8px', width: '32%' }}>Description</th>
                          <th style={{ padding: '9px 12px', textAlign: 'right', fontSize: '8.5px', fontWeight: 600, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: '.8px', width: '8%' }}>Qty</th>
                          <th style={{ padding: '9px 12px', textAlign: 'right', fontSize: '8.5px', fontWeight: 600, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: '.8px', width: '17%' }}>Unit Price</th>
                          <th style={{ padding: '9px 12px', textAlign: 'right', fontSize: '8.5px', fontWeight: 600, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: '.8px', width: '18%' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, idx) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#fafafa' : '#ffffff' }}>
                            <td style={{ padding: '9px 12px', borderBottom: '1px solid #f7f7f7', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 600, color: '#0a0a0a', fontSize: '11.5px' }}>{it.name || '—'}</div>
                            </td>
                            <td style={{ padding: '9px 12px', borderBottom: '1px solid #f7f7f7', verticalAlign: 'top' }}>
                              <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>{it.desc}</div>
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', borderBottom: '1px solid #f7f7f7', verticalAlign: 'top' }}>
                              {it.qty}
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', borderBottom: '1px solid #f7f7f7', verticalAlign: 'top' }}>
                              {formatCurrency(it.price)}
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', borderBottom: '1px solid #f7f7f7', verticalAlign: 'top', fontWeight: 600 }}>
                              {formatCurrency(it.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ height: '2px', background: '#f5c400' }} />
                  </div>

                  {/* Bottom Row: Bank & Totals */}
                  <div style={{ display: 'grid', gridTemplateColumns: hasBankDetails ? '1fr auto' : '1fr', gap: '16px', alignItems: 'start' }}>
                    {/* Bank Card */}
                    {hasBankDetails && (
                      <div style={{ background: '#fafafa', border: '1px solid #efefef', borderRadius: '10px', padding: '14px 16px', borderLeft: '3px solid #f5c400' }}>
                        <div style={{ fontSize: '8px', fontWeight: 700, color: '#8a7430', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px' }}>
                          Payment Details
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 16px' }}>
                          {bkName && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span style={{ fontSize: '8px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Bank</span>
                              <span style={{ fontSize: '11px', color: '#0a0a0a', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{bkName}</span>
                            </div>
                          )}
                          {bkAcName && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span style={{ fontSize: '8px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Account Name</span>
                              <span style={{ fontSize: '11px', color: '#0a0a0a', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{bkAcName}</span>
                            </div>
                          )}
                          {bkAcNum && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span style={{ fontSize: '8px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Account No.</span>
                              <span style={{ fontSize: '11px', color: '#0a0a0a', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{bkAcNum}</span>
                            </div>
                          )}
                          {bkIfsc && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span style={{ fontSize: '8px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>IFSC</span>
                              <span style={{ fontSize: '11px', color: '#0a0a0a', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{bkIfsc}</span>
                            </div>
                          )}
                          {bkBranch && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span style={{ fontSize: '8px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Branch</span>
                              <span style={{ fontSize: '11px', color: '#0a0a0a', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{bkBranch}</span>
                            </div>
                          )}
                          {bkUpi && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span style={{ fontSize: '8px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>UPI ID</span>
                              <span style={{ fontSize: '11px', color: '#0a0a0a', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{bkUpi}</span>
                            </div>
                          )}
                        </div>
                        {bkNote && (
                          <div style={{ fontSize: '10px', color: '#888', marginTop: '8px', borderTop: '1px solid #efefef', paddingTop: '7px' }}>
                            {bkNote}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Totals Box */}
                    <div style={{ minWidth: '240px', justifySelf: hasBankDetails ? 'end' : 'end', width: hasBankDetails ? 'auto' : '260px', marginLeft: hasBankDetails ? '0' : 'auto' }}>
                      <div style={{ border: '1px solid #efefef', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 13px', fontSize: '12px', borderBottom: '1px solid #f5f5f5' }}>
                          <span style={{ color: '#888' }}>Subtotal</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 500 }}>{formatCurrency(subtotal)}</span>
                        </div>

                        {discountAmount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 13px', fontSize: '12px', borderBottom: '1px solid #f5f5f5' }}>
                            <span style={{ color: '#888' }}>Discount ({discountRate}%)</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 500, color: '#15803d' }}>-{formatCurrency(discountAmount)}</span>
                          </div>
                        )}

                        {taxAmount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 13px', fontSize: '12px', borderBottom: '1px solid #f5f5f5' }}>
                            <span style={{ color: '#888' }}>Tax ({taxRate}%)</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 500 }}>+{formatCurrency(taxAmount)}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 13px', background: '#0a0a0a' }}>
                          <span style={{ color: 'rgba(255,255,255,.65)', fontWeight: 600, fontSize: '12.5px' }}>Total Due</span>
                          <span style={{ color: '#f5c400', fontSize: '14px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(grandTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Terms */}
                  {(qNotes || qTerms) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {qNotes && (
                        <div style={{ background: '#fafafa', border: '1px solid #efefef', borderRadius: '9px', padding: '12px 14px', borderLeft: '3px solid #fff8d0' }}>
                          <div style={{ fontSize: '8px', fontWeight: 700, color: '#8a7430', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                            Notes
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#666', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                            {qNotes}
                          </div>
                        </div>
                      )}

                      {qTerms && (
                        <div style={{ background: '#fafafa', border: '1px solid #efefef', borderRadius: '9px', padding: '12px 14px', borderLeft: '3px solid #fff8d0' }}>
                          <div style={{ fontSize: '8px', fontWeight: 700, color: '#8a7430', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                            Terms &amp; Conditions
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#666', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                            {qTerms}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* ── SIGNATURE BAND ── */}
                <div style={{ borderTop: '1px solid #efefef', padding: '18px 40px 20px 52px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', background: '#ffffff' }}>
                  <div>
                    <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#8a7430', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Client Signature &amp; Acceptance
                    </div>
                    <div style={{ height: '1px', background: '#ccc', margin: '48px 0 10px' }} />
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: '13px', fontWeight: 700, color: '#0a0a0a' }}>
                      {sigClName || 'Client Name'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#888', marginTop: '1px' }}>
                      {sigClRole || 'Authorized Signatory'}
                    </div>
                    <div style={{ fontSize: '9px', color: '#bbb', marginTop: '6px' }}>
                      Date: ___________________________
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#8a7430', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                      For Jram Groups — Authorized Signatory
                    </div>
                    <div style={{ height: '1px', background: '#ccc', margin: '48px 0 10px' }} />
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: '13px', fontWeight: 700, color: '#0a0a0a' }}>
                      {sigCoName || 'Mr. J. Ramkumar'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#888', marginTop: '1px' }}>
                      {sigCoRole || 'Founder & CEO, Jram Groups'}
                    </div>
                    <div style={{ fontSize: '9px', color: '#bbb', marginTop: '6px' }}>
                      Date: ___________________________
                    </div>
                  </div>
                </div>

                {/* ── PAGE FOOTER ── */}
                <div style={{ padding: '10px 40px 10px 52px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: '#bbb', borderTop: '1px solid #efefef', background: '#ffffff' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '13px', color: '#0a0a0a', letterSpacing: '0.5px' }}>
                    Jram <em style={{ color: '#f5c400', fontStyle: 'normal' }}>Groups</em>
                  </div>
                  <div>{[coEmail, coWeb].filter(Boolean).join(' · ') || 'info@jramgroups.com'}</div>
                  <div>This is a computer-generated invoice</div>
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Floating Toast */}
      {toastMsg && (
        <div
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold shadow-lg transition-all flex items-center gap-1.5 ${toastMsg.isError ? 'bg-red-700 text-white' : 'bg-[#0a0a0a] text-white border border-[#f5c400]'
            }`}
        >
          <span>{toastMsg.isError ? '✗' : '✓'}</span>
          <span>{toastMsg.text}</span>
        </div>
      )}
    </div>
  );
}
