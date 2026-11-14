import React, { useState, useEffect, useCallback, useRef } from "react"
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
    Truck,
    Filter,
    FolderKanban,
    Store as StoreIcon,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from "lucide-react"
import toolService, { type ToolRecord } from "@/services/tool.service"
import { projectService, type ProjectRecord } from "@/services/project.service"
import { storeService, type StoreRecord } from "@/services/store.service"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { ScrapModal } from "./ScrapModal"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

export function ScrapPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === "Admin"
    const isInspectionRestricted = Boolean(!isAdmin && user?.hasInspectionAccess)

    const [scrappedTools, setScrappedTools] = useState<ToolRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [showDcModal, setShowDcModal] = useState(false)

    // Filter states
    const [search, setSearch] = useState("")
    const [selectedProject, setSelectedProject] = useState("All")
    const [selectedStore, setSelectedStore] = useState("All")
    const [disposalStatus, setDisposalStatus] = useState<"pending" | "disposed" | "all">("pending")

    // Master filter options
    const [projects, setProjects] = useState<ProjectRecord[]>([])
    const [stores, setStores] = useState<StoreRecord[]>([])

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Pagination
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(1)

    // Floating bulk actions widget state
    const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false)
    const bulkActionsRef = useRef<HTMLDivElement>(null)
    const prevSelectedCountRef = useRef(0)

    useEffect(() => {
        if (selectedIds.size === 0) {
            setIsBulkActionsOpen(false)
        } else if (prevSelectedCountRef.current === 0 && selectedIds.size > 0) {
            setIsBulkActionsOpen(true)
        }
        prevSelectedCountRef.current = selectedIds.size
    }, [selectedIds.size])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bulkActionsRef.current && !bulkActionsRef.current.contains(event.target as Node)) {
                setIsBulkActionsOpen(false)
            }
        }
        if (isBulkActionsOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isBulkActionsOpen])

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

    // Load filter options on mount
    useEffect(() => {
        const loadFilterOptions = async () => {
            try {
                const [projRes, storeRes] = await Promise.all([
                    projectService.getProjects().catch(() => ({ data: [] })),
                    storeService.getStores().catch(() => ({ data: [] }))
                ])
                if (projRes?.data) setProjects(projRes.data)
                if (storeRes?.data) setStores(storeRes.data)
            } catch (err) {
                console.error("Failed to load filter options in ScrapPage:", err)
            }
        }
        loadFilterOptions()
    }, [])

    const fetchScrappedTools = useCallback(async () => {
        setLoading(true)
        try {
            const queryParams: Record<string, string> = {
                page: page.toString(),
                limit: limit.toString(),
                disposalStatus
            }
            if (search.trim()) queryParams.search = search.trim()
            if (selectedProject && selectedProject !== 'All') queryParams.projectId = selectedProject
            if (selectedStore && selectedStore !== 'All') queryParams.storeId = selectedStore

            const res = await toolService.getScrappedTools(queryParams)
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
    }, [page, limit, search, selectedProject, selectedStore, disposalStatus])

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchScrappedTools()
        }, 300)
        return () => clearTimeout(timeout)
    }, [fetchScrappedTools])

    const handleToggleSelect = (id: string, isDisposed: boolean | undefined, e: React.MouseEvent) => {
        e.stopPropagation()
        if (isDisposed) {
            toast.info("This tool has already been disposed via a Delivery Challan")
            return
        }
        const next = new Set(selectedIds)
        if (next.has(id)) {
            next.delete(id)
        } else {
            next.add(id)
        }
        setSelectedIds(next)
    }

    const [isSelectingAll, setIsSelectingAll] = useState(false)

    // Selectable tools are only those that are NOT already disposed
    const selectableToolsOnPage = scrappedTools.filter(t => !t.isDisposed)
    const isAllSelected = selectableToolsOnPage.length > 0 && selectableToolsOnPage.every(t => selectedIds.has(t._id))

    const handleToggleSelectAll = async () => {
        if (isAllSelected) {
            setSelectedIds(new Set())
            return
        }

        if (total <= scrappedTools.length) {
            const next = new Set(selectableToolsOnPage.map(t => t._id))
            setSelectedIds(next)
            return
        }

        try {
            setIsSelectingAll(true)
            const queryParams: Record<string, string> = {
                page: "1",
                limit: "10000",
                disposalStatus
            }
            if (search.trim()) queryParams.search = search.trim()
            if (selectedProject && selectedProject !== 'All') queryParams.projectId = selectedProject
            if (selectedStore && selectedStore !== 'All') queryParams.storeId = selectedStore

            const res = await toolService.getScrappedTools(queryParams)
            if (res?.success && res.data) {
                const selectable = res.data.filter((t: any) => !t.isDisposed)
                const next = new Set<string>(selectable.map((t: any) => t._id))
                setSelectedIds(next)
                toast.success(`Selected all ${selectable.length} selectable scrapped tools`)
            }
        } catch (err: any) {
            console.error("Error selecting all scrapped tools:", err)
            const next = new Set(selectableToolsOnPage.map(t => t._id))
            setSelectedIds(next)
        } finally {
            setIsSelectingAll(false)
        }
    }

    const handleClearSelection = () => {
        setSelectedIds(new Set())
    }

    const resetFilters = () => {
        setSearch("")
        setSelectedProject("All")
        setSelectedStore("All")
        setDisposalStatus("pending")
        setPage(1)
        setSelectedIds(new Set())
    }

    const isAnyFilterActive = search !== "" || selectedProject !== "All" || selectedStore !== "All" || disposalStatus !== "pending"

    // Confirm dialog triggers
    const triggerSingleRestore = (tool: ToolRecord) => {
        if (tool.isDisposed) {
            toast.error("Cannot restore a tool that has already been disposed via a Delivery Challan")
            return
        }
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
                    toast.success(res.message || "Tool restored to active inventory successfully")
                    fetchScrappedTools()
                }
            } else if (dialogState.type === 'bulk-restore') {
                const res = await toolService.bulkRestoreTools(Array.from(selectedIds))
                if (res.success) {
                    toast.success(res.message || "Selected tools restored to active inventory successfully")
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

    // Options for SearchableSelect
    const projectOptions = projects.map(p => ({
        label: p.name,
        value: p._id
    }))

    const filteredStores = selectedProject && selectedProject !== "All"
        ? stores.filter(s => s.projectId === selectedProject || (s.project && (s.project._id || s.project) === selectedProject))
        : stores

    const storeOptions = filteredStores.map(s => ({
        label: s.name,
        value: s._id
    }))

    const disposalStatusOptions = [
        { label: "Available for Disposal", value: "pending" },
        { label: "Disposed via DC", value: "disposed" },
        { label: "All Scrapped Tools", value: "all" }
    ]

    return (
        <div className="w-full flex flex-col space-y-3 pt-1 pb-4 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Archive className="size-4" />
                        </div>
                        <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">Scrapped Tools Management</h1>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
                       {total} Total Records
                    </p>
                </div>
            </div>

            <Card className="flex-1 min-h-0 flex flex-col border-border/50 shadow-2xs overflow-hidden rounded-xl bg-gradient-to-b from-background to-background/50 backdrop-blur-xl">
                {/* Search & Filter Bar */}
                <div className="p-2.5 sm:p-3 border-b bg-muted/20 shrink-0 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-2.5 items-end">
                        {/* Search Input */}
                        <div className="lg:col-span-4 space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                Search Scrapped Tools
                            </span>
                            <div className="relative group">
                                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                <Input
                                    placeholder="Search by ID, tool code, or description..."
                                    className="!pl-8 h-7.5 bg-background/50 border-border/60 hover:bg-background focus:bg-background transition-all shadow-2xs rounded-lg text-xs"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                />
                            </div>
                        </div>

                        {/* Project Filter */}
                        <div className="lg:col-span-3 space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <FolderKanban className="size-3 text-indigo-500" /> Project
                            </span>
                            <SearchableSelect
                                options={projectOptions}
                                value={selectedProject}
                                onValueChange={(val) => {
                                    setSelectedProject(val);
                                    setSelectedStore("All");
                                    setPage(1);
                                }}
                                allLabel="All Projects"
                                placeholder="All Projects"
                                className="h-7.5 text-xs rounded-lg"
                            />
                        </div>

                        {/* Store Filter */}
                        <div className="lg:col-span-2 space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <StoreIcon className="size-3 text-emerald-500" /> Store / Site
                            </span>
                            <SearchableSelect
                                options={storeOptions}
                                value={selectedStore}
                                onValueChange={(val) => {
                                    setSelectedStore(val);
                                    setPage(1);
                                }}
                                allLabel="All Stores"
                                placeholder="All Stores"
                                className="h-7.5 text-xs rounded-lg"
                            />
                        </div>

                        {/* Disposal Status Filter */}
                        <div className="lg:col-span-3 space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Filter className="size-3 text-amber-500" /> Disposal Status
                            </span>
                            <SearchableSelect
                                options={disposalStatusOptions}
                                value={disposalStatus}
                                onValueChange={(val) => {
                                    setDisposalStatus(val as any);
                                    setPage(1);
                                    setSelectedIds(new Set());
                                }}
                                allLabel="Select status..."
                                placeholder="Disposal Status"
                                className="h-7.5 text-xs rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Reset Filters Quick Button */}
                    {isAnyFilterActive && (
                        <div className="flex items-center justify-between pt-1 text-xs">
                            <span className="text-muted-foreground font-medium text-[10px]">
                                Filtered view active: Showing {total} matched item(s)
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetFilters}
                                className="h-6 px-2 text-[10px] font-medium text-primary hover:bg-primary/10 cursor-pointer"
                            >
                                <RotateCcw className="size-2.5 mr-1" /> Reset all filters
                            </Button>
                        </div>
                    )}
                </div>

                <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-hidden relative">
                        <div className="h-full overflow-auto">
                            <table className="w-full text-xs text-left whitespace-nowrap">
                                <thead className="sticky top-0 z-10 bg-card shadow-xs">
                                    <tr className="border-b bg-muted text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                                        <th className="w-10 px-2.5 py-2 select-none text-center">
                                            <button
                                                type="button"
                                                onClick={handleToggleSelectAll}
                                                disabled={selectableToolsOnPage.length === 0 || isSelectingAll}
                                                className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                                                title={isAllSelected ? "Deselect all" : `Select all ${selectableToolsOnPage.length} available tools`}
                                            >
                                                {isSelectingAll ? (
                                                    <Loader2 className="size-3.5 animate-spin text-primary" />
                                                ) : isAllSelected ? (
                                                    <CheckSquare className="size-3.5 text-primary" />
                                                ) : (
                                                    <Square className="size-3.5" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-3.5 py-2">Tool ID</th>
                                        <th className="px-3.5 py-2">Description</th>
                                        <th className="px-3.5 py-2">Original Store / Site</th>
                                        <th className="px-3.5 py-2">Project</th>
                                        <th className="px-3.5 py-2">Scrapped Date</th>
                                        <th className="px-3.5 py-2">Scrapped By</th>
                                        <th className="px-3.5 py-2">Scrap Reason</th>
                                        <th className="px-3.5 py-2">Disposal Status</th>
                                        <th className="px-3.5 py-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {loading || scrappedTools.length === 0 ? (
                                        <tr>
                                            <td colSpan={50} className="px-6 py-24 text-center select-none opacity-0">
                                                &nbsp;
                                            </td>
                                        </tr>
                                    ) : (
                                        scrappedTools.map((t) => {
                                            const storeObj = t.currentSite || t.project
                                            const storeName = typeof storeObj === 'object' ? (storeObj.name || storeObj.location) : (t as any).storeName || '-'
                                            const projectObj = t.project
                                            const projectName = typeof projectObj === 'object' ? projectObj.name : '-'
                                            const scrappedByName = t.scrappedBy?.name || t.scrappedBy?.email || 'User'
                                            const scrappedDateStr = t.scrappedAt ? new Date(t.scrappedAt).toLocaleDateString() : '-'
                                            const isDisposed = Boolean(t.isDisposed)
                                            const dealerName = t.scrapDealer?.name || ''
                                            const challanNum = t.disposalChallanNumber || (t.disposalChallanId?.challanNumber) || ''

                                            return (
                                                <tr
                                                    key={t._id}
                                                    className={`group hover:bg-muted/30 transition-colors duration-200 ${
                                                        selectedIds.has(t._id) ? "bg-primary/[0.05]" : ""
                                                    }`}
                                                >
                                                    <td
                                                        className="px-4 py-4 text-center"
                                                        onClick={(e) => handleToggleSelect(t._id, isDisposed, e)}
                                                    >
                                                        <button
                                                            type="button"
                                                            disabled={isDisposed}
                                                            className={`flex items-center justify-center transition-colors ${
                                                                isDisposed
                                                                    ? "text-muted-foreground/30 cursor-not-allowed"
                                                                    : "text-muted-foreground hover:text-primary cursor-pointer"
                                                            }`}
                                                            title={isDisposed ? "Already disposed via Delivery Challan" : "Select tool"}
                                                        >
                                                            {selectedIds.has(t._id) ? (
                                                                <CheckSquare className="size-3.5 text-primary" />
                                                            ) : (
                                                                <Square className="size-3.5" />
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="px-3.5 py-2 font-mono font-bold text-foreground text-xs">
                                                        <span>{t.toolId || t.toolCode || t._id}</span>
                                                    </td>
                                                    <td className="px-3.5 py-2 font-medium text-foreground max-w-xs truncate text-xs" title={t.description}>
                                                        {t.description || '-'}
                                                    </td>
                                                    <td className="px-3.5 py-2 text-muted-foreground text-xs">
                                                        {storeName}
                                                    </td>
                                                    <td className="px-3.5 py-2 text-muted-foreground text-xs">
                                                        {projectName}
                                                    </td>
                                                    <td className="px-3.5 py-2 text-muted-foreground text-[11px]">
                                                        {scrappedDateStr}
                                                    </td>
                                                    <td className="px-3.5 py-2 text-muted-foreground text-xs font-medium">
                                                        {scrappedByName}
                                                    </td>
                                                    <td className="px-3.5 py-2 text-muted-foreground text-xs max-w-[180px] truncate" title={t.scrapReason || 'Marked as Scrap'}>
                                                        {t.scrapReason || '-'}
                                                    </td>
                                                    <td className="px-3.5 py-2">
                                                        {isDisposed ? (
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30 w-fit">
                                                                    <Truck className="size-2.5 text-slate-600 dark:text-slate-400" />
                                                                    Disposed: {challanNum || 'SDC'}
                                                                </span>
                                                                {dealerName && (
                                                                    <span className="text-[9px] text-muted-foreground font-medium pl-1">
                                                                        To: {dealerName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                                                <Archive className="size-2.5 text-amber-600" />
                                                                Available for Disposal
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3.5 py-2 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {!isDisposed ? (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => triggerSingleRestore(t)}
                                                                    className="h-7 px-2 text-[11px] font-medium text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 rounded-lg cursor-pointer"
                                                                >
                                                                    <RotateCcw className="size-3.5 mr-1" />
                                                                    Restore
                                                                </Button>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground italic pr-2">
                                                                    Completed
                                                                </span>
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

                        {loading && (
                            <div className="absolute inset-x-0 bottom-0 top-[49px] z-20 flex flex-col items-center justify-center pointer-events-none">
                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                    <Loader2 className="size-8 animate-spin text-primary/50 mb-4" />
                                    <p className="text-sm font-medium animate-pulse">Loading scrapped tools...</p>
                                </div>
                            </div>
                        )}

                        {!loading && scrappedTools.length === 0 && (
                            <div className="absolute inset-x-0 bottom-0 top-[49px] z-20 flex flex-col items-center justify-center pointer-events-none">
                                <div className="pointer-events-auto flex flex-col items-center justify-center max-w-sm mx-auto p-4 text-center">
                                    <div className="size-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 text-amber-600">
                                        <Archive className="size-8" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-1">
                                        {disposalStatus === "disposed" ? "No Disposed Tools" : "No Scrapped Tools Found"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground text-balance">
                                        {disposalStatus === "pending"
                                            ? "No tools waiting for disposal. Tools marked as Scrap from store inventory will appear here."
                                            : "No matching scrap tool records found for the selected filter criteria."}
                                    </p>
                                    {isAnyFilterActive && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={resetFilters}
                                            className="mt-4 rounded-xl text-xs gap-1.5"
                                        >
                                            <RotateCcw className="size-3.5" />
                                            Reset Filters
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Compact Pagination Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between px-3.5 py-1.5 border-t border-border/50 bg-muted/15 gap-2 shrink-0">
                        <div className="text-[11px] font-medium text-muted-foreground w-full sm:w-auto text-center sm:text-left">
                            Showing <span className="font-semibold text-foreground">{total === 0 ? 0 : ((page - 1) * limit) + 1}</span> to <span className="font-semibold text-foreground">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-foreground">{total}</span> items
                        </div>
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                            {/* First Page */}
                            {page > 1 && (
                                <button
                                    onClick={() => setPage(1)}
                                    disabled={loading}
                                    className="h-6.5 w-6.5 rounded-md flex items-center justify-center border border-border/70 bg-background hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                                    title="First Page"
                                >
                                    <ChevronsLeft className="size-3.5" />
                                </button>
                            )}

                            {/* Previous Page */}
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                                className="h-6.5 w-6.5 rounded-md flex items-center justify-center border border-border/70 bg-background hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                                title="Previous Page"
                            >
                                <ChevronLeft className="size-3.5" />
                            </button>

                            {/* Page Range Buttons */}
                            {(() => {
                                const pageRange = [];
                                const maxVisiblePages = 5;
                                let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
                                let endPage = startPage + maxVisiblePages - 1;

                                if (endPage > totalPages) {
                                    endPage = totalPages;
                                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                }

                                for (let i = startPage; i <= endPage; i++) {
                                    pageRange.push(i);
                                }

                                return pageRange.map((pNum) => {
                                    const isActive = pNum === page;
                                    return (
                                        <button
                                            key={pNum}
                                            onClick={() => setPage(pNum)}
                                            disabled={loading}
                                            className={`h-6.5 min-w-[26px] px-1.5 rounded-md flex items-center justify-center text-[11px] transition-all cursor-pointer border ${
                                                isActive
                                                    ? "bg-primary border-primary text-primary-foreground font-bold shadow-2xs"
                                                    : "bg-background border-border/70 hover:bg-muted text-foreground font-medium"
                                            }`}
                                        >
                                            {pNum}
                                        </button>
                                    );
                                });
                            })()}

                            {/* Next Page */}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || loading}
                                className="h-6.5 w-6.5 rounded-md flex items-center justify-center border border-border/70 bg-background hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                                title="Next Page"
                            >
                                <ChevronRight className="size-3.5" />
                            </button>

                            {/* Last Page */}
                            {page < totalPages && (
                                <button
                                    onClick={() => setPage(totalPages)}
                                    disabled={loading}
                                    className="h-6.5 w-6.5 rounded-md flex items-center justify-center border border-border/70 bg-background hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                                    title="Last Page"
                                >
                                    <ChevronsRight className="size-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="hidden sm:block w-full sm:w-auto text-right text-[11px] text-muted-foreground">
                            Page <span className="font-bold text-foreground">{page}</span> of <span className="font-bold text-foreground">{totalPages}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Floating Bulk Selection Action Button & Popover (Positioned on the bottom-left to match tools page) */}
            {selectedIds.size > 0 && (
                <div ref={bulkActionsRef} className="fixed bottom-3 sm:bottom-5 left-4 sm:left-6 z-50 flex flex-col items-start gap-2.5 animate-in slide-in-from-bottom-5 duration-300">
                    {/* Expanded Actions Popover / Card */}
                    {isBulkActionsOpen && (
                        <div className="bg-card/95 backdrop-blur-xl p-4 rounded-2xl border border-border shadow-2xl ring-1 ring-primary/20 w-[calc(100vw-2rem)] max-w-sm sm:max-w-md animate-in slide-in-from-bottom-2 fade-in-50 duration-200 flex flex-col gap-3">
                            {/* Header row with count, label, and clear */}
                            <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-border/60">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="size-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0">
                                        {selectedIds.size}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-semibold text-foreground truncate">
                                            Selected Tools: {selectedIds.size}
                                        </h4>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {isAllSelected ? "All available scrapped tools selected" : "Custom scrap selection"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg gap-1 cursor-pointer"
                                        onClick={handleClearSelection}
                                        title="Clear all selected tools"
                                    >
                                        <X className="size-3.5" />
                                        <span>Clear</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                                        onClick={() => setIsBulkActionsOpen(false)}
                                        title="Collapse"
                                    >
                                        <ChevronDown className="size-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Action Buttons: Scrap DC & Restore */}
                            <div className={`grid gap-2 w-full ${!isInspectionRestricted ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                                {!isInspectionRestricted && (
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setShowDcModal(true);
                                            setIsBulkActionsOpen(false);
                                        }}
                                        className="w-full h-10 text-xs rounded-xl flex items-center justify-center gap-2 font-semibold transition-all bg-amber-600 hover:bg-amber-700 text-white shadow-md cursor-pointer"
                                    >
                                        <Truck className="size-4 shrink-0" />
                                        <span className="truncate">Create Scrap DC ({selectedIds.size})</span>
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        triggerBulkRestore();
                                        setIsBulkActionsOpen(false);
                                    }}
                                    className="w-full h-10 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 cursor-pointer"
                                >
                                    <RotateCcw className="size-3.5 shrink-0" />
                                    <span className="truncate">Restore Selected ({selectedIds.size})</span>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Single Left-Side Trigger Button showing count (matching tools page) */}
                    <button
                        type="button"
                        onClick={() => setIsBulkActionsOpen(prev => !prev)}
                        className={`flex items-center gap-2.5 bg-card/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-border shadow-2xl ring-1 transition-all cursor-pointer select-none group shrink-0 ${
                            isBulkActionsOpen ? "ring-primary shadow-primary/10 bg-accent/40" : "ring-primary/20 hover:bg-accent/60"
                        }`}
                        title={isBulkActionsOpen ? "Close actions menu" : "Open actions menu"}
                    >
                        <div className="size-7 sm:size-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 group-hover:scale-105 transition-transform">
                            {selectedIds.size}
                        </div>
                        <div className="text-left">
                            <h4 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <span>Selected Tools ({selectedIds.size})</span>
                                <ChevronUp className={`size-3.5 text-muted-foreground transition-transform duration-200 ${isBulkActionsOpen ? "rotate-180" : ""}`} />
                            </h4>
                            <p className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
                                {isBulkActionsOpen ? "Click to close" : "Click to view actions"}
                            </p>
                        </div>
                    </button>
                </div>
            )}

            {/* Scrap Dealer Selection & Disposal DC Creation Modal */}
            {!isInspectionRestricted && (
                <ScrapModal
                    open={showDcModal}
                    onOpenChange={setShowDcModal}
                    selectedTools={scrappedTools.filter(t => selectedIds.has(t._id))}
                    onSuccess={() => {
                        handleClearSelection();
                        fetchScrappedTools();
                    }}
                />
            )}

            {/* Confirmation Dialog */}
            <AlertDialog open={dialogState.isOpen} onOpenChange={(open) => !open && setDialogState(prev => ({ ...prev, isOpen: false }))}>
                <AlertDialogContent className="rounded-xl max-w-md p-4 sm:p-5 shadow-2xl border-border/80">
                    <AlertDialogHeader className="space-y-1.5">
                        <AlertDialogTitle className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                                <RotateCcw className="size-4" />
                            </div>
                            <span>Confirm Inventory Restore</span>
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
                            {dialogState.type === 'restore' && (
                                <>Are you sure you want to restore scrapped tool <strong className="font-mono text-foreground">{dialogState.targetToolId}</strong> back to active store inventory?</>
                            )}
                            {dialogState.type === 'bulk-restore' && (
                                <>Are you sure you want to restore <strong>{selectedIds.size}</strong> selected scrapped tools back to active store inventory?</>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-2 pt-3 border-t border-border/60 mt-3">
                        <AlertDialogCancel disabled={actionLoading} className="h-8 rounded-lg px-4 text-xs font-semibold hover:bg-muted/60 cursor-pointer">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmAction}
                            disabled={actionLoading}
                            className="h-8 rounded-lg px-4.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-2xs"
                        >
                            {actionLoading ? (
                                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                            ) : null}
                            Confirm & Restore
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default ScrapPage
