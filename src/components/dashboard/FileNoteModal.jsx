import { createPortal } from 'react-dom';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

export default function FileNoteModal({ file, onClose }) {
  if (!file) return null;

  const note = (file.description || '').trim();

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Card className="rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <i className="fas fa-sticky-note text-amber-500 text-sm"></i>
            </div>
            <h3 className="text-sm font-semibold text-dark-text">Note</h3>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-gray-400 hover:text-dark-text hover:bg-gray-100"
          >
            <i className="fas fa-times"></i>
          </Button>
        </div>

        <div className="px-6 py-4 max-h-[60vh] overflow-auto">
          {note ? (
            <p className="text-sm text-dark-text whitespace-pre-wrap break-words leading-relaxed">{note}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">No note provided.</p>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
        </div>
      </Card>
    </div>,
    document.body
  );
}
