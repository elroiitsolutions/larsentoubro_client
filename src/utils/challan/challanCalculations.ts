export interface ChallanItemSummary {
    totalSent: number;
    totalReturned: number;
    totalMissing: number;
    totalQuantity: number;
    totalRate: number;
    isPartialReturn: boolean;
    isFullyReturned: boolean;
}

export interface ChallanItemInput {
    quantity?: number;
    rate?: number;
    returnStatus?: 'Sent' | 'Returned' | 'Missing';
}

/**
 * Calculates summary statistics for any list of challan items
 */
export const calculateChallanSummary = (items: ChallanItemInput[] = []): ChallanItemSummary => {
    let totalSent = items.length;
    let totalReturned = 0;
    let totalMissing = 0;
    let totalQuantity = 0;
    let totalRate = 0;

    for (const item of items) {
        const qty = Number(item.quantity || 1);
        const rate = Number(item.rate || 0);
        totalQuantity += qty;
        totalRate += qty * rate;

        if (item.returnStatus === 'Returned') {
            totalReturned += 1;
        } else if (item.returnStatus === 'Missing') {
            totalMissing += 1;
        }
    }

    const isPartialReturn = totalReturned > 0 && totalReturned < totalSent;
    const isFullyReturned = totalSent > 0 && totalReturned === totalSent;

    return {
        totalSent,
        totalReturned,
        totalMissing,
        totalQuantity,
        totalRate,
        isPartialReturn,
        isFullyReturned
    };
};

/**
 * Validates that Return Challan items cover all original DC items correctly
 */
export const validateReturnChallanItems = (items: { returnStatus?: string }[] = []): { valid: boolean; error?: string } => {
    if (!items || items.length === 0) {
        return { valid: false, error: 'At least one tool must be included in the return challan' };
    }
    const invalidItem = items.find(i => i.returnStatus !== 'Returned' && i.returnStatus !== 'Missing');
    if (invalidItem) {
        return { valid: false, error: 'Every item must be marked either as Returned or Missing' };
    }
    return { valid: true };
};

/**
 * Formats a challan serial into DC-YYYY-XXXXXX format
 */
export const formatChallanNumber = (type: 'Delivery' | 'Return', year: number, serial: number | string): string => {
    const prefix = type === 'Delivery' ? 'DC' : 'RC';
    const numStr = String(serial).padStart(6, '0');
    return `${prefix}-${year}-${numStr}`;
};

/**
 * Returns Tailwind CSS badge classes for Challan Status
 */
export const getChallanStatusBadgeClass = (status: string): string => {
    switch (status) {
        case 'Active':
            return 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 ring-1 ring-blue-500/30 font-semibold px-2.5 py-0.5 rounded-full text-xs';
        case 'Completed':
            return 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 ring-1 ring-emerald-500/30 font-semibold px-2.5 py-0.5 rounded-full text-xs';
        case 'Cancelled':
            return 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 ring-1 ring-rose-500/30 font-semibold px-2.5 py-0.5 rounded-full text-xs';
        default:
            return 'bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 ring-1 ring-slate-500/30 font-semibold px-2.5 py-0.5 rounded-full text-xs';
    }
};

/**
 * Returns Tailwind CSS badge classes for Challan Type (DC vs RC)
 */
export const getChallanTypeBadgeClass = (type: string): string => {
    switch (type) {
        case 'Delivery':
            return 'bg-purple-500/15 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 ring-1 ring-purple-500/30 font-semibold px-2.5 py-0.5 rounded-md text-xs inline-flex items-center gap-1';
        case 'Return':
            return 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-amber-500/30 font-semibold px-2.5 py-0.5 rounded-md text-xs inline-flex items-center gap-1';
        default:
            return 'bg-gray-500/15 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300 ring-1 ring-gray-500/30 font-semibold px-2.5 py-0.5 rounded-md text-xs';
    }
};

/**
 * Returns Tailwind CSS badge classes for inventory tool statuses including new Moving & Missing states
 */
export const getToolInventoryBadgeClass = (status: string): string => {
    switch (status) {
        case 'Available':
            return 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 ring-1 ring-emerald-500/30 shadow-sm';
        case 'In Use':
            return 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 ring-1 ring-blue-500/30 shadow-sm';
        case 'Moving':
            return 'bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 ring-1 ring-indigo-500/30 shadow-sm animate-pulse';
        case 'Missing':
            return 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 ring-1 ring-rose-500/30 shadow-sm';
        case 'Maintenance':
            return 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 ring-1 ring-amber-500/30 shadow-sm';
        case 'Damaged':
            return 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 ring-1 ring-rose-500/30 shadow-sm';
        case 'Expired':
            return 'bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 ring-1 ring-slate-500/30 shadow-sm';
        default:
            return 'bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 ring-1 ring-slate-500/30 shadow-sm';
    }
};
