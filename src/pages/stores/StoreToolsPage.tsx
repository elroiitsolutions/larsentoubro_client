import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchIcon, ArrowLeftIcon, Loader2, ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"

const statusColors: Record<string, string> = {
    "Available": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    "In Use": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "Maintenance": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    "Damaged": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    "Expired": "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
}

const categories = ["All", "Power Tools", "Hand Tools", "Safety Equipment", "Measuring Instruments", "Consumables"];
const statuses = ["All", "Available", "In Use", "Maintenance", "Damaged", "Expired"];

export function StoreToolsPage() {
    const { storeId } = useParams();
    const navigate = useNavigate();
    
    const [tools, setTools] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination and Filter States
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [status, setStatus] = useState("All");
    
    const [sortBy, setSortBy] = useState("toolId");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const fetchTools = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                category,
                status,
                sortBy,
                sortOrder
            });
            
            const res = await fetch(`http://localhost:3000/api/stores/${storeId}/tools?${query.toString()}`);
            const data = await res.json();
            if (data.success) {
                setTools(data.data);
                setTotal(data.total);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch tools");
        } finally {
            setLoading(false);
        }
    }, [storeId, page, limit, search, category, status, sortBy, sortOrder]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchTools();
        }, 300);
        return () => clearTimeout(timeout);
    }, [fetchTools]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
    };

    const renderSortIcon = (field: string) => {
        if (sortBy !== field) return null;
        return sortOrder === "asc" ? <ArrowUpIcon className="size-3 ml-1" /> : <ArrowDownIcon className="size-3 ml-1" />;
    };

    return (
        <div className="flex flex-col gap-6">
            {/* <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeftIcon className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Tools Inventory</h1>
                        <p className="text-muted-foreground text-sm">Store: {storeId}</p>
                    </div>
                </div>
            </div> */}

            <Card>
                <CardHeader className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Inventory List ({total} items)</CardTitle>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search tool ID or name..." 
                                className="pl-9 h-10" 
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <select 
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            value={category}
                            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                        >
                            {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                        </select>
                        <select 
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        >
                            {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
                        </select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40">
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('toolId')}>
                                        <div className="flex items-center">Tool ID {renderSortIcon('toolId')}</div>
                                    </th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('name')}>
                                        <div className="flex items-center">Tool Name {renderSortIcon('name')}</div>
                                    </th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('category')}>
                                        <div className="flex items-center">Category {renderSortIcon('category')}</div>
                                    </th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('status')}>
                                        <div className="flex items-center">Status {renderSortIcon('status')}</div>
                                    </th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('quantity')}>
                                        <div className="flex items-center">Qty {renderSortIcon('quantity')}</div>
                                    </th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('expiryDate')}>
                                        <div className="flex items-center">Expiry {renderSortIcon('expiryDate')}</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                            <Loader2 className="size-6 animate-spin mx-auto mb-2" />
                                            Loading tools...
                                        </td>
                                    </tr>
                                ) : tools.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                            No tools found matching your criteria.
                                        </td>
                                    </tr>
                                ) : tools.map((t, i) => (
                                    <tr
                                        key={t.id}
                                        className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                                    >
                                        <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{t.toolId}</td>
                                        <td className="px-6 py-3 font-medium">{t.name}</td>
                                        <td className="px-6 py-3 text-muted-foreground">{t.category}</td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[t.status] || 'bg-gray-100 text-gray-700'}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 font-medium">{t.quantity}</td>
                                        <td className="px-6 py-3 text-muted-foreground">{t.expiryDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="flex items-center justify-between px-6 py-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Showing {total === 0 ? 0 : ((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} tools
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={page === 1 || loading}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                Previous
                            </Button>
                            <span className="text-sm font-medium px-2">Page {page} of {totalPages}</span>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={page >= totalPages || loading}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
