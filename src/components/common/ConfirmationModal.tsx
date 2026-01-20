import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    type = 'info'
}: ConfirmationModalProps) => {
    if (!isOpen) return null;

    const colors = {
        danger: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
        warning: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20',
        info: 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/20'
    };

    const iconColors = {
        danger: 'text-red-400 bg-red-400/10',
        warning: 'text-orange-400 bg-orange-400/10',
        info: 'text-teal-400 bg-teal-400/10'
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
            <div className="bg-dark-card border border-white/10 rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${iconColors[type]}`}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                    <p className="text-gray-400">{message}</p>
                </div>

                <div className="p-6 bg-white/5 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-white font-bold hover:bg-white/5 transition-all"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-3 text-dark-bg font-bold rounded-xl transition-all shadow-lg ${colors[type]}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
