import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, X } from 'lucide-react';

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userRole?: string;
  userName?: string;
}

export default function LogoutConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  userName
}: LogoutConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-blue-950/30 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md bg-blue-50/70 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-blue-950/20 border border-white/80 overflow-hidden"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 shadow-xs">
              <LogOut className="w-6 h-6 stroke-[2.5]" />
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-900/5 hover:bg-slate-900/10 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 pt-3 space-y-2">
            <h3 className="text-xl font-black text-blue-950 tracking-tight">
              Confirm Sign Out
            </h3>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">
              Are you sure you want to sign out{userName ? `, ${userName}` : ''}? You can sign back in at any time.
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 pt-4 bg-white/40 border-t border-white/60 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white/80 hover:bg-white text-blue-900 border border-slate-200/90 font-extrabold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                onConfirm();
              }}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
