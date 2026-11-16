import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { QuickToolViewModal } from "@/components/tools/QuickToolViewModal";

export function QuickToolViewPage() {
    const { toolId, storeId: paramStoreId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const queryStoreId = searchParams.get('storeId');
    const queryProjectId = searchParams.get('projectId');

    const initialTool = (location.state as any)?.initialTool;
    const fromStoreId = paramStoreId || queryStoreId || (location.state as any)?.fromStoreId || (location.state as any)?.storeId;
    const fromProjectId = queryProjectId || (location.state as any)?.projectId || (location.state as any)?.fromProjectId;

    const handleClose = () => {
        const bgLoc = (location.state as any)?.backgroundLocation;
        if (bgLoc) {
            navigate(-1);
            return;
        }
        if (window.history.length > 1) {
            navigate(-1);
        } else if (fromStoreId && fromStoreId !== 'all') {
            navigate(`/stores/${fromStoreId}/tools`);
        } else {
            navigate('/tools');
        }
    };

    return (
        <div className="relative w-full h-full min-h-[85vh] flex items-center justify-center p-4">
            <QuickToolViewModal
                open={true}
                tool={initialTool}
                toolId={toolId}
                storeId={fromStoreId}
                projectId={fromProjectId}
                onClose={handleClose}
                isStandalone={true}
            />
        </div>
    );
}
