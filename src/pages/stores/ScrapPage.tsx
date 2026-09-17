import React, { useState, useEffect, useCallback } from "react"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    SearchIcon,
    Loader2,
    RotateCcw,
    Archive,
    CheckSquare,
    Square,
    X,
    QrCode,
    Printer,
    FileText,
    Building2
} from "lucide-react"
import toolService, { type ToolRecord } from "@/services/tool.service"
import { VendorSelectionModal } from "./VendorSelectionModal"
import { toast } from "sonner"

export function ScrapPage() {
    const [scrappedTools, setScrappedTools] = useState<ToolRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [showDcModal, setShowDcModal] = useState(false)

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Pagination & Search
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [total, setTotal] = useState(0)
    const [, setTotalPages] = useState(1)
    const [search, setSearch] = useState("")

    // Dialog state
    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        type: 'restore' | 'bulk-restore';
        targetId?: string;
        targetToolId?: string;
    }>({
        isOpen: false,
        type: 'restore'
    })

    const fetchScrappedTools = useCallback(async () => {
        setLoading(true)
        try {
            const res = await toolService.getScrappedTools({
                page: page.toString(),
                limit: limit.toString(),
                search
            })
            if (res?.success) {
                setScrappedTools(res.data || [])
                setTotal(res.total || 0)
                setTotalPages(res.totalPages || 1)
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error?.response?.data?.message || "Failed to fetch scrapped tools")
        } finally {
            setLoading(false)
        }
    }, [page, limit, search])

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchScrappedTools()
        }, 300)
        return () => clearTimeout(timeout)
    }, [fetchScrappedTools])

    const handleToggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const next = new Set(selectedIds)
        if (next.has(id)) {
            next.delete(id)
        } else {
            next.add(id)
        }
        setSelectedIds(next)
    }

    const isAllSelected = scrappedTools.length > 0 && selectedIds.size === scrappedTools.length

    const handleToggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set())
        } else {
            const next = new Set(scrappedTools.map(t => t._id))
            setSelectedIds(next)
        }
    }

    const handleClearSelection = () => {
        setSelectedIds(new Set())
    }

    // Confirm dialog triggers
    const triggerSingleRestore = (tool: ToolRecord) => {
        setDialogState({
            isOpen: true,
            type: 'restore',
            targetId: tool._id,
            targetToolId: tool.toolId || tool._id
        })
    }

    const triggerBulkRestore = () => {
        if (selectedIds.size === 0) return
        setDialogState({
            isOpen: true,
            type: 'bulk-restore'
        })
    }

    // Execute Action after dialog confirmation
    const handleConfirmAction = async () => {
        setActionLoading(true)
        try {
            if (dialogState.type === 'restore' && dialogState.targetId) {
                const res = await toolService.restoreTool(dialogState.targetId)
                if (res.success) {
                    toast.success(res.message || "Tool restored successfully")
                    fetchScrappedTools()
                }
            } else if (dialogState.type === 'bulk-restore') {
                const res = await toolService.bulkRestoreTools(Array.from(selectedIds))
                if (res.success) {
                    toast.success(res.message || "Selected tools restored successfully")
                    handleClearSelection()
                    fetchScrappedTools()
                }
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error?.response?.data?.message || "Action failed")
        } finally {
            setActionLoading(false)
            setDialogState(prev => ({ ...prev, isOpen: false }))
        }
    }

    return (
        <div className="h-full flex flex-col overflow-hidden gap-4 mx-auto w-full animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 shrink-0">
                <div>
                    <div className="flex items-center gap-2.5">
                        <Archive className="size-7 text-amber-500" />
                        <h1 className="text-3xl font-extrabold tracking-tight">Scrapped Printed Tools</h1>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        View printed tools that were scrapped upon deletion. Scrapped printed tools retain their original Tool ID and QR codes without re-sequencing active inventory. ({total} scrapped items)
                    </p>
                </div>
            </div>

            <Card className="flex-1 min-h-0 flex flex-col border-border/50 shadow-lg shadow-black/5 overflow-hidden rounded-2xl bg-gradient-to-b from-background to-background/50 backdrop-blur-xl">
                {/* Search Bar */}
                <div className="p-4 border-b bg-muted/20 backdrop-blur-md shrink-0">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative group flex-1 w-full">
                            <SearchIcon className="absolute left-3 top-2.5 size-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search scrapped tools by ID, code, or description..."
                                className="pl-10 h-10 bg-background/50 border-border/60 hover:bg-background focus:bg-background transition-all shadow-sm rounded-xl"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>
                </div>

                <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <div className="h-full overflow-auto">
                            <table className="h-full min-w-full text-sm text-left whitespace-nowrap">
                                <thead className="sticky top-0 z-10 bg-card shadow-xs">
                                    <tr className="border-b bg-muted text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                        <th className="w-12 px-4 py-4 select-none text-center">
                                            <button
                                                type="button"
                                                onClick={handleToggleSelectAll}
                                                disabled={scrappedTools.length === 0}
                                                className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                                                title="Select all"
                                            >
                                                {isAllSelected ? (
                                                    <CheckSquare className="size-4 text-primary" />
                                                ) : (
                                                    <Square className="size-4" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-6 py-4">Tool ID</th>
                                        <th className="px-6 py-4">Description</th>
                                        <th className="px-6 py-4">Print Status</th>
                                        <th className="px-6 py-4">Original Store / Site</th>
                                        <th className="px-6 py-4">Project</th>
                                        <th className="px-6 py-4">Scrapped Date</th>
                                        <th className="px-6 py-4">Scrapped By</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <Loader2 className="size-8 animate-spin text-primary/50 mb-4" />
                                                    <p className="text-sm font-medium animate-pulse">Loading scrapped tools...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : scrappedTools.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-24 text-center">
                                                <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                                    <div className="size-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 text-amber-600">
                                                        <Archive className="size-8" />
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-foreground mb-1">Scrap is Empty</h3>
                                                    <p className="text-sm text-muted-foreground text-balance">
                                                        No scrapped tools found. Printed tools that get deleted will be safely preserved in Scrap.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        scrappedTools.map((t) => {
                                            const storeObj = t.currentSite || t.project
                                            const storeName = typeof storeObj === 'object' ? (storeObj.name || storeObj.location) : (t as any).storeName || '-'
                                            const projectObj = t.project
                                            const projectName = typeof projectObj === 'object' ? projectObj.name : '-'
                                            const scrappedByName = t.scrappedBy?.name || t.scrappedBy?.email || 'User'
                                            const scrappedDateStr = t.scrappedAt ? new Date(t.scrappedAt).toLocaleString() : '-'

                                            return (
                                                <tr
                                                    key={t._id}
                                                    className={`group hover:bg-muted/30 transition-colors duration-200 ${
                                                        selectedIds.has(t._id) ? "bg-primary/[0.05]" : ""
                                                    }`}
                                                >
                                                    <td className="px-4 py-4 text-center" onClick={(e) => handleToggleSelect(t._id, e)}>
                                                        <button
                                                            type="button"
                                                            className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                                                        >
                                                            {selectedIds.has(t._id) ? (
                                                                <CheckSquare className="size-4 text-primary" />
                                                            ) : (
                                                                <Square className="size-4" />
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono font-bold text-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <span>{t.toolId || t.toolCode || t._id}</span>
                                                            {t.qrLink && (
                                                                <a
                                                                    href={t.qrLink}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="text-primary hover:text-primary/80 transition-colors"
                                                                    title="View QR Link"
                                                                >
                                                                    <QrCode className="size-4" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-foreground">
                                                        {t.description || '-'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 ring-1 ring-emerald-500/30">
                                                            <Printer className="size-3" />
                                                            Printed
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {storeName}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {projectName}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground text-xs">
                                                        {scrappedDateStr}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground text-xs font-medium">
                                                        {scrappedByName}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => triggerSingleRestore(t)}
                                                                className="h-8 px-2.5 text-xs font-medium text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 rounded-lg"
                                                            >
                                                                <RotateCcw className="size-3.5 mr-1" />
                                                                Restore
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </CardContent>

                {/* Footer with Floating Action Bar */}
                {selectedIds.size > 0 && (
                    <div className="p-3 bg-card border-t border-border flex items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pl-2">
                            <span className="inline-flex items-center justify-center bg-primary text-primary-foreground font-bold size-5 text-xs rounded-full">
                                {selectedIds.size}
                            </span>
                            <span>tools selected</span>
                            <Button variant="ghost" size="sm" onClick={handleClearSelection} className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground">
                                <X className="size-3 mr-1" />
                                Clear
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={() => setShowDcModal(true)}
                                className="h-9 px-3.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1.5 shadow-xs cursor-pointer"
                            >
                                <Building2 className="size-3.5" />
                                Issue DC to Scrap Dealer ({selectedIds.size})
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={triggerBulkRestore}
                                className="h-9 px-3 text-xs font-semibold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 rounded-xl"
                            >
                                <RotateCcw className="size-3.5 mr-1.5" />
                                Restore Selected ({selectedIds.size})
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Vendor / Scrap Dealer Selection Modal for DC Creation */}
            <VendorSelectionModal
                open={showDcModal}
                onOpenChange={setShowDcModal}
                selectedTools={scrappedTools.filter(t => selectedIds.has(t._id))}
            />

            {/* Confirmation Dialog */}
            <AlertDialog open={dialogState.isOpen} onOpenChange={(open) => !open && setDialogState(prev => ({ ...prev, isOpen: false }))}>
                <AlertDialogContent className="rounded-2xl border-border/60">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <RotateCcw className="size-5 text-emerald-500" />
                            Confirm Action
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground pt-1">
                            {dialogState.type === 'restore' && (
                                <>Are you sure you want to restore scrapped tool <strong className="font-mono text-foreground">{dialogState.targetToolId}</strong> back to active inventory?</>
                            )}
                            {dialogState.type === 'bulk-restore' && (
                                <>Are you sure you want to restore <strong>{selectedIds.size}</strong> selected scrapped tools back to active inventory?</>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 pt-2">
                        <AlertDialogCancel disabled={actionLoading} className="rounded-xl h-10 font-semibold">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmAction}
                            disabled={actionLoading}
                            className="rounded-xl h-10 font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            {actionLoading ? (
                                <Loader2 className="size-4 animate-spin mr-2" />
                            ) : null}
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default ScrapPage
