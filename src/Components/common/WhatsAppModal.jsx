import { useState, useEffect } from 'react';
import { X, Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

export default function WhatsAppModal({ isOpen, onClose, defaultRecipient, defaultType, defaultMsg }) {
  const [name, setName] = useState(defaultRecipient?.name || 'Valued Client');
  const [phone, setPhone] = useState(defaultRecipient?.phone || defaultRecipient?.whatsapp || '');
  const [type, setType] = useState(defaultType || 'Invoice');
  const [message, setMessage] = useState(
    defaultMsg || `Hello ${name},\n\nPlease find your official ${type} from JRAM Groups.\n\nThank you,\nJRAM Groups Team`
  );
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (defaultRecipient) {
      const recipientName = defaultRecipient.name || 'Valued Client';
      const recipientPhone = defaultRecipient.phone || defaultRecipient.whatsapp || '';
      setName(recipientName);
      setPhone(recipientPhone);
      if (!defaultMsg) {
        setMessage(`Hello ${recipientName},\n\nPlease find your official ${defaultType || type} from JRAM Groups.\n\nThank you,\nJRAM Groups Team`);
      }
    }
    if (defaultType) setType(defaultType);
    if (defaultMsg) setMessage(defaultMsg);
  }, [defaultRecipient, defaultType, defaultMsg, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.communications.sendWhatsApp({
        recipient_name: name,
        whatsapp_number: phone,
        message_type: type,
        message_text: message
      });

      if (res.whatsapp_url) {
        window.open(res.whatsapp_url, '_blank');
      }
      setSuccessMsg('WhatsApp message dispatched and logged in Audit history!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      alert(err.message || 'Error sending WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-200 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500 text-white font-bold">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">WhatsApp Direct Share</h3>
              <p className="text-xs text-slate-500">Secure backend integration & audit log</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {successMsg ? (
          <div className="py-8 text-center text-emerald-600 font-bold space-y-2">
            <CheckCircle2 size={42} className="mx-auto" />
            <p>{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Recipient Name</label>
              <input
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">WhatsApp Number</label>
              <input
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Message Type</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
                value={type}
                onChange={e => setType(e.target.value)}
              >
                <option>Invoice</option>
                <option>Quotation</option>
                <option>Project Update</option>
                <option>Payment Reminder</option>
                <option>Custom Message</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Message Content</label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send size={15} /> Send WhatsApp
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
