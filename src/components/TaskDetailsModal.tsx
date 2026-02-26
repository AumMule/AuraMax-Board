import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Calendar, Tag, AlertCircle, TrendingUp, AlignLeft, Image as ImageIcon, Clock } from "lucide-react";
import type { Task } from "../type/task";
import { useState, useEffect } from "react";
import { cn } from "../lib/utils";

interface TaskDetailsModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updatedTask: Task) => void;
    onDelete: (id: string) => void;
}

const TaskDetailsModal = ({ task, isOpen, onClose, onUpdate, onDelete }: TaskDetailsModalProps) => {
    const [editTask, setEditTask] = useState<Task | null>(task);

    useEffect(() => {
        setEditTask(task);
    }, [task]);

    if (!editTask) return null;

    const handleSave = () => {
        if (editTask) {
            onUpdate(editTask);
            onClose();
        }
    };

    const urgencyOptions = [
        { value: 1, label: "Low", color: "bg-slate-100 text-slate-600" },
        { value: 3, label: "Medium", color: "bg-amber-100 text-amber-600" },
        { value: 4, label: "High", color: "bg-orange-100 text-orange-600" },
        { value: 5, label: "Critical", color: "bg-red-500 text-white" },
    ];

    const cardColors = [
        { name: "Default", value: "" },
        { name: "Ice", value: "#dbeafe" },
        { name: "Mint", value: "#d1fae5" },
        { name: "Peach", value: "#fecdd3" },
        { name: "Honey", value: "#fde68a" },
        { name: "Lavender", value: "#e9d5ff" },
        { name: "Sky", value: "#bae6fd" },
        { name: "Coral", value: "#fda4af" },
    ];

    // Helper: format timestamp to YYYY-MM-DD for input[type=date]
    const formatDateForInput = (timestamp?: number) => {
        if (!timestamp) return "";
        const d = new Date(timestamp);
        return d.toISOString().split("T")[0];
    };

    const isOverdue = editTask.dueDate && editTask.dueDate < Date.now() && editTask.status !== 'done';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="relative w-full max-w-2xl bg-white/95 backdrop-blur-3xl border border-white/50 rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden"
                    >
                        {/* Header with optional cover bg */}
                        <div className="relative overflow-hidden">
                            {/* Clear cover image background */}
                            {editTask.coverImage && (
                                <>
                                    <img
                                        src={editTask.coverImage}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        alt=""
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-white" />
                                </>
                            )}
                            {/* Fallback gradient when no image */}
                            {!editTask.coverImage && (
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50" />
                            )}

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className={cn(
                                    "absolute top-6 right-6 z-20 p-2 rounded-full transition-all shadow-xl hover:scale-110",
                                    editTask.coverImage
                                        ? "bg-white/10 backdrop-blur-md text-white hover:bg-white/90 hover:text-slate-800"
                                        : "bg-white/80 text-slate-400 hover:text-slate-800"
                                )}
                            >
                                <X size={20} />
                            </button>

                            {/* Remove cover button */}
                            {editTask.coverImage && (
                                <button
                                    onClick={() => setEditTask({ ...editTask, coverImage: "" })}
                                    className="absolute top-6 left-6 z-20 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white/60 hover:text-white hover:bg-red-500/80 transition-all text-[9px] font-bold uppercase tracking-widest"
                                >
                                    Remove Cover
                                </button>
                            )}

                            {/* Title & metadata overlaid */}
                            <div className="relative z-10 p-8 md:p-12 pb-8">
                                <input
                                    type="text"
                                    value={editTask.title}
                                    onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                                    placeholder="Task Title"
                                    className={cn(
                                        "text-4xl font-black bg-transparent border-none outline-none placeholder:text-slate-200 w-full tracking-tight",
                                        editTask.coverImage ? "text-white drop-shadow-lg" : "text-slate-900"
                                    )}
                                />
                                <div className="flex items-center gap-3 flex-wrap mt-3">
                                    <div className={cn(
                                        "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                                        editTask.coverImage ? "bg-white/15 text-white/70 backdrop-blur-sm" : "bg-slate-100/80 text-slate-400"
                                    )}>
                                        <Calendar size={12} className={editTask.coverImage ? "text-white/70" : "text-indigo-500"} />
                                        Created {new Date(editTask.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                                        editTask.coverImage ? "bg-white/15 text-white/70 backdrop-blur-sm" : "bg-slate-100/80 text-slate-400"
                                    )}>
                                        <Tag size={12} className={editTask.coverImage ? "text-white/70" : "text-emerald-500"} />
                                        {editTask.status}
                                    </div>
                                    {isOverdue && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-red-500/80 text-white px-2.5 py-1 rounded-full animate-pulse backdrop-blur-sm">
                                            <AlertCircle size={12} />
                                            Overdue
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 md:p-12 pt-6 flex flex-col gap-10 max-h-[55vh] overflow-y-auto custom-scrollbar">
                            {/* Cover Image URL — compact inline */}
                            <div className="flex items-center gap-3">
                                <ImageIcon size={14} className="text-slate-300 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={editTask.coverImage || ""}
                                    onChange={(e) => setEditTask({ ...editTask, coverImage: e.target.value })}
                                    placeholder="Paste cover image URL..."
                                    className="flex-1 bg-transparent border-b border-dashed border-slate-200 px-1 py-1.5 text-xs font-medium text-slate-500 outline-none focus:border-indigo-400 transition-colors placeholder:text-slate-300"
                                />
                            </div>

                            {/* Due Date */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 text-slate-800">
                                    <Clock size={16} className="text-rose-500" />
                                    <span className="text-xs font-black uppercase tracking-widest">Due Date</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="date"
                                        value={formatDateForInput(editTask.dueDate)}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setEditTask({
                                                ...editTask,
                                                dueDate: val ? new Date(val).getTime() + 86400000 - 1 : undefined
                                            });
                                        }}
                                        className={cn(
                                            "bg-slate-50/50 border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-indigo-500/10 transition-all cursor-pointer",
                                            isOverdue ? "border-red-200 text-red-600 bg-red-50/50" : "border-slate-100 text-slate-600"
                                        )}
                                    />
                                    {editTask.dueDate && (
                                        <button
                                            onClick={() => setEditTask({ ...editTask, dueDate: undefined })}
                                            className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            Clear
                                        </button>
                                    )}
                                    {editTask.dueDate && !isOverdue && (
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {Math.ceil((editTask.dueDate - Date.now()) / 86400000)} days left
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Color Selector Section */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 text-slate-800">
                                    <div className="h-4 w-1 bg-indigo-500 rounded-full" />
                                    <span className="text-xs font-black uppercase tracking-widest">Card Theme</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {cardColors.map((color) => (
                                        <button
                                            key={color.name}
                                            onClick={() => setEditTask({ ...editTask, color: color.value })}
                                            title={color.name}
                                            className={cn(
                                                "w-10 h-10 rounded-2xl border-2 transition-all hover:scale-110 relative",
                                                editTask.color === color.value
                                                    ? "border-slate-900 shadow-xl scale-110"
                                                    : "border-slate-100 hover:border-slate-200"
                                            )}
                                            style={{ backgroundColor: color.value || '#ffffff' }}
                                        >
                                            {editTask.color === color.value && (
                                                <motion.div layoutId="colorActive" className="absolute inset-0 flex items-center justify-center">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                                                </motion.div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tags Section */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-slate-800">
                                    <Tag size={16} className="text-emerald-500" />
                                    <span className="text-xs font-black uppercase tracking-widest">Category Tags</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {editTask.tags?.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border border-emerald-100"
                                        >
                                            {tag}
                                            <button
                                                onClick={() => setEditTask({ ...editTask, tags: editTask.tags?.filter(t => t !== tag) })}
                                                className="hover:text-red-500 transition-colors"
                                            >
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        placeholder="+ New Tag"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = (e.target as HTMLInputElement).value.trim();
                                                if (val && !editTask.tags?.includes(val)) {
                                                    setEditTask({ ...editTask, tags: [...(editTask.tags || []), val] });
                                                    (e.target as HTMLInputElement).value = "";
                                                }
                                            }
                                        }}
                                        className="bg-transparent border-b border-dashed border-slate-300 px-2 py-1 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-indigo-500 transition-colors w-24"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-slate-800">
                                    <AlignLeft size={16} className="text-indigo-500" />
                                    <span className="text-xs font-black uppercase tracking-widest">Description</span>
                                </div>
                                <textarea
                                    value={editTask.description || ""}
                                    onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                                    placeholder="What is this task about? Add some context..."
                                    className="w-full h-32 bg-slate-50/50 rounded-2xl p-4 text-sm font-medium text-slate-600 outline-none focus:ring-2 ring-indigo-500/10 border border-slate-100 transition-all resize-none"
                                />
                            </div>

                            {/* Urgency & Impact */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2 text-slate-800">
                                        <AlertCircle size={16} className="text-orange-500" />
                                        <span className="text-xs font-black uppercase tracking-widest">Urgency</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {urgencyOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setEditTask({ ...editTask, urgency: opt.value })}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                                    editTask.urgency === opt.value
                                                        ? opt.color + " shadow-lg"
                                                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2 text-slate-800">
                                        <TrendingUp size={16} className="text-blue-500" />
                                        <span className="text-xs font-black uppercase tracking-widest">Impact Factor</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            step="1"
                                            value={editTask.impact}
                                            onChange={(e) => setEditTask({ ...editTask, impact: parseInt(e.target.value) })}
                                            className="flex-1 accent-indigo-500 cursor-pointer"
                                        />
                                        <span className="text-xl font-black text-indigo-600 w-4">{editTask.impact}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 md:px-10 py-6 bg-slate-50/80 border-t border-white/20 flex items-center justify-between">
                            <button
                                onClick={() => { onDelete(editTask.id); onClose(); }}
                                className="flex items-center gap-2 text-red-400 hover:text-red-500 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors"
                            >
                                <Trash2 size={14} />
                                Terminate Task
                            </button>

                            <div className="flex gap-4">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-indigo-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TaskDetailsModal;
