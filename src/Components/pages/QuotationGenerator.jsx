import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft, Check, Download, Image as ImageIcon, Copy, RotateCcw,
  Plus, Trash2, ChevronDown, ChevronUp, Eye, FileText, CheckCircle2,
  ExternalLink, Sparkles, Building2, User, HelpCircle, Layers
} from 'lucide-react';
import { api } from '../../services/api';

export default function QuotationGenerator() {
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
  const [coFounder, setCoFounder] = useState('Mr. J. Ramkumar');

  // 2. Client Information
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clName, setClName] = useState('');
  const [clCo, setClCo] = useState('');
  const [clAddr, setClAddr] = useState('');
  const [clPhone, setClPhone] = useState('');
  const [clEmail, setClEmail] = useState('');
  const [clGst, setClGst] = useState('');

  // 3. Quotation Details
  const [qNum, setQNum] = useState('');
  const [qDate, setQDate] = useState('');
  const [qValid, setQValid] = useState('');
  const [qCur, setQCur] = useState('₹');
  const [qSub, setQSub] = useState('');
  const [projectId, setProjectId] = useState(null);

  // 4. Items / Services
  const [items, setItems] = useState([
    { id: 1, name: 'Web Application Development', desc: 'Custom enterprise software with responsive modern UI', qty: 1, price: 50000, total: 50000 },
    { id: 2, name: 'Cloud Infrastructure & Deployment', desc: 'Secure AWS/VPS hosting setup with CI/CD automation', qty: 1, price: 15000, total: 15000 },
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [discountRate, setDiscountRate] = useState(0);

  // 5. Notes & Terms
  const [qNotes, setQNotes] = useState('Thank you for choosing Jram Groups. Payment is due within 30 days of invoice date.');
  const [qTerms, setQTerms] = useState(
    '1. 50% advance payment required before commencement of work.\n2. All prices are exclusive of applicable taxes.\n3. Delivery timeline commences after receipt of advance.\n4. Any changes to scope may result in revised pricing.'
  );

  // 6. Signatures
  const [sigClName, setSigClName] = useState('');
  const [sigClRole, setSigClRole] = useState('Managing Director');
  const [sigCoName, setSigCoName] = useState('Mr. J. Ramkumar');
  const [sigCoRole, setSigCoRole] = useState('Founder & CEO, Jram Groups');

  // Toast / notification
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg, isError = false) => {
    setToastMsg({ text: msg, isError });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const docRef = useRef(null);

  // Fetch CRM clients list
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

  // Initialize dates & quote number or load from navigation state / edit ID
  useEffect(() => {
    const today = new Date();
    const validDate = new Date(today);
    validDate.setDate(validDate.getDate() + 30);

    const todayStr = today.toISOString().split('T')[0];
    const validStr = validDate.toISOString().split('T')[0];

    setQDate(todayStr);
    setQValid(validStr);
    setQNum(`JRG-${today.getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`);

    // Check if incoming state from Project pipeline
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
      setQSub(p.name || 'Project Implementation');
      if (p.budget) {
        setItems([
          {
            id: Date.now(),
            name: p.name || 'Project Implementation',
            desc: p.description || p.service_type || 'Complete end-to-end delivery scope',
            qty: 1,
            price: Number(p.budget),
            total: Number(p.budget)
          }
        ]);
      }
    }
  }, [location.state]);

  // Load existing quotation if editId is provided
  useEffect(() => {
    if (!editId) return;
    api.finance.getQuotation(editId)
      .then(q => {
        if (!q) return;
        setQNum(q.reference || '');
        setQDate(q.quotation_date || '');
        setQValid(q.valid_until || '');
        setQCur(q.currency || '₹');
        setQSub(q.subject || '');
        setTaxRate(q.tax_rate ?? 0);
        setDiscountRate(q.discount_rate ?? 0);
        setQNotes(q.notes || '');
        setQTerms(q.terms || '');
        if (q.items && Array.isArray(q.items) && q.items.length > 0) {
          setItems(q.items);
        }
        if (q.client) setSelectedClientId(q.client);
        if (q.project) setProjectId(q.project);

        if (q.company_details) {
          if (q.company_details.name) setCoName(q.company_details.name);
          if (q.company_details.tagline) setCoTag(q.company_details.tagline);
          if (q.company_details.address) setCoAddr(q.company_details.address);
          if (q.company_details.phone) setCoPhone(q.company_details.phone);
          if (q.company_details.email) setCoEmail(q.company_details.email);
          if (q.company_details.website) setCoWeb(q.company_details.website);
          if (q.company_details.gst) setCoGst(q.company_details.gst);
          if (q.company_details.founder) setCoFounder(q.company_details.founder);
          if (q.company_details.logo) setLogoUrl(q.company_details.logo);
        }

        if (q.client_details) {
          if (q.client_details.name) setClName(q.client_details.name);
          if (q.client_details.company) setClCo(q.client_details.company);
          if (q.client_details.address) setClAddr(q.client_details.address);
          if (q.client_details.phone) setClPhone(q.client_details.phone);
          if (q.client_details.email) setClEmail(q.client_details.email);
          if (q.client_details.gst) setClGst(q.client_details.gst);
        } else if (q.client_detail) {
          const c = q.client_detail;
          setClName(c.name || '');
          setClCo(c.company || '');
          setClAddr([c.address, c.city, c.state, c.postal_code].filter(Boolean).join(', ') || c.address || '');
          setClPhone(c.phone || c.whatsapp || '');
          setClEmail(c.email || '');
          setClGst(c.gst_vat_number || '');
        }

        if (q.signature_details) {
          if (q.signature_details.sig_cl_name) setSigClName(q.signature_details.sig_cl_name);
          if (q.signature_details.sig_cl_role) setSigClRole(q.signature_details.sig_cl_role);
          if (q.signature_details.sig_co_name) setSigCoName(q.signature_details.sig_co_name);
          if (q.signature_details.sig_co_role) setSigCoRole(q.signature_details.sig_co_role);
        }
        showToast(`Loaded quotation ${q.reference}`);
      })
      .catch(err => {
        console.error(err);
        showToast('Error loading quotation for edit', true);
      });
  }, [editId]);

  // When a CRM client is picked from dropdown
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
    return `${qCur}${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  // Download PNG
  const handleDownloadPNG = async () => {
    try {
      showToast('Generating high-res PNG...');
      const canvas = await captureDocCanvas();
      const a = document.createElement('a');
      a.download = `${qNum || 'quotation'}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      showToast('PNG Downloaded Successfully! ✓');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error generating PNG', true);
    }
  };

  // Download PDF via jsPDF
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
      pdf.save(`${qNum || 'quotation'}.pdf`);
      showToast('PDF Saved Successfully! ✓');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error generating PDF', true);
    }
  };

  // Copy image to clipboard
  const handleCopyImage = async () => {
    try {
      showToast('Rendering for clipboard...');
      const canvas = await captureDocCanvas();
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          showToast('Quotation image copied to clipboard! ✓');
        } catch {
          showToast('Clipboard direct copy restricted. Please use Download PNG', true);
        }
      }, 'image/png');
    } catch (err) {
      showToast(err.message || 'Error copying image', true);
    }
  };

  // RESET FORM
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
    setQSub('');
    showToast('Form reset');
  };

  // SAVE & DONE (Writes to DB and redirects back to /quotations)
  const handleDone = async () => {
    // Determine client ID
    let finalClientId = selectedClientId;
    if (!finalClientId) {
      // Find matching client by name or company from list
      const matched = clientsList.find(
        c => (clName && c.name?.toLowerCase() === clName.toLowerCase()) ||
          (clCo && c.company?.toLowerCase() === clCo.toLowerCase())
      );
      if (matched) {
        finalClientId = matched.id;
      } else if (clName.trim() || clCo.trim()) {
        // Auto-create client in DB so quotation can be linked!
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
      alert('Please select or specify a Client for this quotation.');
      setOpenCards(p => ({ ...p, client: true }));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        reference: qNum || `QT-${Date.now().toString().slice(-6)}`,
        client: finalClientId,
        project: projectId || null,
        items: items,
        subtotal: subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total_amount: grandTotal,
        quotation_date: qDate || new Date().toISOString().split('T')[0],
        valid_until: qValid || new Date().toISOString().split('T')[0],
        currency: qCur,
        subject: qSub,
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
          founder: coFounder,
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
        signature_details: {
          sig_cl_name: sigClName || clName,
          sig_cl_role: sigClRole,
          sig_co_name: sigCoName || coFounder,
          sig_co_role: sigCoRole,
        },
        terms: qTerms,
        notes: qNotes,
        status: 'Sent',
      };

      if (editId) {
        await api.finance.updateQuotation(editId, payload);
      } else {
        await api.finance.createQuotation(payload);
      }

      alert(`Quotation ${payload.reference} saved successfully to database!`);
      navigate('/quotations');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error saving quotation to database');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#f9f4e3] text-[#1a1508] font-['Inter',sans-serif] overflow-hidden">
      {/* ── TOP HEADER ── */}
      <header className="h-[54px] bg-[#0a0a0a] flex items-center justify-between px-4 sm:px-6 z-30 border-b-2 border-[#f5c400] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quotations')}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center gap-1 text-xs"
            title="Back to Quotations List"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline font-semibold">Back</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] bg-[#f5c400] rounded-lg grid place-items-center font-['Playfair_Display',serif] font-extrabold text-base text-[#0a0a0a] shadow-xs">
              J
            </div>
            <div className="font-['Playfair_Display',serif] font-bold text-base text-white">
              Jram <span className="text-[#f5c400]">Groups</span>
            </div>
          </div>
          <span className="hidden md:inline-block bg-[#f5c400]/15 border border-[#f5c400]/30 text-[#f5c400] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            ✦ Quotation Generator
          </span>
        </div>

        {/* Right side with DONE button */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-white/60 text-xs">
            <span>Live Total:</span>
            <span className="text-[#f5c400] font-bold font-mono text-sm">{formatCurrency(grandTotal)}</span>
          </div>

          <button
            onClick={handleDone}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-[#f5c400] hover:bg-[#e6b800] text-[#0a0a0a] font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-[#f5c400]/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
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
          👁 A4 Preview
        </button>
      </div>

      {/* ── WORKSPACE ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── LEFT FORM PANEL ── */}
        <div className={`w-full md:w-[430px] md:min-w-[340px] md:max-w-[430px] bg-white border-r border-[#e8d98a] flex flex-col h-full overflow-hidden ${activeTab === 'preview' ? 'hidden md:flex' : 'flex'
          }`}>
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 scrollbar-thin">
            {/* CARD 1: Company Information */}
            <div className="border border-[#e8d98a] rounded-xl overflow-hidden bg-white shadow-2xs">
              <div
                onClick={() => toggleCard('company')}
                className="flex items-center gap-2 p-2.5 bg-[#fff8d6] border-b border-[#e8d98a] cursor-pointer select-none"
              >
                <div className="w-6 h-6 bg-[#f5c400] rounded grid place-items-center text-xs">🏢</div>
                <div className="font-bold text-xs text-[#0a0a0a] flex-1">Company Information</div>
                <ChevronDown size={14} className={`text-[#8a7830] transition-transform ${openCards.company ? '' : '-rotate-90'}`} />
              </div>
              {openCards.company && (
                <div className="p-3 space-y-2.5 text-xs">
                  <div>
                    <label className="text-[9.5px] font-bold text-[#8a7830] uppercase tracking-wider block mb-1">Company Logo</label>
                    {logoUrl ? (
                      <div className="flex items-center gap-2 p-2 bg-[#fdf9ee] border border-[#e8d98a] rounded-lg">
                        <img src={logoUrl} alt="Logo" className="max-h-8 max-w-[70px] object-contain rounded" />
                        <span className="flex-1 text-[11px] text-[#4a3d10]">Logo uploaded ✓</span>
                        <button onClick={() => setLogoUrl(null)} className="text-[11px] text-red-600 underline cursor-pointer">Remove</button>
                      </div>
                    ) : (
                      <label className="border border-dashed border-[#d4c464] rounded-lg p-3 text-center cursor-pointer bg-[#fdf9ee] hover:bg-[#fff8d6] block transition-all">
                        <div className="text-lg">🖼</div>
                        <p className="text-[11px] text-[#4a3d10]"><strong>Click to upload</strong> company logo</p>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Company Name</label>
                      <input className="form-input text-xs" value={coName} onChange={e => setCoName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Tagline</label>
                      <input className="form-input text-xs" value={coTag} onChange={e => setCoTag(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Address</label>
                    <input className="form-input text-xs" value={coAddr} onChange={e => setCoAddr(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Phone</label>
                      <input className="form-input text-xs font-mono" value={coPhone} onChange={e => setCoPhone(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Email</label>
                      <input className="form-input text-xs font-mono" value={coEmail} onChange={e => setCoEmail(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Website</label>
                      <input className="form-input text-xs font-mono" value={coWeb} onChange={e => setCoWeb(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">GST / Tax ID</label>
                      <input className="form-input text-xs font-mono uppercase" value={coGst} onChange={e => setCoGst(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Founder / Authorized By</label>
                    <input className="form-input text-xs" value={coFounder} onChange={e => setCoFounder(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            {/* CARD 2: Client Information */}
            <div className="border border-[#e8d98a] rounded-xl overflow-hidden bg-white shadow-2xs">
              <div
                onClick={() => toggleCard('client')}
                className="flex items-center gap-2 p-2.5 bg-[#fff8d6] border-b border-[#e8d98a] cursor-pointer select-none"
              >
                <div className="w-6 h-6 bg-[#f5c400] rounded grid place-items-center text-xs">👤</div>
                <div className="font-bold text-xs text-[#0a0a0a] flex-1">Client Information</div>
                <ChevronDown size={14} className={`text-[#8a7830] transition-transform ${openCards.client ? '' : '-rotate-90'}`} />
              </div>
              {openCards.client && (
                <div className="p-3 space-y-2.5 text-xs">
                  {/* Select from CRM Clients Dropdown */}
                  <div>
                    <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5 flex items-center justify-between">
                      <span>Choose From CRM Clients</span>
                      <span className="text-[9px] text-[#f5c400] font-black uppercase">Auto-fills</span>
                    </label>
                    <select
                      className="form-input text-xs font-semibold cursor-pointer"
                      value={selectedClientId}
                      onChange={e => handleSelectClient(e.target.value)}
                    >
                      <option value="">-- Manual Input / Select Client --</option>
                      {clientsList.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.company ? `(${c.company})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Contact Name *</label>
                      <input className="form-input text-xs" placeholder="e.g. Rajesh Kumar" value={clName} onChange={e => setClName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Company *</label>
                      <input className="form-input text-xs" placeholder="Client Corp" value={clCo} onChange={e => setClCo(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Address</label>
                    <input className="form-input text-xs" placeholder="Billing address" value={clAddr} onChange={e => setClAddr(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Phone</label>
                      <input className="form-input text-xs font-mono" placeholder="+91 99887 76655" value={clPhone} onChange={e => setClPhone(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Email</label>
                      <input className="form-input text-xs font-mono" placeholder="client@company.com" value={clEmail} onChange={e => setClEmail(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">GST / Tax ID</label>
                    <input className="form-input text-xs font-mono uppercase" placeholder="33AABCC0000B1Z5" value={clGst} onChange={e => setClGst(e.target.value.toUpperCase())} />
                  </div>
                </div>
              )}
            </div>

            {/* CARD 3: Quotation Details */}
            <div className="border border-[#e8d98a] rounded-xl overflow-hidden bg-white shadow-2xs">
              <div
                onClick={() => toggleCard('details')}
                className="flex items-center gap-2 p-2.5 bg-[#fff8d6] border-b border-[#e8d98a] cursor-pointer select-none"
              >
                <div className="w-6 h-6 bg-[#f5c400] rounded grid place-items-center text-xs">📄</div>
                <div className="font-bold text-xs text-[#0a0a0a] flex-1">Quotation Details</div>
                <ChevronDown size={14} className={`text-[#8a7830] transition-transform ${openCards.details ? '' : '-rotate-90'}`} />
              </div>
              {openCards.details && (
                <div className="p-3 space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Quote #</label>
                      <input className="form-input text-xs font-mono" value={qNum} onChange={e => setQNum(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Date</label>
                      <input type="date" className="form-input text-xs" value={qDate} onChange={e => setQDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Valid Until</label>
                      <input type="date" className="form-input text-xs" value={qValid} onChange={e => setQValid(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Currency</label>
                      <select className="form-input text-xs font-bold" value={qCur} onChange={e => setQCur(e.target.value)}>
                        <option value="₹">INR (₹)</option>
                        <option value="$">USD ($)</option>
                        <option value="€">EUR (€)</option>
                        <option value="£">GBP (£)</option>
                        <option value="AED ">AED</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Subject / Project</label>
                      <input className="form-input text-xs" placeholder="ERP Implementation" value={qSub} onChange={e => setQSub(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CARD 4: Services & Products */}
            <div className="border border-[#e8d98a] rounded-xl overflow-hidden bg-white shadow-2xs">
              <div
                onClick={() => toggleCard('items')}
                className="flex items-center gap-2 p-2.5 bg-[#fff8d6] border-b border-[#e8d98a] cursor-pointer select-none"
              >
                <div className="w-6 h-6 bg-[#f5c400] rounded grid place-items-center text-xs">📦</div>
                <div className="font-bold text-xs text-[#0a0a0a] flex-1">Services &amp; Products</div>
                <ChevronDown size={14} className={`text-[#8a7830] transition-transform ${openCards.items ? '' : '-rotate-90'}`} />
              </div>
              {openCards.items && (
                <div className="p-3 space-y-3 text-xs">
                  <div className="overflow-x-auto border border-[#e8d98a] rounded-lg">
                    <table className="w-full text-[11px] border-collapse min-w-[340px]">
                      <thead className="bg-[#fff8d6]">
                        <tr className="border-b border-[#e8d98a] text-[9px] font-bold text-[#8a7830] uppercase">
                          <th className="p-1.5 text-left">Item</th>
                          <th className="p-1.5 text-left">Description</th>
                          <th className="p-1.5 text-center w-12">Qty</th>
                          <th className="p-1.5 text-right w-20">Unit Price</th>
                          <th className="p-1.5 text-right w-20">Total</th>
                          <th className="p-1.5 w-6 text-center"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(it => (
                          <tr key={it.id} className="border-b border-[#f9f4e3] last:border-b-0">
                            <td className="p-1">
                              <input
                                className="w-full px-1.5 py-1 text-[11px] border border-[#e8d98a] rounded bg-[#fdf9ee]"
                                placeholder="Service name"
                                value={it.name}
                                onChange={e => handleUpdateItem(it.id, 'name', e.target.value)}
                              />
                            </td>
                            <td className="p-1">
                              <input
                                className="w-full px-1.5 py-1 text-[11px] border border-[#e8d98a] rounded bg-[#fdf9ee]"
                                placeholder="Details"
                                value={it.desc}
                                onChange={e => handleUpdateItem(it.id, 'desc', e.target.value)}
                              />
                            </td>
                            <td className="p-1 w-12">
                              <input
                                type="number"
                                min="1"
                                className="w-full px-1 py-1 text-[11px] text-center border border-[#e8d98a] rounded bg-[#fdf9ee]"
                                value={it.qty}
                                onChange={e => handleUpdateItem(it.id, 'qty', e.target.value)}
                              />
                            </td>
                            <td className="p-1 w-20">
                              <input
                                type="number"
                                min="0"
                                className="w-full px-1.5 py-1 text-[11px] text-right font-mono border border-[#e8d98a] rounded bg-[#fdf9ee]"
                                value={it.price}
                                onChange={e => handleUpdateItem(it.id, 'price', e.target.value)}
                              />
                            </td>
                            <td className="p-1 w-20 text-right font-mono font-bold text-[10.5px]">
                              {formatCurrency(it.total)}
                            </td>
                            <td className="p-1 text-center">
                              <button
                                onClick={() => handleRemoveItem(it.id)}
                                className="text-slate-400 hover:text-red-600 cursor-pointer p-0.5"
                                title="Remove row"
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
                    type="button"
                    onClick={handleAddItem}
                    className="w-full py-1.5 bg-[#fff8d6] hover:bg-[#fef3b0] border border-dashed border-[#d4c464] rounded-lg text-xs font-bold text-[#4a3d10] flex items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <Plus size={14} /> Add Row
                  </button>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Tax Rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          className="form-input text-xs font-mono"
                          value={taxRate}
                          onChange={e => setTaxRate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Discount Rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          className="form-input text-xs font-mono"
                          value={discountRate}
                          onChange={e => setDiscountRate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="border border-[#e8d98a] rounded-lg overflow-hidden bg-white text-xs">
                      <div className="flex justify-between p-1.5 border-b border-[#e8d98a]">
                        <span className="text-[#4a3d10]">Subtotal</span>
                        <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between p-1.5 border-b border-[#e8d98a] text-emerald-700">
                          <span>Discount ({discountRate}%)</span>
                          <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      {taxAmount > 0 && (
                        <div className="flex justify-between p-1.5 border-b border-[#e8d98a]">
                          <span className="text-[#4a3d10]">Tax ({taxRate}%)</span>
                          <span className="font-mono">{formatCurrency(taxAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between p-2 bg-[#0a0a0a] text-white">
                        <span className="font-bold">Grand Total</span>
                        <span className="font-mono font-extrabold text-[#f5c400] text-sm">{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CARD 5: Notes & Terms & Conditions */}
            <div className="border border-[#e8d98a] rounded-xl overflow-hidden bg-white shadow-2xs">
              <div
                onClick={() => toggleCard('notes')}
                className="flex items-center gap-2 p-2.5 bg-[#fff8d6] border-b border-[#e8d98a] cursor-pointer select-none"
              >
                <div className="w-6 h-6 bg-[#f5c400] rounded grid place-items-center text-xs">📝</div>
                <div className="font-bold text-xs text-[#0a0a0a] flex-1">Notes &amp; Terms &amp; Conditions</div>
                <ChevronDown size={14} className={`text-[#8a7830] transition-transform ${openCards.notes ? '' : '-rotate-90'}`} />
              </div>
              {openCards.notes && (
                <div className="p-3 space-y-2.5 text-xs">
                  <div>
                    <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Customer Notes</label>
                    <textarea
                      rows={2}
                      className="form-input text-xs"
                      value={qNotes}
                      onChange={e => setQNotes(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Terms &amp; Conditions</label>
                    <textarea
                      rows={4}
                      className="form-input text-xs"
                      value={qTerms}
                      onChange={e => setQTerms(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CARD 6: Signatures */}
            <div className="border border-[#e8d98a] rounded-xl overflow-hidden bg-white shadow-2xs">
              <div
                onClick={() => toggleCard('signature')}
                className="flex items-center gap-2 p-2.5 bg-[#fff8d6] border-b border-[#e8d98a] cursor-pointer select-none"
              >
                <div className="w-6 h-6 bg-[#f5c400] rounded grid place-items-center text-xs">✍️</div>
                <div className="font-bold text-xs text-[#0a0a0a] flex-1">Signature Block</div>
                <ChevronDown size={14} className={`text-[#8a7830] transition-transform ${openCards.signature ? '' : '-rotate-90'}`} />
              </div>
              {openCards.signature && (
                <div className="p-3 space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Client Signatory Name</label>
                      <input className="form-input text-xs" value={sigClName} onChange={e => setSigClName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Designation</label>
                      <input className="form-input text-xs" value={sigClRole} onChange={e => setSigClRole(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Company Signatory</label>
                      <input className="form-input text-xs" value={sigCoName} onChange={e => setSigCoName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold text-[#8a7830] uppercase block mb-0.5">Designation</label>
                      <input className="form-input text-xs" value={sigCoRole} onChange={e => setSigCoRole(e.target.value)} />
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
              className="w-full py-2 bg-[#f5c400] hover:bg-[#e6b800] text-[#0a0a0a] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-[#f5c400]/40 transition-all cursor-pointer"
            >
              <Download size={14} /> Download Official PDF
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadPNG}
                className="py-1.5 px-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all border border-white/15"
              >
                <ImageIcon size={13} /> PNG Image
              </button>
              <button
                onClick={handleCopyImage}
                className="py-1.5 px-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all border border-white/15"
              >
                <Copy size={13} /> Copy Image
              </button>
            </div>
            <button
              onClick={handleResetForm}
              className="w-full text-center text-[11px] text-white/40 hover:text-red-400 py-0.5 cursor-pointer"
            >
              Reset Form Fields
            </button>
          </div>
        </div>

        {/* ── RIGHT PREVIEW PANEL ── */}
        <div className={`flex-1 flex-col bg-[#c8c2a8] overflow-hidden ${activeTab === 'form' ? 'hidden md:flex' : 'flex'
          }`}>
          {/* Zoom Topbar */}
          <div className="h-10 bg-[#1a1508]/80 backdrop-blur-md border-b border-[#f5c400]/20 flex items-center justify-between px-4 z-20 flex-shrink-0">
            <span className="text-[10px] font-bold text-[#f5c400]/80 tracking-wider uppercase">
              ◉ A4 Live Document Preview
            </span>
            <div className="flex items-center bg-white/10 border border-white/15 rounded-md overflow-hidden text-xs">
              {[0.5, 0.7, 0.85, 1.0].map(z => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  className={`px-2.5 py-1 font-mono font-bold transition-all cursor-pointer ${zoom === z ? 'bg-[#f5c400] text-[#0a0a0a]' : 'text-white/60 hover:bg-white/10'
                    }`}
                >
                  {Math.round(z * 100)}%
                </button>
              ))}
            </div>
          </div>

          {/* Scaled Document Scroll Container */}
          <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start scrollbar-thin">
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                width: '794px',
                marginBottom: '100px'
              }}
              className="transition-transform duration-100 flex-shrink-0"
            >
              {/* ═══════════════════════════════════════════
                  QUOTATION A4 DOCUMENT (#qdoc)
              ═══════════════════════════════════════════ */}
              <div
                id="qdoc"
                ref={docRef}
                className="w-[794px] min-h-[1123px] bg-white shadow-2xl rounded-xs flex flex-col relative overflow-hidden font-['Inter',sans-serif] text-[13.5px]"
              >
                {/* ── GRAPHIC WHITE + YELLOW HEADER ── */}
                <div className="relative overflow-hidden bg-white flex-shrink-0">
                  {/* Geometric graphic background */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute w-[340px] h-[340px] bg-[#f5c400] -top-[60px] -right-[60px] rotate-[18deg] rounded-[28px]" />
                    <div className="absolute w-[180px] h-[180px] bg-[#ffe44d] top-[20px] right-[120px] rotate-[18deg] rounded-[18px] opacity-35" />
                    <div className="absolute w-[6px] h-[500px] bg-[#0a0a0a] -top-[80px] left-[260px] rotate-[18deg] opacity-[0.07]" />
                    <div className="absolute w-[3px] h-[500px] bg-[#0a0a0a] -top-[80px] left-[272px] rotate-[18deg] opacity-[0.04]" />
                    <div className="absolute w-[80px] h-[80px] border-[10px] border-[#f5c400] rounded-full bottom-[8px] left-[32px] opacity-15" />
                  </div>

                  {/* Content row */}
                  <div className="relative z-10 flex items-stretch min-h-[150px]">
                    {/* Brand block */}
                    <div className="flex-1 p-[32px_36px_28px] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3.5">
                          <div className="w-14 h-14 bg-[#0a0a0a] rounded-xl grid place-items-center font-['Playfair_Display',serif] font-black text-[26px] text-[#f5c400] flex-shrink-0 overflow-hidden shadow-xs">
                            {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" /> : coName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-['Bebas_Neue',sans-serif] text-[34px] text-[#0a0a0a] tracking-[1.5px] leading-none">
                              {coName}
                            </div>
                            <div className="font-['DM_Sans',sans-serif] text-[9px] font-medium text-[#8a7830] tracking-[3px] uppercase mt-1">
                              {coTag}
                            </div>
                          </div>
                        </div>

                        {/* Contact details strip */}
                        <div className="flex gap-4 mt-3.5 flex-wrap text-[#666] font-['DM_Sans',sans-serif] text-[10px]">
                          {coEmail && (
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#f5c400]" />
                              {coEmail}
                            </span>
                          )}
                          {coPhone && (
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#f5c400]" />
                              {coPhone}
                            </span>
                          )}
                          {coWeb && (
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#f5c400]" />
                              {coWeb}
                            </span>
                          )}
                        </div>

                        {coGst && (
                          <div className="mt-2">
                            <span className="font-mono text-[9px] bg-[#0a0a0a] text-[#f5c400] px-2 py-0.5 rounded tracking-wide">
                              GST: {coGst}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: QUOTATION title block on yellow */}
                    <div
                      style={{ clipPath: 'polygon(16px 0%, 100% 0%, 100% 100%, 0% 100%)' }}
                      className="w-[230px] bg-[#f5c400] flex flex-col justify-center items-start p-[28px_28px_28px_32px] relative"
                    >
                      <div className="font-['Bebas_Neue',sans-serif] text-[46px] text-[#0a0a0a] tracking-[2px] leading-none">
                        QUOTATION
                      </div>
                      <div className="font-mono text-[11px] font-medium text-[#0a0a0a] bg-black/10 px-2.5 py-1 rounded mt-2 tracking-wide">
                        #{qNum}
                      </div>
                      <div className="mt-3 flex flex-col gap-1 text-[9.5px] text-black/70 font-['DM_Sans',sans-serif]">
                        <div><strong className="block text-[10px] text-black font-bold">{formatDateDisplay(qDate)}</strong>Date</div>
                        <div><strong className="block text-[10px] text-black font-bold">{formatDateDisplay(qValid)}</strong>Valid Until</div>
                        {qSub && (
                          <div><strong className="block text-[10px] text-black font-bold">{qSub}</strong>Subject</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Black + yellow bottom bar */}
                  <div className="h-1 bg-[#f5c400] relative">
                    <div className="absolute left-0 top-0 bottom-0 w-[40%] bg-[#0a0a0a]" />
                  </div>
                </div>

                {/* ── DOC BODY ── */}
                <div className="p-[28px_42px] flex-1 flex flex-col gap-5">
                  {/* Parties Row */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="bg-[#fdf9ee] border border-[#e8d98a] rounded-xl p-3.5">
                      <div className="text-[8.5px] font-bold text-[#8a7830] tracking-[1.5px] uppercase mb-1.5 flex items-center gap-1.5">
                        <span className="w-3.5 h-0.5 bg-[#f5c400] rounded block" /> From
                      </div>
                      <div className="font-['Playfair_Display',serif] font-bold text-sm text-[#0a0a0a] mb-1">
                        {coName}
                      </div>
                      <div className="text-[11px] text-[#4a3d10] leading-relaxed">
                        {coAddr && <p>{coAddr}</p>}
                        {coPhone && <p>Ph: {coPhone}</p>}
                        {coEmail && <p>Email: {coEmail}</p>}
                        {coGst && <p>GST: {coGst}</p>}
                      </div>
                    </div>

                    <div className="bg-[#fdf9ee] border border-[#e8d98a] rounded-xl p-3.5">
                      <div className="text-[8.5px] font-bold text-[#8a7830] tracking-[1.5px] uppercase mb-1.5 flex items-center gap-1.5">
                        <span className="w-3.5 h-0.5 bg-[#f5c400] rounded block" /> Bill To
                      </div>
                      <div className="font-['Playfair_Display',serif] font-bold text-sm text-[#0a0a0a] mb-1">
                        {clCo || clName || 'Client Company'}
                      </div>
                      <div className="text-[11px] text-[#4a3d10] leading-relaxed">
                        {clName && <p>Attn: {clName}</p>}
                        {clAddr && <p>{clAddr}</p>}
                        {clPhone && <p>Ph: {clPhone}</p>}
                        {clEmail && <p>Email: {clEmail}</p>}
                        {clGst && <p>GST: {clGst}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Services & Products Table */}
                  <div>
                    <div className="text-[8.5px] font-bold text-[#8a7830] tracking-[1.5px] uppercase pb-1.5 border-b-2 border-[#f5c400] mb-2 flex items-center gap-1.5">
                      Services &amp; Products Specification
                    </div>
                    <table className="w-full text-[11.5px] border-collapse">
                      <thead>
                        <tr className="bg-[#0a0a0a] text-white/70 text-[9px] font-semibold uppercase tracking-wider">
                          <th className="p-2 text-left w-[24%]">Item / Service</th>
                          <th className="p-2 text-left w-[34%]">Description</th>
                          <th className="p-2 text-right w-[10%]">Qty</th>
                          <th className="p-2 text-right w-[16%]">Unit Price</th>
                          <th className="p-2 text-right w-[16%]">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr><td colSpan="5" className="p-6 text-center text-slate-400 italic">No line items specified.</td></tr>
                        ) : (
                          items.map((it, idx) => (
                            <tr key={it.id} className={idx % 2 === 1 ? 'bg-[#fdfcf7]' : 'bg-white'}>
                              <td className="p-2.5 align-top font-semibold text-[#0a0a0a]">{it.name || '—'}</td>
                              <td className="p-2.5 align-top text-[10.5px] text-[#4a3d10]">{it.desc}</td>
                              <td className="p-2.5 align-top text-right font-mono">{it.qty}</td>
                              <td className="p-2.5 align-top text-right font-mono">{formatCurrency(it.price)}</td>
                              <td className="p-2.5 align-top text-right font-mono font-bold text-[#0a0a0a]">{formatCurrency(it.total)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Block */}
                  <div className="flex justify-end">
                    <div className="w-[240px] border border-[#e8d98a] rounded-xl overflow-hidden bg-white text-xs">
                      <div className="flex justify-between p-2 border-b border-[#e8d98a]">
                        <span className="text-[#4a3d10]">Subtotal</span>
                        <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between p-2 border-b border-[#e8d98a] text-emerald-700">
                          <span>Discount ({discountRate}%)</span>
                          <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      {taxAmount > 0 && (
                        <div className="flex justify-between p-2 border-b border-[#e8d98a]">
                          <span className="text-[#4a3d10]">Tax ({taxRate}%)</span>
                          <span className="font-mono">{formatCurrency(taxAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between p-2.5 bg-[#0a0a0a] text-white">
                        <span className="font-bold">Grand Total</span>
                        <span className="font-mono font-extrabold text-[#f5c400] text-sm">{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Terms Block */}
                  {(qNotes || qTerms) && (
                    <div className="grid grid-cols-2 gap-3.5 mt-1">
                      {qNotes && (
                        <div className="bg-[#fff8d6] border border-[#e8d98a] rounded-xl p-3">
                          <div className="text-[8.5px] font-bold text-[#7a6520] tracking-[1.2px] uppercase mb-1.5 flex items-center gap-1.5">
                            <span className="w-2.5 h-0.5 bg-[#f5c400] rounded block" /> Notes
                          </div>
                          <div className="text-[10.5px] text-[#4a3d10] leading-relaxed whitespace-pre-wrap">{qNotes}</div>
                        </div>
                      )}
                      {qTerms && (
                        <div className="bg-[#fff8d6] border border-[#e8d98a] rounded-xl p-3">
                          <div className="text-[8.5px] font-bold text-[#7a6520] tracking-[1.2px] uppercase mb-1.5 flex items-center gap-1.5">
                            <span className="w-2.5 h-0.5 bg-[#f5c400] rounded block" /> Terms &amp; Conditions
                          </div>
                          <div className="text-[10.5px] text-[#4a3d10] leading-relaxed whitespace-pre-wrap">{qTerms}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Signatures Section */}
                  <div className="pt-4 border-t border-[#e8d98a] grid grid-cols-2 gap-6 mt-auto">
                    <div className="flex flex-col">
                      <div className="text-[9px] font-bold text-[#8a7830] tracking-[1.2px] uppercase mb-2">
                        Client Signature &amp; Acceptance
                      </div>
                      <div className="h-6 border-b border-[#1a1508] relative mb-1">
                        <span className="absolute bottom-1 left-0 text-[8.5px] text-[#8a7830] italic">Sign below</span>
                      </div>
                      <div className="font-['Playfair_Display',serif] text-xs font-bold text-[#0a0a0a] mt-8">{sigClName || clName || 'Client Signatory'}</div>
                      <div className="text-[10px] text-[#4a3d10]">{sigClRole || 'Authorized Signatory'}</div>
                      <div className="text-[9.5px] text-[#8a7830] mt-1">Date: _______________</div>
                    </div>

                    <div className="flex flex-col text-right">
                      <div className="text-[9px] font-bold text-[#8a7830] tracking-[1.2px] uppercase mb-2">
                        For {coName} — Authorized Signatory
                      </div>
                      <div className="h-6 border-b border-[#1a1508] relative mb-1">
                        <span className="absolute bottom-1 right-0 text-[8.5px] text-[#8a7830] italic">Authorized stamp / sign</span>
                      </div>
                      <div className="font-['Playfair_Display',serif] text-xs font-bold text-[#0a0a0a] mt-8">{sigCoName || coFounder}</div>
                      <div className="text-[10px] text-[#4a3d10]">{sigCoRole}</div>
                      <div className="text-[9.5px] text-[#8a7830] mt-1">Date: _______________</div>
                    </div>
                  </div>
                </div>

                {/* ── FOOTER STRIP ── */}
                <div className="bg-[#0a0a0a] p-[13px_42px] flex justify-between items-center text-[10px] text-white/40 flex-shrink-0 border-t-[3px] border-[#f5c400]">
                  <div className="font-['Bebas_Neue',sans-serif] text-sm text-white/85 tracking-wider">
                    JRAM <em className="text-[#f5c400] not-italic">GROUPS</em>
                  </div>
                  <div>{coEmail || 'info@jramgroups.com'} {coWeb ? `• ${coWeb}` : ''}</div>
                  <div>Computer-Generated Official Quotation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 border transition-all animate-in fade-in slide-in-from-bottom-3 ${toastMsg.isError ? 'bg-red-900 text-white border-red-500' : 'bg-[#0a0a0a] text-white border-[#f5c400]'
          }`}>
          {toastMsg.isError ? '✗' : '✓'} {toastMsg.text}
        </div>
      )}
    </div>
  );
}
