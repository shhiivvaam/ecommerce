"use client";

import { useState, useRef, useCallback } from "react";
import {
    Plus, Trash2, Upload, Download, ArrowLeft, FileSpreadsheet,
    CheckCircle, AlertTriangle, Loader2, X, ChevronRight,
    FilePlus2, CloudUpload, Info,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
    useBulkCreateProducts,
    useImportProducts,
    useImportJobStatus,
    downloadProductTemplate,
    type BulkImportResult,
} from "@/lib/hooks/useProducts";
import { useAuthStore } from "@/store/useAuthStore";
import { useAdminCategories } from "@/lib/hooks/useAdminCategories";

// ── Design tokens ──────────────────────────────────────────────────────────────
const INK = "#0a0a0a";
const PAPER = "#f5f3ef";
const MID = "#8a8a8a";
const BORDER = "rgba(10,10,10,0.1)";
const GREEN = "#16a34a";
const RED = "#c0392b";
const BLUE = "#2563eb";
const ACCENT = "#1a1a2e";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ProductRow {
    id: string;
    title: string;
    description: string;
    price: string;
    discounted: string;
    stock: string;
    categoryId: string;
    tags: string;
}

interface ParsedPreviewRow {
    title: string;
    description: string;
    price: string;
    discounted: string;
    stock: string;
    categoryId: string;
    tags: string;
    _error?: string;
}

const emptyRow = (): ProductRow => ({
    id: Math.random().toString(36).slice(2),
    title: "",
    description: "",
    price: "",
    discounted: "",
    stock: "",
    categoryId: "",
    tags: "",
});

