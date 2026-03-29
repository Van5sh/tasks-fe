type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function Modal({ open, title, onClose, children, footer }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="glass w-full max-w-lg rounded-3xl border border-white/60 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--ink)]">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600"
          >
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {footer ? <div className="mt-4 flex flex-wrap gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
