import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Calendar, Tag, AlertCircle, TrendingUp, AlignLeft, Image as ImageIcon, Clock, CheckSquare } from "lucide-react";
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
        { value: 1, label: "Low", activeClass: "bg-zinc-700 text-zinc-200 border-zinc-600" },
        { value: 3, label: "Medium", activeClass: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
        { value: 4, label: "High", activeClass: "bg-orange-500/20 text-orange-400 border-orange-500/40" },
        { value: 5, label: "Critical", activeClass: "bg-red-500/20 text-red-400 border-red-500/40" },
    ];

    const cardColors = [
        { name: "None", value: "" },
        { name: "Ocean", value: "#1e3a5f" },
        { name: "Forest", value: "#1a3a2a" },
        { name: "Ember", value: "#3d1f0f" },
        { name: "Dusk", value: "#2d1a3d" },
        { name: "Slate", value: "#1a2035" },
        { name: "Rose", value: "#3d1a24" },
        { name: "Gold", value: "#332200" },
    ];

    const formatDateForInput = (timestamp?: number) => {
        if (!timestamp) return "";
        return new Date(timestamp).toISOString().split("T")[0];
    };

    const isOverdue = editTask.dueDate && editTask.dueDate < Date.now() && editTask.status !== 'done';
    const now = Date.now();
    const timeInStatus = now - editTask.statusChangedAt;
    const statusLabel = editTask.status === 'doing' ? 'In Orbit' : editTask.status === 'todo' ? 'Backlog' : 'Done';
    const completedCount = editTask.checklists?.filter(i => i.completed).length || 0;
    const totalCount = editTask.checklists?.length || 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="relative w-full max-w-xl bg-[#111111] border border-white/[0.08] rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header section */}
                        <div className="relative overflow-hidden flex-shrink-0">
                            {/* Subtle gradient background based on urgency */}
                            <div className={cn(
                                "absolute inset-0",
                                editTask.urgency >= 5
                                    ? "bg-gradient-to-br from-red-950/40 via-transparent to-transparent"
                                    : editTask.urgency >= 4
                                        ? "bg-gradient-to-br from-orange-950/40 via-transparent to-transparent"
                                        : "bg-gradient-to-br from-zinc-900/60 via-transparent to-transparent"
                            )} />

                            {/* Cover image if present */}
                            {editTask.coverImage && (
                                <>
                                    <img
                                        src={editTask.coverImage}
                                        className="absolute inset-0 w-full h-full object-cover opacity-25"
                                        alt=""
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-[#111111]" />
                                </>
                            )}

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-500 hover:text-zinc-200 transition-all"
                            >
                                <X size={16} />
                            </button>

                            {/* Remove cover button */}
                            {editTask.coverImage && (
                                <button
                                    onClick={() => setEditTask({ ...editTask, coverImage: "" })}
                                    className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-[10px] font-bold uppercase tracking-widest border border-white/[0.06]"
                                >
                                    Remove Cover
                                </button>
                            )}

                            {/* Title + meta */}
                            <div className="relative z-10 px-6 pt-6 pb-5">
                                <input
                                    type="text"
                                    value={editTask.title}
                                    onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                                    placeholder="Task Title"
                                    className="text-2xl font-black bg-transparent border-none outline-none placeholder:text-zinc-700 w-full tracking-tight text-white mb-3"
                                />

                                {/* Status chips row */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Status badge */}
                                    <span className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                                        editTask.status === 'doing'
                                            ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                            : editTask.status === 'done'
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : "bg-zinc-800 text-zinc-500 border-zinc-700/50"
                                    )}>
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            editTask.status === 'doing' ? "bg-orange-400" : editTask.status === 'done' ? "bg-emerald-400" : "bg-zinc-600"
                                        )} />
                                        {statusLabel}
                                    </span>

                                    {/* Created */}
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/[0.03] text-zinc-600 border border-white/[0.05]">
                                        <Calendar size={10} className="text-zinc-600" />
                                        {new Date(editTask.createdAt).toLocaleDateString()}
                                    </span>

                                    {/* Active time for doing tasks */}
                                    {editTask.status === 'doing' && (
                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                            <Clock size={10} />
                                            {Math.floor(timeInStatus / 3600000) > 0
                                                ? `${Math.floor(timeInStatus / 3600000)}h ${Math.floor((timeInStatus % 3600000) / 60000)}m active`
                                                : `${Math.floor(timeInStatus / 60000)}m active`
                                            }
                                        </span>
                                    )}

                                    {isOverdue && (
                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse">
                                            <AlertCircle size={10} />
                                            Overdue
                                        </span>
                                    )}
                                </div>

                                {/* Checklist mini-progress */}
                                {totalCount > 0 && (
                                    <div className="mt-3 flex items-center gap-3">
                                        <div className="flex-1 h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
                                                style={{ width: `${(completedCount / totalCount) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-600 flex items-center gap-1 flex-shrink-0">
                                            <CheckSquare size={10} />
                                            {completedCount}/{totalCount}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-white/[0.05] flex-shrink-0" />

                        {/* Scrollable body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
                            {/* Cover Image URL */}
                            <div className="flex items-center gap-3">
                                <ImageIcon size={13} className="text-zinc-700 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={editTask.coverImage || ""}
                                    onChange={(e) => setEditTask({ ...editTask, coverImage: e.target.value })}
                                    placeholder="Paste cover image URL..."
                                    className="flex-1 bg-transparent border-b border-dashed border-white/[0.08] px-1 py-1.5 text-xs font-medium text-zinc-500 outline-none focus:border-orange-500/40 transition-colors placeholder:text-zinc-800"
                                />
                            </div>

                            {/* Due Date */}
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center gap-2">
                                    <Clock size={13} className="text-rose-500/70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Due Date</span>
                                </div>
                                <div className="flex items-center gap-3">
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
                                            "bg-white/[0.04] border rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-1 ring-orange-500/20 transition-all",
                                            isOverdue
                                                ? "border-red-500/30 text-red-400 bg-red-500/5"
                                                : "border-white/[0.08] text-zinc-400"
                                        )}
                                    />
                                    {editTask.dueDate && (
                                        <>
                                            <button
                                                onClick={() => setEditTask({ ...editTask, dueDate: undefined })}
                                                className="text-[10px] font-bold uppercase tracking-widest text-zinc-700 hover:text-red-400 transition-colors"
                                            >
                                                Clear
                                            </button>
                                            {!isOverdue && (
                                                <span className="text-[10px] font-bold text-zinc-600">
                                                    {Math.ceil((editTask.dueDate - now) / 86400000)} days left
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Card Color */}
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-1 bg-orange-500 rounded-full" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Card Color</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {cardColors.map((color) => (
                                        <button
                                            key={color.name}
                                            onClick={() => setEditTask({ ...editTask, color: color.value })}
                                            title={color.name}
                                            className={cn(
                                                "w-8 h-8 rounded-xl border-2 transition-all hover:scale-110 relative",
                                                editTask.color === color.value
                                                    ? "border-orange-500 scale-110 shadow-lg shadow-orange-900/30"
                                                    : "border-white/[0.08] hover:border-white/20"
                                            )}
                                            style={{ backgroundColor: color.value || '#1a1a1a' }}
                                        >
                                            {editTask.color === color.value && (
                                                <motion.div layoutId="colorDot" className="absolute inset-0 flex items-center justify-center">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
                                                </motion.div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center gap-2">
                                    <Tag size={13} className="text-purple-400/70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tags</span>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {editTask.tags?.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-2.5 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-[10px] font-bold border border-purple-500/20 flex items-center gap-1.5"
                                        >
                                            {tag}
                                            <button
                                                onClick={() => setEditTask({ ...editTask, tags: editTask.tags?.filter(t => t !== tag) })}
                                                className="hover:text-red-400 transition-colors"
                                            >
                                                <X size={9} />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        placeholder="+ Tag"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = (e.target as HTMLInputElement).value.trim();
                                                if (val && !editTask.tags?.includes(val)) {
                                                    setEditTask({ ...editTask, tags: [...(editTask.tags || []), val] });
                                                    (e.target as HTMLInputElement).value = "";
                                                }
                                            }
                                        }}
                                        className="bg-transparent border-b border-dashed border-white/[0.08] px-2 py-1 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-purple-500/40 transition-colors text-zinc-600 placeholder:text-zinc-800 w-20"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center gap-2">
                                    <AlignLeft size={13} className="text-orange-500/70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</span>
                                </div>
                                <textarea
                                    value={editTask.description || ""}
                                    onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                                    placeholder="Add context, notes, or details about this task..."
                                    className="w-full h-28 bg-white/[0.03] rounded-xl p-4 text-sm font-medium text-zinc-400 outline-none focus:ring-1 ring-orange-500/20 border border-white/[0.06] focus:border-orange-500/20 transition-all resize-none placeholder:text-zinc-800"
                                />
                            </div>

                            {/* Urgency + Impact */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Urgency */}
                                <div className="flex flex-col gap-2.5">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle size={13} className="text-orange-500/70" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Urgency</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {urgencyOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setEditTask({ ...editTask, urgency: opt.value })}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border",
                                                    editTask.urgency === opt.value
                                                        ? opt.activeClass
                                                        : "bg-white/[0.03] text-zinc-700 border-white/[0.05] hover:text-zinc-400 hover:bg-white/[0.05]"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Impact */}
                                <div className="flex flex-col gap-2.5">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={13} className="text-purple-400/70" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Impact</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            step="1"
                                            value={editTask.impact}
                                            onChange={(e) => setEditTask({ ...editTask, impact: parseInt(e.target.value) })}
                                            className="flex-1 accent-purple-500 cursor-pointer"
                                        />
                                        <span className="text-lg font-black text-purple-400 w-5 text-center">{editTask.impact}</span>
                                    </div>
                                    <div className="flex justify-between text-[8px] text-zinc-800 font-medium px-0.5">
                                        <span>Low</span><span>High</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex-shrink-0 px-6 py-4 bg-[#0d0d0d] border-t border-white/[0.05] flex items-center justify-between">
                            <button
                                onClick={() => { onDelete(editTask.id); onClose(); }}
                                className="flex items-center gap-2 text-zinc-700 hover:text-red-400 text-[10px] font-bold uppercase tracking-wider transition-colors"
                            >
                                <Trash2 size={13} />
                                Delete
                            </button>

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Save
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