// ── Result Panel ───────────────────────────────────────────────────────────────
function ResultPanel({ result, onDismiss }: { result: BulkImportResult; onDismiss: () => void }) {
    const success = result.importedCount > 0;
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
                background: success ? "#f0fdf4" : "#fff0f0",
                border: `1.5px solid ${success ? "#16a34a40" : "#c0392b40"}`,
                borderRadius: 12,
                padding: "20px 24px",
                marginBottom: 24,
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {success
                        ? <CheckCircle size={20} color={GREEN} />
                        : <AlertTriangle size={20} color={RED} />}
                    <div>
                        <p style={{ fontWeight: 600, fontSize: 14, color: success ? GREEN : RED }}>
                            Import Complete — {result.importedCount} created, {result.failedCount} failed
                        </p>
                        <p style={{ fontSize: 12, color: MID, marginTop: 2 }}>{result.total} rows processed</p>
                    </div>
                </div>
                <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: MID, padding: 4 }}>
                    <X size={16} />
                </button>
            </div>
            {result.errors.length > 0 && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${BORDER}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                    {result.errors.map((e, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12 }}>
                            <span style={{ fontFamily: "monospace", color: RED, fontWeight: 600, minWidth: 52 }}>Row {e.row}</span>
                            {e.title && <span style={{ color: INK, fontWeight: 500 }}>{e.title} —</span>}
                            <span style={{ color: RED }}>{e.reason}</span>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// ── Job Status Banner ─────────────────────────────────────────────────────────
function JobStatusBanner({ jobId }: { jobId: string }) {
    const { data } = useImportJobStatus(jobId);
    if (!data) return null;
    const isCompleted = data.state === "completed";
    const isFailed = data.state === "failed";
    const isPending = !isCompleted && !isFailed;

    return (
        <AnimatePresence>
            <motion.div
                key={jobId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    padding: "14px 20px",
                    borderRadius: 10,
                    background: isFailed ? "#fff0f0" : isCompleted ? "#f0fdf4" : "#eff6ff",
                    border: `1.5px solid ${isFailed ? "#c0392b30" : isCompleted ? "#16a34a30" : "#2563eb30"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                {isPending && <Loader2 size={16} color={BLUE} className="animate-spin" />}
                {isCompleted && <CheckCircle size={16} color={GREEN} />}
                {isFailed && <AlertTriangle size={16} color={RED} />}
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: isFailed ? RED : isCompleted ? GREEN : BLUE }}>
                        {isPending ? `Processing… (Job ${jobId.slice(0, 8)})` : isCompleted ? "Import completed successfully!" : `Import failed — ${data.error ?? "unknown error"}`}
                    </p>
                    {isCompleted && data.result && (
                        <p style={{ fontSize: 12, color: MID, marginTop: 2 }}>
                            {data.result.importedCount} created, {data.result.failedCount} failed
                            {data.result.errors.length > 0 && ` (${data.result.errors.length} rows had errors)`}
                        </p>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// ── Bulk Upload Page ───────────────────────────────────────────────────────────
export default function BulkUploadPage() {
    const [tab, setTab] = useState<"form" | "file">("form");

    // Form tab state
    const [rows, setRows] = useState<ProductRow[]>([emptyRow()]);
    const [formResult, setFormResult] = useState<BulkImportResult | null>(null);
    const { mutateAsync: bulkCreate, isPending: isCreating } = useBulkCreateProducts();

    // File tab state
    const [dragging, setDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewRows, setPreviewRows] = useState<ParsedPreviewRow[]>([]);
    const [jobId, setJobId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { mutateAsync: importFile, isPending: isImporting } = useImportProducts();

    // Shared
    const { data: categoriesData } = useAdminCategories();
    const categories = categoriesData ?? [];
    const token = useAuthStore((s) => s.token) ?? "";

    // ── Form tab helpers ────────────────────────────────────────────────────
    const addRow = () => setRows((r) => [...r, emptyRow()]);
    const removeRow = (id: string) => setRows((r) => r.filter((row) => row.id !== id));
    const updateRow = (id: string, field: keyof ProductRow, value: string) =>
        setRows((r) => r.map((row) => (row.id === id ? { ...row, [field]: value } : row)));

    const handleFormSubmit = async () => {
        const validRows = rows.filter((r) => r.title.trim() && r.description.trim() && r.price.trim());
        if (validRows.length === 0) {
            toast.error("Add at least one complete product (title, description, price required)");
            return;
        }
        try {
            const payload = validRows.map((r) => ({
                title: r.title.trim(),
                description: r.description.trim(),
                price: parseFloat(r.price) || 0,
                discounted: r.discounted ? parseFloat(r.discounted) : undefined,
                stock: parseInt(r.stock) || 0,
                categoryId: r.categoryId || undefined,
                tags: r.tags ? r.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
            }));
            const result = await bulkCreate({ products: payload });
            setFormResult(result);
            if (result.importedCount === payload.length) {
                setRows([emptyRow()]);
                toast.success(`All ${result.importedCount} products created!`);
            } else if (result.importedCount > 0) {
                toast(`${result.importedCount} created, ${result.failedCount} failed`, { icon: "⚠️" });
            } else {
                toast.error("All products failed to create. Check the errors below.");
            }
        } catch {
            toast.error("Bulk create failed. Please try again.");
        }
    };

    // ── File tab helpers ────────────────────────────────────────────────────
    const parseFilePreview = useCallback(async (file: File) => {
        setSelectedFile(file);
        setJobId(null);
        const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
        const isCsv = file.name.endsWith(".csv");

        if (isExcel) {
            try {
                // Use standard structured internal xlsx parsing
                const XLSX = await import("xlsx");
                const buf = await file.arrayBuffer();
                const wb = XLSX.read(buf, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                if (!ws) { toast.error("No worksheet found in file"); return; }
                
                // Convert to JSON with array format for robust header mapping
                const rawData = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
                if (rawData.length < 2) { toast.error("Excel file appears empty."); return; }
                
                const headers = rawData[0].map(h => String(h ?? "").trim().toLowerCase());
                
                const parsed: ParsedPreviewRow[] = [];
                // Only preview up to 10 real data rows
                for (let r = 1; r < Math.min(rawData.length, 11); r++) {
                    const row = rawData[r];
                    // Skip if completely empty row
                    if (!row || row.every(c => c === null || c === undefined || String(c).trim() === "")) continue;
                    
                    const get = (col: string) => {
                        const i = headers.indexOf(col);
                        return i >= 0 ? String(row[i] ?? "").trim() : "";
                    };
                    parsed.push({
                        title: get("title") || get("name"),
                        description: get("description"),
                        price: get("price"),
                        discounted: get("discounted"),
                        stock: get("stock"),
                        categoryId: get("categoryid") || get("categoryId"),
                        tags: get("tags"),
                        _error: !(get("title") || get("name")) ? "Missing title" : undefined,
                    });
                }
                setPreviewRows(parsed);
            } catch (err) {
                console.error(err);
                toast.error("Could not parse Excel file. Please use the template.");
            }
        } else if (isCsv) {
            const text = await file.text();
            const lines = text.split("\n").filter(Boolean);
            if (lines.length < 2) { toast.error("CSV appears empty."); return; }
            const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
            const parsed: ParsedPreviewRow[] = lines.slice(1, 11).map((line) => {
                const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
                const get = (col: string) => {
                    const i = headers.indexOf(col);
                    return i >= 0 ? (vals[i] ?? "") : "";
                };
                const title = get("title") || get("name");
                return {
                    title,
                    description: get("description"),
                    price: get("price"),
                    discounted: get("discounted"),
                    stock: get("stock"),
                    categoryId: get("categoryid"),
                    tags: get("tags"),
                    _error: !title ? "Missing title" : undefined,
                };
            });
            setPreviewRows(parsed);
        } else {
            toast.error("Please upload a .csv or .xlsx file");
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) parseFilePreview(file);
        },
        [parseFilePreview],
    );

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) parseFilePreview(file);
        e.target.value = "";
    };

    const handleFileUpload = async () => {
        if (!selectedFile) { toast.error("Select a file first"); return; }
        try {
            const resp = await importFile(selectedFile);
            setJobId(resp.jobId);
            toast.success("File queued for import! Tracking progress below…");
        } catch {
            toast.error("Upload failed. Please try again.");
        }
    };

    const handleTemplateDownload = async () => {
        const tid = toast.loading("Preparing template…");
        try {
            await downloadProductTemplate(token);
            toast.success("Template downloaded!", { id: tid });
        } catch {
            toast.error("Failed to download template", { id: tid });
        }
    };

    // ── Inline field labels ────────────────────────────────────────────────
    const COLS = [
        { key: "title", label: "Title *", width: 200, placeholder: "Product name" },
        { key: "description", label: "Description *", width: 260, placeholder: "Describe the product…" },
        { key: "price", label: "Price *", width: 100, placeholder: "99.99", type: "number" },
        { key: "discounted", label: "Sale Price", width: 110, placeholder: "79.99", type: "number" },
        { key: "stock", label: "Stock", width: 90, placeholder: "0", type: "number" },
        { key: "tags", label: "Tags", width: 150, placeholder: "new,sale" },
    ] as const;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
                .bu-wrap { font-family:'DM Sans',sans-serif; color:${INK}; padding-bottom:80px; }
                .bu-title { font-family:'Barlow Condensed',sans-serif; font-size:clamp(36px,5vw,60px); font-weight:900; text-transform:uppercase; line-height:1; letter-spacing:-.02em; }
                .bu-tabs { display:flex; gap:0; border:1.5px solid ${BORDER}; border-radius:10px; overflow:hidden; width:fit-content; margin-bottom:32px; }
                .bu-tab { padding:10px 24px; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; border:none; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:7px; }
                .bu-tab-active { background:${ACCENT}; color:#fff; }
                .bu-tab-inactive { background:#fff; color:${MID}; }
                .bu-tab-inactive:hover { background:${PAPER}; color:${INK}; }
                .bu-card { background:#fff; border:1.5px solid ${BORDER}; border-radius:12px; padding:24px; }
                .bu-btn { height:38px; padding:0 18px; border-radius:7px; border:1.5px solid ${BORDER}; background:transparent; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; transition:all .2s; display:inline-flex; align-items:center; gap:7px; }
                .bu-btn-ink { background:${ACCENT}; border-color:${ACCENT}; color:#fff; }
                .bu-btn-ink:hover:not(:disabled) { background:#2e2e4a; }
                .bu-btn-green { background:${GREEN}; border-color:${GREEN}; color:#fff; }
                .bu-btn-green:hover:not(:disabled) { background:#15803d; }
                .bu-btn-red { background:${RED}; border-color:${RED}; color:#fff; }
                .bu-btn:disabled { opacity:.5; cursor:not-allowed; }
                .bu-btn:hover:not(:disabled):not(.bu-btn-ink):not(.bu-btn-green):not(.bu-btn-red) { border-color:${INK}; color:${INK}; }
                .bu-input { height:32px; padding:0 10px; border:1.5px solid ${BORDER}; border-radius:6px; font-family:'DM Sans',sans-serif; font-size:12px; color:${INK}; background:${PAPER}; outline:none; width:100%; transition:border-color .15s; }
                .bu-input:focus { border-color:${ACCENT}; background:#fff; }
                .bu-input-err { border-color:#fca5a5 !important; background:#fff5f5; }
                .bu-textarea { padding:8px 10px; height:60px; resize:none; }
                .bu-th { font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:${MID}; padding:10px 10px; text-align:left; border-bottom:1.5px solid ${BORDER}; background:${PAPER}; white-space:nowrap; }
                .bu-td { padding:6px 10px; border-bottom:1px solid ${BORDER}; vertical-align:top; }
                .bu-drop { border:2px dashed ${BORDER}; border-radius:14px; transition:all .2s; background:${PAPER}; text-align:center; }
                .bu-drop-active { border-color:${BLUE}; background:#eff6ff; }
                .bu-drop:hover { border-color:${INK}; }
                .bu-info { display:flex; gap:8px; align-items:flex-start; padding:12px 16px; background:#eff6ff; border-radius:8px; border:1px solid #bfdbfe; font-size:12px; color:#1d4ed8; }
                .bu-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:4px; font-size:10px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; }
                .bu-badge-ok { background:#f0fdf4; color:${GREEN}; }
                .bu-badge-err { background:#fff0f0; color:${RED}; }
                .bu-select { height:32px; padding:0 10px; border:1.5px solid ${BORDER}; border-radius:6px; font-family:'DM Sans',sans-serif; font-size:12px; color:${INK}; background:${PAPER}; outline:none; width:100%; cursor:pointer; }
                .bu-select:focus { border-color:${ACCENT}; }
            `}</style>

            <div className="bu-wrap">
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
                    <Link href="/admin/products" style={{ display: "flex", alignItems: "center", marginTop: 6 }}>
                        <button className="bu-btn" style={{ color: MID }}>
                            <ArrowLeft size={13} /> Back
                        </button>
                    </Link>
                    <div>
                        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: MID }}>Product Catalog</span>
                        <h1 className="bu-title">Bulk Upload</h1>
                        <p style={{ fontSize: 13, color: MID, fontWeight: 300, marginTop: 6 }}>Add multiple products at once via the form or by uploading an Excel / CSV file.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bu-tabs">
                    <button
                        className={`bu-tab ${tab === "form" ? "bu-tab-active" : "bu-tab-inactive"}`}
                        onClick={() => setTab("form")}
                        id="tab-form"
                    >
                        <FilePlus2 size={13} /> Form Upload
                    </button>
                    <button
                        className={`bu-tab ${tab === "file" ? "bu-tab-active" : "bu-tab-inactive"}`}
                        onClick={() => setTab("file")}
                        id="tab-file"
                    >
                        <CloudUpload size={13} /> Excel / CSV Upload
                    </button>
                </div>

                {/* ── Tab 1: Form Upload ───────────────────────────────────── */}
                <AnimatePresence mode="wait">
                    {tab === "form" && (
                        <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="bu-info" style={{ marginBottom: 20 }}>
                                <Info size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                                <span>Fill in each row below. <strong>Title, Description, and Price</strong> are required per product. Add as many rows as you need, then click &ldquo;Upload All&rdquo;.</span>
                            </div>

                            {formResult && (
                                <ResultPanel result={formResult} onDismiss={() => setFormResult(null)} />
                            )}

                            {/* Scrollable table */}
                            <div className="bu-card" style={{ padding: 0, overflow: "hidden" }}>
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                                        <thead>
                                            <tr>
                                                <th className="bu-th" style={{ width: 36, textAlign: "center" }}>#</th>
                                                {COLS.map((c) => (
                                                    <th key={c.key} className="bu-th" style={{ width: c.width }}>{c.label}</th>
                                                ))}
                                                <th className="bu-th" style={{ width: 120 }}>Category</th>
                                                <th className="bu-th" style={{ width: 50 }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <AnimatePresence>
                                                {rows.map((row, idx) => (
                                                    <motion.tr
                                                        key={row.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        transition={{ duration: 0.15 }}
                                                        style={{ background: idx % 2 === 0 ? "#fff" : PAPER }}
                                                    >
                                                        <td className="bu-td" style={{ textAlign: "center", fontSize: 11, color: MID, fontWeight: 600, verticalAlign: "middle" }}>{idx + 1}</td>
                                                        {COLS.map((col) => (
                                                            <td key={col.key} className="bu-td">
                                                                {col.key === "description" ? (
                                                                    <textarea
                                                                        className="bu-input bu-textarea"
                                                                        value={row[col.key]}
                                                                        onChange={(e) => updateRow(row.id, col.key as keyof ProductRow, e.target.value)}
                                                                        placeholder={col.placeholder}
                                                                        style={{ width: col.width - 20 }}
                                                                    />
                                                                ) : (
                                                                    <input
                                                                        className="bu-input"
                                                                        type={(col as { type?: string }).type ?? "text"}
                                                                        value={row[col.key]}
                                                                        onChange={(e) => updateRow(row.id, col.key as keyof ProductRow, e.target.value)}
                                                                        placeholder={col.placeholder}
                                                                        step={(col as { type?: string }).type === "number" ? "0.01" : undefined}
                                                                        min={(col as { type?: string }).type === "number" ? "0" : undefined}
                                                                        style={{ width: col.width - 20 }}
                                                                    />
                                                                )}
                                                            </td>
                                                        ))}
                                                        {/* Category dropdown */}
                                                        <td className="bu-td">
                                                            <select
                                                                className="bu-select"
                                                                value={row.categoryId}
                                                                onChange={(e) => updateRow(row.id, "categoryId", e.target.value)}
                                                            >
                                                                <option value="">No Category</option>
                                                                {categories.map((c: { id: string; name: string }) => (
                                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="bu-td" style={{ verticalAlign: "middle" }}>
                                                            <button
                                                                className="bu-btn"
                                                                style={{ color: RED, borderColor: "rgba(192,57,43,0.2)", height: 30, padding: "0 8px" }}
                                                                onClick={() => rows.length > 1 ? removeRow(row.id) : null}
                                                                disabled={rows.length <= 1}
                                                                title="Remove row"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer actions */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: `1px solid ${BORDER}`, background: PAPER }}>
                                    <button className="bu-btn" onClick={addRow} id="add-row-btn">
                                        <Plus size={13} /> Add Row
                                    </button>
                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                        <span style={{ fontSize: 11, color: MID }}>
                                            {rows.filter((r) => r.title.trim() && r.description.trim() && r.price.trim()).length} of {rows.length} row{rows.length !== 1 ? "s" : ""} ready
                                        </span>
                                        <button
                                            className={`bu-btn bu-btn-green`}
                                            onClick={handleFormSubmit}
                                            disabled={isCreating}
                                            id="upload-all-btn"
                                        >
                                            {isCreating ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                                            {isCreating ? "Uploading…" : "Upload All"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* quick tips */}
                            <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {[
                                    "Title, Description & Price are required per row",
                                    "Leave Category empty → auto-assigned to 'Uncategorized'",
                                    "Tags: comma-separated (e.g. new, sale, featured)",
                                    "Failed rows are reported with exact error reason",
                                ].map((tip, i) => (
                                    <span key={i} style={{ fontSize: 11, color: MID, display: "flex", alignItems: "center", gap: 4 }}>
                                        <ChevronRight size={10} /> {tip}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Tab 2: File Upload ───────────────────────────────── */}
                    {tab === "file" && (
                        <motion.div key="file" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
                                {/* Left: drop zone + preview */}
                                <div>
                                    {jobId && <JobStatusBanner jobId={jobId} />}

                                    {/* Drop zone */}
                                    <div
                                        className={`bu-drop ${dragging ? "bu-drop-active" : ""}`}
                                        style={{ padding: "48px 24px", marginBottom: 24, cursor: "pointer" }}
                                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                        onDragLeave={() => setDragging(false)}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        id="file-drop-zone"
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".csv,.xlsx"
                                            style={{ display: "none" }}
                                            onChange={handleFileSelect}
                                        />
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                                            <div style={{ width: 60, height: 60, borderRadius: "50%", background: dragging ? "#eff6ff" : PAPER, display: "flex", alignItems: "center", justifyContent: "center", border: `2px dashed ${dragging ? BLUE : BORDER}`, transition: "all .2s" }}>
                                                <FileSpreadsheet size={26} color={dragging ? BLUE : MID} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 15, fontWeight: 500, color: dragging ? BLUE : INK }}>
                                                    {selectedFile ? selectedFile.name : "Drop your file here or click to browse"}
                                                </p>
                                                <p style={{ fontSize: 12, color: MID, marginTop: 4 }}>Supports .xlsx and .csv</p>
                                            </div>
                                            {selectedFile && (
                                                <motion.button
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="bu-btn"
                                                    style={{ color: MID }}
                                                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreviewRows([]); setJobId(null); }}
                                                >
                                                    <X size={12} /> Clear file
                                                </motion.button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Preview table */}
                                    <AnimatePresence>
                                        {previewRows.length > 0 && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                                    <h3 style={{ fontSize: 13, fontWeight: 600, color: INK }}>
                                                        Preview — first {previewRows.length} row{previewRows.length !== 1 ? "s" : ""}
                                                    </h3>
                                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                        <span className="bu-badge bu-badge-ok"><CheckCircle size={9} /> {previewRows.filter((r) => !r._error).length} ok</span>
                                                        {previewRows.some((r) => r._error) && (
                                                            <span className="bu-badge bu-badge-err"><AlertTriangle size={9} /> {previewRows.filter((r) => r._error).length} errors</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="bu-card" style={{ padding: 0, overflowX: "auto" }}>
                                                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                                                        <thead>
                                                            <tr>
                                                                {["#", "Title", "Description", "Price", "Sale", "Stock", "Category", "Tags", "Status"].map((h) => (
                                                                    <th key={h} className="bu-th">{h}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {previewRows.map((row, i) => (
                                                                <tr key={i} style={{ background: row._error ? "#fff5f5" : i % 2 === 0 ? "#fff" : PAPER }}>
                                                                    <td className="bu-td" style={{ fontSize: 11, color: MID, fontWeight: 600, textAlign: "center" }}>{i + 1}</td>
                                                                    <td className="bu-td" style={{ fontSize: 12, maxWidth: 160 }}>
                                                                        {row.title || <span style={{ color: RED, fontStyle: "italic" }}>missing</span>}
                                                                    </td>
                                                                    <td className="bu-td" style={{ fontSize: 11, color: MID, maxWidth: 200 }}>
                                                                        {row.description ? row.description.slice(0, 60) + (row.description.length > 60 ? "…" : "") : "—"}
                                                                    </td>
                                                                    <td className="bu-td" style={{ fontSize: 12, fontFamily: "monospace" }}>{row.price || "—"}</td>
                                                                    <td className="bu-td" style={{ fontSize: 12, fontFamily: "monospace" }}>{row.discounted || "—"}</td>
                                                                    <td className="bu-td" style={{ fontSize: 12 }}>{row.stock || "0"}</td>
                                                                    <td className="bu-td" style={{ fontSize: 11, color: MID }}>{row.categoryId || "—"}</td>
                                                                    <td className="bu-td" style={{ fontSize: 11, color: MID }}>{row.tags || "—"}</td>
                                                                    <td className="bu-td">
                                                                        {row._error
                                                                            ? <span className="bu-badge bu-badge-err"><AlertTriangle size={8} /> {row._error}</span>
                                                                            : <span className="bu-badge bu-badge-ok"><CheckCircle size={8} /> Ready</span>}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <p style={{ fontSize: 11, color: MID, marginTop: 8 }}>Showing up to 10 preview rows. All rows will be imported.</p>

                                                {/* Upload button */}
                                                <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                                                    <button
                                                        className="bu-btn bu-btn-green"
                                                        onClick={handleFileUpload}
                                                        disabled={isImporting}
                                                        id="upload-file-btn"
                                                    >
                                                        {isImporting ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                                                        {isImporting ? "Uploading…" : `Upload ${selectedFile?.name}`}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Right: Instructions & Template */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    {/* Template card */}
                                    <div className="bu-card" style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #16213e 100%)`, color: "#fff", border: "none" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                            <FileSpreadsheet size={20} color="#93c5fd" />
                                            <h3 style={{ fontSize: 14, fontWeight: 600 }}>Download Template</h3>
                                        </div>
                                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, marginBottom: 16 }}>
                                            Get a pre-formatted Excel file with example data, column instructions, and correct headers.
                                        </p>
                                        <button
                                            className="bu-btn"
                                            style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.2)", width: "100%", justifyContent: "center" }}
                                            onClick={handleTemplateDownload}
                                            id="download-template-btn"
                                        >
                                            <Download size={13} /> Download Template (.xlsx)
                                        </button>
                                    </div>

                                    {/* Column guide */}
                                    <div className="bu-card">
                                        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Column Reference</h3>
                                        {[
                                            { col: "title", req: true, tip: "Product name (3–100 chars)" },
                                            { col: "description", req: true, tip: "Product description (min 10 chars)" },
                                            { col: "price", req: true, tip: "Base price, e.g. 99.99" },
                                            { col: "discounted", req: false, tip: "Sale price (optional)" },
                                            { col: "stock", req: false, tip: "Quantity in stock (default 0)" },
                                            { col: "category", req: false, tip: "Category name, e.g. Electronics (falls back to Uncategorized)" },
                                            { col: "tags", req: false, tip: "Comma-separated, e.g. new,sale" },
                                        ].map(({ col, req, tip }) => (
                                            <div key={col} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
                                                <div>
                                                    <code style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 600, color: ACCENT }}>{col}</code>
                                                    {req && <span style={{ fontSize: 9, fontWeight: 700, color: RED, marginLeft: 4, textTransform: "uppercase" }}>req</span>}
                                                    <p style={{ fontSize: 11, color: MID, marginTop: 2 }}>{tip}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Info */}
                                    <div className="bu-info">
                                        <Info size={13} style={{ marginTop: 1, flexShrink: 0 }} />
                                        <span>Large files are processed in the background via a queue. Use the job status indicator to track progress.</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
