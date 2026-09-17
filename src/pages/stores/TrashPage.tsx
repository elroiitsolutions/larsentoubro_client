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
    Trash2,
    CheckSquare,
    Square,
    X,
    AlertTriangle
} from "lucide-react"
import toolService, { type ToolRecord } from "@/services/tool.service"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

export function TrashPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === "Admin"

    const [deletedTools, setDeletedTools] = useState<ToolRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Pagination & Search
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [search, setSearch] = useState("")

    // Dialog state
    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        type: 'restore' | 'bulk-restore' | 'permanent' | 'bulk-permanent';
        targetId?: string;
        targetToolId?: string;
    }>({
        isOpen: false,
        type: 'restore'
    })

    const fetchDeletedTools = useCallback(async () => {
        setLoading(true)
        try {
            const res = await toolService.getDeletedTools({
                page: page.toString(),
                limit: limit.toString(),
                search
            })
            if (res?.success) {
                setDeletedTools(res.data || [])
                setTotal(res.total || 0)
                setTotalPages(res.totalPages || 1)
            }
        } catch (error: any) {
            console.error(error)
            if (error?.response?.status === 404) {
                toast.error("Trash endpoint (/api/tools/trash) not found. Please restart or deploy the backend server.")
            } else {
                toast.error(error?.response?.data?.message || "Failed to fetch deleted tools")
            }
        } finally {
            setLoading(false)
        }
    }, [page, limit, search])

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchDeletedTools()
        }, 300)
        return () => clearTimeout(timeout)
    }, [fetchDeletedTools])

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

    const isAllSelected = deletedTools.length > 0 && selectedIds.size === deletedTools.length

    const handleToggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set())
        } else {
            const next = new Set(deletedTools.map(t => t._id))
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

    const triggerSinglePermanent = (tool: ToolRecord) => {
        setDialogState({
            isOpen: true,
            type: 'permanent',
            targetId: tool._id,
            targetToolId: tool.toolId || tool._id
        })
    }

    const triggerBulkPermanent = () => {
        if (selectedIds.size === 0) return
        setDialogState({
            isOpen: true,
            type: 'bulk-permanent'
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
                    fetchDeletedTools()
                }
            } else if (dialogState.type === 'bulk-restore') {
                const res = await toolService.bulkRestoreTools(Array.from(selectedIds))
                if (res.success) {
                    toast.success(res.message || "Selected tools restored successfully")
                    handleClearSelection()
                    fetchDeletedTools()
                }
            } else if (dialogState.type === 'permanent' && dialogState.targetId) {
                const res = await toolService.permanentDeleteTool(dialogState.targetId)
                if (res.success) {
                    toast.success(res.message || "Tool permanently deleted")
                    fetchDeletedTools()
                }
            } else if (dialogState.type === 'bulk-permanent') {
                const res = await toolService.bulkPermanentDeleteTools(Array.from(selectedIds))
                if (res.success) {
                    toast.success(res.message || "Selected tools permanently deleted")
                    handleClearSelection()
                    fetchDeletedTools()
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
                        <Trash2 className="size-7 text-rose-500" />
                        <h1 className="text-3xl font-extrabold tracking-tight">Deleted Tools / Trash</h1>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        View and restore deleted tools. Soft-deleted tools can be safely returned to their original inventory. ({total} deleted items)
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
                                placeholder="Search deleted tools by ID, code, or description..."
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
                                                disabled={deletedTools.length === 0}
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
                                        <th className="px-6 py-4">Tool Type</th>
                                        <th className="px-6 py-4">Original Store / Site</th>
                                        <th className="px-6 py-4">Project</th>
                                        <th className="px-6 py-4">Deleted Date</th>
                                        <th className="px-6 py-4">Deleted By</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <Loader2 className="size-8 animate-spin text-primary/50 mb-4" />
                                                    <p className="text-sm font-medium animate-pulse">Loading deleted tools...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : deletedTools.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-24 text-center">
                                                <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                                    <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-600">
                                                        <RotateCcw className="size-8" />
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-foreground mb-1">Trash is Empty</h3>
                                                    <p className="text-sm text-muted-foreground text-balance">
                                                        No soft-deleted tools found. Deleted tools will appear here and can be restored at any time.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        deletedTools.map((t) => {
                                            const storeObj = t.currentSite || t.project
                                            const storeName = typeof storeObj === 'object' ? (storeObj.name || storeObj.location) : (t as any).storeName || '-'
                                            const projectObj = t.project
                                            const projectName = typeof projectObj === 'object' ? projectObj.name : '-'
                                            const deletedByName = t.deletedBy?.name || t.deletedBy?.email || 'User'
                                            const deletedDateStr = t.deletedAt ? new Date(t.deletedAt).toLocaleString() : '-'

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
                                                    <td className="px-6 py-4 font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">
                                                        <span className="bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
                                                            {t.toolId}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-foreground">
                                                        {t.description || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {t.toolType || t.toolVariant || 'General'}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {storeName}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {projectName}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground text-xs">
                                                        {deletedDateStr}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground text-xs font-medium">
                                                        {deletedByName}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 rounded-lg gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900"
                                                                onClick={() => triggerSingleRestore(t)}
                                                            >
                                                                <RotateCcw className="size-3.5" />
                                                                Restore
                                                            </Button>

                                                            {isAdmin && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 rounded-lg gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                                    onClick={() => triggerSinglePermanent(t)}
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                    Permanent Delete
                                                                </Button>
                                                            )}
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

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t bg-muted/10 backdrop-blur-sm gap-4 shrink-0">
                        <div className="text-sm font-medium text-muted-foreground w-full sm:w-1/4 text-center sm:text-left">
                            Showing <span className="text-foreground">{total === 0 ? 0 : ((page - 1) * limit) + 1}</span> to <span className="text-foreground">{Math.min(page * limit, total)}</span> of <span className="text-foreground">{total}</span> deleted items
                        </div>
                        <div className="flex items-center justify-center gap-1.5 flex-wrap flex-1 w-full">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                                className="h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold border border-border/85 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
                            >
                                ‹
                            </button>
                            <span className="text-sm font-semibold px-3">Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || loading}
                                className="h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold border border-border/85 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
                            >
                                ›
                            </button>
                        </div>
                        <div className="hidden sm:block w-full sm:w-1/4" />
                    </div>
                </CardContent>
            </Card>

            {/* Floating Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
                    <div className="flex items-center gap-4 bg-card/95 backdrop-blur-md px-5 py-3 rounded-2xl border border-border shadow-2xl ring-1 ring-primary/20">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center font-bold text-sm">
                                {selectedIds.size}
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-foreground">
                                    Selected Deleted Tools: {selectedIds.size}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Choose an action to restore or permanently remove items
                                </p>
                            </div>
                        </div>

                        <div className="h-6 w-px bg-border/60" />

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                className="h-9 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-1.5"
                                onClick={triggerBulkRestore}
                            >
                                <RotateCcw className="size-3.5" />
                                <span>Restore Selected ({selectedIds.size})</span>
                            </Button>

                            {isAdmin && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 text-xs rounded-xl text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5"
                                    onClick={triggerBulkPermanent}
                                >
                                    <Trash2 className="size-3.5" />
                                    <span>Permanent Delete ({selectedIds.size})</span>
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 text-xs rounded-xl"
                                onClick={handleClearSelection}
                            >
                                <X className="size-3.5 mr-1" />
                                Clear
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            <AlertDialog open={dialogState.isOpen} onOpenChange={(open) => !actionLoading && setDialogState(prev => ({ ...prev, isOpen: open }))}>
                <AlertDialogContent className="rounded-2xl max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
                            {dialogState.type.includes('permanent') ? (
                                <>
                                    <AlertTriangle className="size-6 text-rose-500" />
                                    <span>Confirm Permanent Deletion</span>
                                </>
                            ) : (
                                <>
                                    <RotateCcw className="size-6 text-emerald-500" />
                                    <span>Confirm Tool Restoration</span>
                                </>
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground pt-2">
                            {dialogState.type === 'restore' && (
                                <>Are you sure you want to restore tool <strong className="text-foreground font-mono">{dialogState.targetToolId}</strong>? It will return to its original Project/Store inventory with its exact Tool ID and history.</>
                            )}
                            {dialogState.type === 'bulk-restore' && (
                                <>Are you sure you want to restore <strong>{selectedIds.size}</strong> selected tools? They will return to their respective Project/Store inventories.</>
                            )}
                            {dialogState.type === 'permanent' && (
                                <span className="text-rose-600 dark:text-rose-400 font-medium">
                                    WARNING: Permanently deleting tool <strong>{dialogState.targetToolId}</strong> will erase it forever from the database. This action CANNOT be undone.
                                </span>
                            )}
                            {dialogState.type === 'bulk-permanent' && (
                                <span className="text-rose-600 dark:text-rose-400 font-medium">
                                    WARNING: Permanently deleting <strong>{selectedIds.size}</strong> tools will erase them forever from the database. This action CANNOT be undone.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0 pt-4 border-t mt-4">
                        <AlertDialogCancel disabled={actionLoading} className="rounded-xl">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={actionLoading}
                            onClick={handleConfirmAction}
                            className={`rounded-xl ${
                                dialogState.type.includes('permanent')
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                        >
                            {actionLoading ? (
                                <Loader2 className="size-4 animate-spin mr-1.5" />
                            ) : null}
                            {dialogState.type.includes('permanent') ? 'Permanently Delete' : 'Restore'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default TrashPage
