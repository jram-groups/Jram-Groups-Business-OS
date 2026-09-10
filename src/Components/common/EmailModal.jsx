import { useState, useEffect } from 'react';
import { X, Send, Mail, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

export default function EmailModal({ isOpen, onClose, defaultEmail, defaultSubject, defaultBody }) {
  const [email, setEmail] = useState(defaultEmail || '');
  const [subject, setSubject] = useState(defaultSubject || 'Official Document from JRAM Groups');
  const [body, setBody] = useState(
    defaultBody || 'Dear Partner,\n\nPlease find attached official project document from JRAM Groups.\n\nBest regards,\nJRAM Groups Operations'
  );
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (defaultEmail !== undefined) setEmail(defaultEmail || '');
    if (defaultSubject !== undefined) setSubject(defaultSubject || 'Official Document from JRAM Groups');
    if (defaultBody !== undefined) setBody(defaultBody || 'Dear Partner,\n\nPlease find attached official project document from JRAM Groups.\n\nBest regards,\nJRAM Groups Operations');
  }, [defaultEmail, defaultSubject, defaultBody, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.communications.sendEmail({
        recipient_email: email,
        subject: subject,
        body: body,
        recipient_name: email.split('@')[0]
      });

      setSuccessMsg('Email dispatched successfully and logged in Email History!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      alert(err.message || 'Error sending email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-blue-200 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600 text-white font-bold">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Integrated Email Composer</h3>
              <p className="text-xs text-slate-500">Django backend SMTP & audit integration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {successMsg ? (
          <div className="py-8 text-center text-blue-600 font-bold space-y-2">
            <CheckCircle2 size={42} className="mx-auto" />
            <p>{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Recipient Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-mono"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Subject</label>
              <input
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-medium"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Message Content</label>
              <textarea
                rows={5}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500"
                value={body}
                onChange={e => setBody(e.target.value)}
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
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send size={15} /> Send Email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
