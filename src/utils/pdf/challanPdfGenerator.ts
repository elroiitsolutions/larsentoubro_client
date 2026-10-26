import { LNT_LOGO_BASE64 } from "@/assets/logoBase64";

declare global {
    interface Window {
        jspdf: any;
    }
}

/**
 * Helper to format any date into DD-MM-YYYY (e.g. 05-08-2026)
 */
export const formatDateDDMMYYYY = (dateInput: any): string => {
    if (!dateInput) return new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

/**
 * Format DC/RC Number with 2-digit year and minimum 3-digit padding (e.g. DC-26-001, RC-26-001)
 */
export const formatDCNumber = (numStr: any): string => {
    if (!numStr) return 'DC-26-001';
    const str = String(numStr);
    return str.replace(/(SDC|DC|RC|STC|TC)-(\d{2,4})-(\d+)/i, (_, prefix, yr, num) => {
        const shortYr = String(yr).slice(-2);
        return `${prefix.toUpperCase()}-${shortYr}-${String(num).padStart(3, '0')}`;
    });
};

/**
 * Dynamically load jsPDF and autotable from reliable CDN if not already in browser bundle
 */
export const loadJsPDF = async (): Promise<any> => {
    if (window.jspdf && window.jspdf.jsPDF) {
        return window.jspdf;
    }

    await new Promise<void>((resolve, reject) => {
        if (document.getElementById('jspdf-cdn-script')) {
            const interval = setInterval(() => {
                if (window.jspdf && window.jspdf.jsPDF) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
            return;
        }

        const script1 = document.createElement('script');
        script1.id = 'jspdf-cdn-script';
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script1.onload = () => {
            const script2 = document.createElement('script');
            script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
            script2.onload = () => resolve();
            script2.onerror = () => reject(new Error('Failed to load jspdf-autotable CDN'));
            document.head.appendChild(script2);
        };
        script1.onerror = () => reject(new Error('Failed to load jspdf CDN'));
        document.head.appendChild(script1);
    });

    return window.jspdf;
};

export interface ChallanPdfOptions {
    download?: boolean;
    print?: boolean;
    fileName?: string;
}

/**
 * Draw L&T Construction standard header and layout
 */
const drawLnTHeader = (doc: any, challan: any, isReturn: boolean) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    const isScrapChallan = Boolean(
        challan.isScrapDC || 
        challan.challanType === 'Scrap' || 
        (challan.challanNumber && String(challan.challanNumber).startsWith('SDC-')) ||
        challan.vendor?.profileType === 'ScrapDealer' || 
        (challan.vendor?.vendorCode && String(challan.vendor.vendorCode).startsWith('SCR-')) ||
        (challan.remarks && typeof challan.remarks === 'string' && challan.remarks.toLowerCase().includes('scrap')) ||
        (challan.notes && typeof challan.notes === 'string' && challan.notes.toLowerCase().includes('scrap'))
    );

    // L&T Logo
    try {
        doc.addImage(LNT_LOGO_BASE64, 'PNG', 14, 7, 16, 16);
    } catch (e) {
        doc.setFillColor(14, 76, 146); // L&T Navy Blue
        doc.roundedRect(14, 10, 35, 10, 1.5, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('L&T Construction', 18, 16.5);
    }

    // Main Company Title
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Larsen & Toubro Limited, Construction', pageWidth / 2, 24, { align: 'center' });

    // Top Border Box Frame (Y: 28 to 72)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(14, 28, 182, 44);

    // Vertical split between Left title/meta box and Right Consignee box (Y: 28 to 58)
    doc.line(110, 28, 110, 58);

    // Title inside Left Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const titleText = isScrapChallan ? 'SCRAP DELIVERY CHALLAN' : (isReturn ? 'RETURN CHALLAN' : 'DELIVERY CHALLAN');
    doc.text(titleText, 62, 37, { align: 'center' });

    // Horizontal divider in Left Box for DC NO, INDENT NO, and DATE
    doc.line(14, 43, 110, 43);

    const hasIndent = Boolean(
        challan.indentNo && 
        String(challan.indentNo).trim() !== '' && 
        challan.indentNo !== '-'
    );

    if (hasIndent) {
        // 3 Equal columns for Left Box (Width 96mm, each 32mm):
        // Col 1: 14 to 46 (DC NO / RC NO)
        // Col 2: 46 to 78 (INDENT NO)
        // Col 3: 78 to 110 (DATE)
        doc.line(46, 43, 46, 58);
        doc.line(78, 43, 78, 58);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(isScrapChallan ? 'SDC NO.' : (isReturn ? 'RC NO.' : 'DC NO.'), 16, 48);
        doc.text('INDENT NO.', 48, 48);
        doc.text('DATE', 80, 48);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const challanNumFormatted = formatDCNumber(challan.challanNumber);
        doc.text(challanNumFormatted, 16, 54);

        const indentVal = String(challan.indentNo).trim();
        doc.text(indentVal, 48, 54);

        doc.text(formatDateDDMMYYYY(challan.challanDate), 80, 54);
    } else {
        // 2 Equal columns for Left Box (Width 96mm, each 48mm):
        // Col 1: 14 to 62 (DC NO / RC NO)
        // Col 2: 62 to 110 (DATE)
        doc.line(62, 43, 62, 58);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(isScrapChallan ? 'SDC NO.' : (isReturn ? 'RC NO.' : 'DC NO.'), 16, 48);
        doc.text('DATE', 64, 48);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const challanNumFormatted = formatDCNumber(challan.challanNumber);
        doc.text(challanNumFormatted, 16, 54);

        doc.text(formatDateDDMMYYYY(challan.challanDate), 64, 54);
    }

    // Consignee Right Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(isReturn ? 'SUBCONTRACTOR NAME' : 'CONSIGNEE / SUBCONTRACTOR', 112, 33);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const vendorName = challan.subcontractorName || challan.vendor?.name || 'Authorized Subcontractor';
    const vendorAddr = challan.vendor?.address || 'Site Work Location';
    const siteCodeStr = challan.siteCode !== undefined && challan.siteCode !== null && String(challan.siteCode).trim() !== '' ? String(challan.siteCode) : '-';
    const vendorCodeStr = challan.vendorCode || challan.vendor?.vendorCode || '-';
    const locationStr = challan.locationChainage ? `Loc: ${challan.locationChainage}` : '';

    if (isReturn) {
        doc.text(`Subcontractor: ${vendorName}`, 112, 39);
        if (challan.parentDcNumber) {
            doc.setFontSize(7.5);
            doc.text(`Return against DC No.: ${formatDCNumber(challan.parentDcNumber)} dated ${formatDateDDMMYYYY(challan.parentDcDate)}`, 112, 45);
        }
    } else {
        doc.text(vendorName, 112, 39, { maxWidth: 82 });
        doc.setFontSize(7.5);
        doc.text(`Addr: ${vendorAddr}`, 112, 44, { maxWidth: 82 });
        if (locationStr || challan.workFrontLocation) {
            const locText = `${locationStr} ${challan.workFrontLocation ? '| ' + challan.workFrontLocation : ''}`.trim();
            doc.text(locText, 112, 49, { maxWidth: 82 });
        }
        const isScrapChallan = Boolean(
            challan.isScrapDC || 
            challan.challanType === 'Scrap' || 
            challan.vendor?.profileType === 'ScrapDealer' || 
            (challan.vendor?.vendorCode && String(challan.vendor.vendorCode).startsWith('SCR-')) ||
            (challan.remarks && typeof challan.remarks === 'string' && challan.remarks.toLowerCase().includes('scrap')) ||
            (challan.notes && typeof challan.notes === 'string' && challan.notes.toLowerCase().includes('scrap'))
        );

        if (!isScrapChallan) {
            const siteAndTransfer = challan.transferFromDcNumber 
                ? `Site: ${siteCodeStr} | Transfer from: ${formatDCNumber(challan.transferFromDcNumber)}` 
                : `Site Code: ${siteCodeStr}`;
            doc.text(siteAndTransfer, 112, 54, { maxWidth: 82 });
        }
    }

    // Horizontal divider line across full box at Y: 58
    doc.line(14, 58, 196, 58);

    // TRN CD / ACCOUNTING CENTRE ROW (Y: 58 to 72)
    doc.line(30, 58, 30, 72);
    doc.line(60, 58, 60, 72);
    doc.line(82, 58, 82, 72);
    doc.line(105, 58, 105, 72);
    doc.line(132, 58, 132, 72);
    doc.line(168, 58, 168, 72);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.text('TRN CD', 22, 62, { align: 'center' });
    doc.text('SENDING / ACCT CENTRE CODE', 45, 62, { align: 'center' });
    doc.text('M.R.N. NO.', 71, 62, { align: 'center' });
    doc.text('M.R.N. DATE', 93.5, 62, { align: 'center' });
    doc.text('STOCK TYPE', 118.5, 62, { align: 'center' });

    const col6Label = isReturn ? 'SITE CODE NO.' : 'VENDOR CODE';
    doc.setFontSize(5.5);
    doc.text(col6Label, 150, 62, { align: 'center' });
    doc.text('E-WAY BILL NO.', 182, 62, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(String(challan.trnCode || (isReturn ? 'RET' : 'M 25')), 22, 69, { align: 'center' });
    doc.text(String(challan.sendingCentreCode || '-'), 45, 69, { align: 'center' });
    doc.text(String(challan.mrNo || challan.mrnNo || '-'), 71, 69, { align: 'center' });
    doc.text(String(challan.mrDate || '-'), 93.5, 69, { align: 'center' });
    doc.text(String(challan.stockType), 118.5, 69, { align: 'center' });
    doc.text(String(isReturn ? siteCodeStr : vendorCodeStr), 150, 69, { align: 'center' });
    doc.text(String(challan.ewayBillNo || '-'), 182, 69, { align: 'center' });

    // Returnable Stamp Banner or Note below box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 0, 0);
    const returnableNotice = isReturn
        ? 'The following is the return status of materials issued under the referenced Delivery Challan.'
        : 'NOT FOR SALE – MATERIAL ISSUED ON RETURNABLE BASIS';
    doc.text(returnableNotice, pageWidth / 2, 75, { align: 'center' });

    if (!isReturn) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.5);
        doc.setTextColor(60, 60, 60);
        doc.text('We have despatched the following goods. Kindly return the duplicate copy duly signed acknowledging receipt of goods', pageWidth / 2, 79, { align: 'center' });
    }
    doc.setTextColor(0, 0, 0);
};

/**
 * Draws L&T Construction Footer, Signatures, and Copy Distribution Notice
 */
const drawLnTFooter = (doc: any, challan: any, finalY: number, isReturn: boolean = false) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = finalY + 4;

    if (y > 215) {
        doc.addPage();
        y = 25;
    }

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);

    if (isReturn) {
        // Return Challan Specific Signature Blocks
        doc.rect(14, y, 182, 28);
        doc.line(74, y, 74, y + 28);
        doc.line(134, y, 134, y + 28);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('SUBCONTRACTOR SIGNATURE', 44, y + 6, { align: 'center' });
        doc.text('VERIFIED BY', 104, y + 6, { align: 'center' });
        doc.text('STORE MANAGER', 164, y + 6, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(`Returned By: ${challan.receiverName || 'Subcontractor Rep'}`, 16, y + 23);
        doc.text(`Verified Date: ${formatDateDDMMYYYY(challan.receiptDate)}`, 76, y + 23);
        doc.text('Approved Store Manager', 136, y + 23);

        y += 30;

        // REMARKS ROW
        doc.rect(14, y, 182, 14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('REMARKS', 16, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const remarksText = challan.remarks || 'Returned goods inspected at site store.';
        doc.text(doc.splitTextToSize(remarksText, 175), 16, y + 10);

        y += 18;
    } else {
        // Delivery Challan Standard Footer
        doc.rect(14, y, 140, 10);
        doc.rect(154, y, 42, 10);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        const gatePassText = `GATE PASS NO. (${challan.gatePassNo || 'GP-001'}) APPROVED BY (${challan.gatePassApprovedBy || 'APPROVED'})`;
        doc.text(gatePassText, 16, y + 6);
        doc.text('TOTAL', 158, y + 6);

        const totalQty = (challan.items || []).reduce((sum: number, it: any) => sum + Number(it.quantity || 1), 0);
        doc.setFont('helvetica', 'normal');
        doc.text(String(totalQty), 185, y + 6, { align: 'right' });

        y += 10;

        // TAX DETAILS ROW
        doc.rect(14, y, 91, 12);
        doc.rect(105, y, 91, 12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text("CONSIGNOR SALES / GST TAX NO. & DATE", 16, y + 4);
        doc.text("CONSIGNEE / SUBCONTRACTOR GST NO. & DATE", 107, y + 4);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(String(challan.consignorTaxNo || '-'), 16, y + 9);
        doc.text(String(challan.vendor?.gstNumber || '-'), 107, y + 9);

        y += 12;

        // VEHICLE / LR / FREIGHT ROW
        doc.rect(14, y, 70, 12);
        doc.rect(84, y, 70, 12);
        doc.rect(154, y, 42, 12);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('VEHICLE / DESPATCH THROUGH', 16, y + 4);
        doc.text('LR / RR NO. & DATE', 86, y + 4);
        doc.text('FREIGHT RS. TO PAY / PAID', 156, y + 4);

        doc.setFont('helvetica', 'normal');
        doc.text(String(challan.vehicleNo || '-'), 16, y + 9);
        doc.text(String(challan.lrNo || '-'), 86, y + 9);
        doc.text(String(challan.freightStatus || '-'), 156, y + 9);

        y += 12;

        // RECEIPT DETAILS & SIGNATURE ROW
        doc.rect(14, y, 91, 28);
        doc.rect(105, y, 91, 28);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('RECEIPT DETAILS', 16, y + 5);
        doc.text('FOR LARSEN & TOUBRO LIMITED CONSTRUCTION DIVISION', 107, y + 5);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.5);
        const dispatchAckNote = 'We have despatched the following goods. Kindly return the duplicate copy duly signed acknowledging receipt of goods.';
        const splitNote = doc.splitTextToSize(dispatchAckNote, 87);
        doc.text(splitNote, 16, y + 10);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        const receiverInfo = challan.receiverName ? `Receiver: ${challan.receiverName} (${challan.receiverMobile || '-'})` : 'MRN NO. | DATE | SIGNATURE OF RECEIVER';
        doc.text(receiverInfo, 16, y + 24);
        doc.text('AUTHORIZED SIGNATORY', 150, y + 24, { align: 'center' });

        y += 28;

        // REMARKS ROW
        doc.rect(14, y, 182, 14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('REMARKS', 16, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const remarksText = challan.remarks || challan.notes || 'No remarks provided.';
        doc.text(doc.splitTextToSize(remarksText, 175), 16, y + 10);

        y += 17;
    }

    // BOTTOM NOTICE & RED COPY DISTRIBUTION
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(String(challan.docReferenceCode || 'ECC-D&M/STR/906'), 14, y);
    doc.text('Registered Office : L & T House, Ballard Estate, Bombay - 400 038.', pageWidth / 2, y, { align: 'center' });

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text('COPY DISTRIBUTION:', 14, y);

    // Static Printable Checkboxes (Empty squares for manual marking post-print)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);

    // 1. CONSIGNEE Checkbox
    doc.rect(46, y - 2.5, 2.8, 2.8);
    doc.text('CONSIGNEE', 50, y);

    // 2. CONSIGNEE – CONSIGNOR Checkbox
    doc.rect(68, y - 2.5, 2.8, 2.8);
    doc.text('CONSIGNEE – CONSIGNOR', 72, y);

    // 3. GATE PASS (SECURITY - ACCOUNTS) Checkbox
    doc.rect(112, y - 2.5, 2.8, 2.8);
    doc.text('GATE PASS (SECURITY - ACCOUNTS)', 116, y);

    // 4. CONSIGNOR'S FILE Checkbox
    doc.rect(168, y - 2.5, 2.8, 2.8);
    doc.text("CONSIGNOR'S FILE", 172, y);
};

/**
 * Add Page Continuation Header to all pages > 1
 */
const addContinuationHeaders = (doc: any, challan: any) => {
    const totalPages = doc.internal.getNumberOfPages();
    const dcNoStr = formatDCNumber(challan.challanNumber);
    const dcDateStr = formatDateDDMMYYYY(challan.challanDate);

    for (let p = 2; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`DC No.: ${dcNoStr} | Date: ${dcDateStr} | Page ${p} of ${totalPages}`, 14, 10);
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 12, 196, 12);
        doc.setTextColor(0, 0, 0);
    }
};

/**
 * Generate Delivery Challan PDF matching L&T Construction reference
 */
export const generateDeliveryChallanPDF = async (challan: any, options: ChallanPdfOptions = { download: true }): Promise<any> => {
    const jsPDFLib = await loadJsPDF();
    const doc = new jsPDFLib.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    drawLnTHeader(doc, challan, false);

    // Items Table with Material Code Column
    const tableBody = (challan.items || []).map((item: any, idx: number) => {
        const matCode = item.materialCode || item.toolCode || `MAT-${String(item.toolId || '').slice(-5)}`;
        const desc = `${item.description || 'Tool Item'}\nID: ${item.toolId || ''}`;
        return [
            String(idx + 1),
            String(matCode),
            desc,
            String(item.quantity || 1),
            item.unit || 'NOS',
            item.rate ? `Rs. ${item.rate}` : '-'
        ];
    });

    doc.autoTable({
        startY: 81,
        head: [['SL. NO.', 'MATERIAL CODE', 'DESCRIPTION & QR', 'QUANTITY', 'UNIT', 'RATE RS.']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 7.5,
            cellPadding: 1.5,
            lineWidth: 0.3,
            lineColor: [0, 0, 0]
        },
        styles: {
            fontSize: 7.5,
            cellPadding: 2.5,
            lineWidth: 0.3,
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0]
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { halign: 'center', cellWidth: 32, fontStyle: 'bold' },
            2: { cellWidth: 78 },
            3: { halign: 'center', cellWidth: 22 },
            4: { halign: 'center', cellWidth: 16 },
            5: { halign: 'center', cellWidth: 22 }
        },
        margin: { left: 14, right: 14 }
    });

    const finalY = doc.lastAutoTable.finalY;
    drawLnTFooter(doc, challan, finalY, false);
    addContinuationHeaders(doc, challan);

    if (options.download !== false) {
        const filename = options.fileName || `${formatDCNumber(challan.challanNumber)}.pdf`;
        doc.save(filename);
    }

    return doc;
};

/**
 * Generate Return Challan PDF matching L&T Construction reference
 */
export const generateReturnChallanPDF = async (challan: any, options: ChallanPdfOptions = { download: true }): Promise<any> => {
    const jsPDFLib = await loadJsPDF();
    const doc = new jsPDFLib.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    drawLnTHeader(doc, challan, true);

    const tableBody = (challan.items || []).map((item: any, idx: number) => {
        const matCode = item.materialCode || item.toolCode || `MAT-${String(item.toolId || '').slice(-5)}`;
        const qrId = `QR: DSSDOP00${String(item.toolId || '').replace(/[^a-zA-Z0-9]/g, '')}`;
        return [
            String(idx + 1),
            String(matCode),
            qrId,
            item.description || 'Tool Item',
            item.unit || 'NOS',
            String(item.issuedQuantity || item.quantity || 1),
            String(item.returnedQuantity || (item.returnStatus === 'Returned' ? item.quantity : 0)),
            String(item.missingQuantity || (item.returnStatus === 'Missing' ? item.quantity : 0)),
            item.returnStatus || 'Returned – Good',
            item.remarks || '-'
        ];
    });

    doc.autoTable({
        startY: 81,
        head: [['SL. NO.', 'MAT. CODE', 'QR / ASSET ID', 'DESCRIPTION', 'UOM', 'ISSUED', 'RETURNED', 'MISSING', 'STATUS', 'REMARKS']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 7,
            lineWidth: 0.3,
            lineColor: [0, 0, 0]
        },
        styles: {
            fontSize: 7.5,
            cellPadding: 2,
            lineWidth: 0.3,
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0]
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'center', cellWidth: 20 },
            2: { cellWidth: 26 },
            3: { cellWidth: 38 },
            4: { halign: 'center', cellWidth: 12 },
            5: { halign: 'center', cellWidth: 14 },
            6: { halign: 'center', cellWidth: 14 },
            7: { halign: 'center', cellWidth: 14 },
            8: { halign: 'center', cellWidth: 18 },
            9: { cellWidth: 16 }
        },
        margin: { left: 14, right: 14 }
    });

    const finalY = doc.lastAutoTable.finalY;
    drawLnTFooter(doc, challan, finalY, true);
    addContinuationHeaders(doc, challan);

    if (options.download !== false) {
        const filename = options.fileName || `${challan.challanNumber || 'Return_Challan'}.pdf`;
        doc.save(filename);
    }

    return doc;
};

/**
 * Generate Store-to-Store Transfer Challan PDF matching L&T Construction standards
 */
export const generateTransferChallanPDF = async (challan: any, options: ChallanPdfOptions = { download: true }): Promise<any> => {
    const jsPDFLib = await loadJsPDF();
    const doc = new jsPDFLib.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // L&T Logo
    try {
        doc.addImage(LNT_LOGO_BASE64, 'PNG', 14, 7, 16, 16);
    } catch (e) {
        doc.setFillColor(14, 76, 146);
        doc.roundedRect(14, 10, 35, 10, 1.5, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('L&T Construction', 18, 16.5);
    }

    // Main Header Title
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Larsen & Toubro Limited, Construction', pageWidth / 2, 16, { align: 'center' });

    doc.setFontSize(12);
    doc.text('STORE-TO-STORE TOOL TRANSFER CHALLAN', pageWidth / 2, 22, { align: 'center' });

    // Header Box Frame (Y: 26 to 66)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(14, 26, 182, 40);

    // Vertical Divider (Y: 26 to 54)
    doc.line(100, 26, 100, 54);

    // Left Box: Source Store & Project
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('SOURCE STORE & PROJECT', 16, 31);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const srcStoreName = challan.sourceStore?.name || 'Source Store';
    const srcStoreCode = challan.sourceStore?.storeCode ? `(${challan.sourceStore.storeCode})` : '';
    const projName = challan.project?.name || 'Same Project';
    const srcLoc = challan.sourceStore?.location ? `Loc: ${challan.sourceStore.location}` : '';

    doc.text(`Store: ${srcStoreName} ${srcStoreCode}`, 16, 37, { maxWidth: 80 });
    doc.setFontSize(7.5);
    doc.text(`Project: ${projName}`, 16, 43, { maxWidth: 80 });
    if (srcLoc) doc.text(srcLoc, 16, 48, { maxWidth: 80 });

    // Right Box: Destination Store
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DESTINATION STORE (SAME PROJECT)', 102, 31);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const destStoreName = challan.destinationStore?.name || 'Destination Store';
    const destStoreCode = challan.destinationStore?.storeCode ? `(${challan.destinationStore.storeCode})` : '';
    const destLoc = challan.destinationStore?.location ? `Loc: ${challan.destinationStore.location}` : '';

    doc.text(`Store: ${destStoreName} ${destStoreCode}`, 102, 37, { maxWidth: 90 });
    doc.setFontSize(7.5);
    doc.text(`Project: ${projName}`, 102, 43, { maxWidth: 90 });
    if (destLoc) doc.text(destLoc, 102, 48, { maxWidth: 90 });

    // Divider Line at Y: 54
    doc.line(14, 54, 196, 54);

    // Meta Row (Y: 54 to 66)
    doc.line(60, 54, 60, 66);
    doc.line(110, 54, 110, 66);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('CHALLAN NO.', 37, 58, { align: 'center' });
    doc.text('TRANSFER DATE', 85, 58, { align: 'center' });
    doc.text('PREPARED / AUTHORIZED BY', 153, 58, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(formatDCNumber(challan.challanNumber), 37, 63, { align: 'center' });
    doc.text(formatDateDDMMYYYY(challan.challanDate), 85, 63, { align: 'center' });
    doc.text(String(challan.createdBy?.name || 'L&T Store Manager'), 153, 63, { align: 'center' });

    // Sub-banner notice
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 0, 0);
    doc.text('INTERNAL STORE-TO-STORE TRANSFER – TOOLS & EQUIPMENT WITHIN SAME PROJECT', pageWidth / 2, 70, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Items Table
    const tableBody = (challan.items || []).map((item: any, idx: number) => {
        const toolUid = item.toolId || `TOOL-${idx + 1}`;
        const desc = item.description || 'Tool Item';
        
        // Relevant specifications formatted
        const specList: string[] = [];
        if (item.toolCode) specList.push(`Code: ${item.toolCode}`);
        if (item.category) specList.push(`Type: ${item.category}`);
        if (item.capacity) specList.push(`Cap: ${item.capacity}`);
        if (item.safeWorkingLoad) specList.push(`SWL: ${item.safeWorkingLoad}`);
        if (item.serialNumber) specList.push(`S/N: ${item.serialNumber}`);
        if (item.makeYear) specList.push(`Make: ${item.makeYear}`);
        const specsStr = specList.length > 0 ? specList.join(' | ') : '-';

        return [
            String(idx + 1),
            String(toolUid),
            desc,
            specsStr,
            String(item.quantity || 1),
            item.unit || 'NOS',
            item.remarks || '-'
        ];
    });

    doc.autoTable({
        startY: 73,
        head: [['SL. NO.', 'TOOL ID / UID', 'DESCRIPTION', 'RELEVANT SPECIFICATIONS', 'QTY', 'UNIT', 'REMARKS']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 7.5,
            lineWidth: 0.3,
            lineColor: [0, 0, 0]
        },
        styles: {
            fontSize: 7.5,
            cellPadding: 2.5,
            lineWidth: 0.3,
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0]
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { halign: 'center', cellWidth: 32, fontStyle: 'bold' },
            2: { cellWidth: 44 },
            3: { cellWidth: 54 },
            4: { halign: 'center', cellWidth: 12 },
            5: { halign: 'center', cellWidth: 12 },
            6: { cellWidth: 16 }
        },
        margin: { left: 14, right: 14 }
    });

    let y = doc.lastAutoTable.finalY + 4;
    if (y > 220) {
        doc.addPage();
        y = 25;
    }

    // Total Count & Remarks Row
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);

    doc.rect(14, y, 140, 9);
    doc.rect(154, y, 42, 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TOTAL TRANSFERRED TOOLS COUNT', 16, y + 5.5);
    doc.text(String(challan.toolCount || (challan.items || []).length), 175, y + 5.5, { align: 'center' });

    y += 9;

    // Signature Block (Sender, Receiver, Authorized)
    doc.rect(14, y, 182, 30);
    doc.line(74, y, 74, y + 30);
    doc.line(134, y, 134, y + 30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('PREPARED / AUTHORIZED BY', 44, y + 6, { align: 'center' });
    doc.text('SENDER STORE KEEPER', 104, y + 6, { align: 'center' });
    doc.text('RECEIVER STORE KEEPER', 164, y + 6, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Name: ${challan.createdBy?.name || 'Store Admin'}`, 16, y + 25);
    doc.text(`Source: ${srcStoreName}`, 76, y + 25);
    doc.text(`Destination: ${destStoreName}`, 136, y + 25);

    y += 33;

    // Remarks Box
    doc.rect(14, y, 182, 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('TRANSFER REMARKS', 16, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const remText = challan.remarks || 'Store-to-Store Inter-Project Tool Transfer completed successfully.';
    doc.text(doc.splitTextToSize(remText, 175), 16, y + 9);

    addContinuationHeaders(doc, challan);

    if (options.download !== false) {
        const filename = options.fileName || `${formatDCNumber(challan.challanNumber)}.pdf`;
        doc.save(filename);
    }

    return doc;
};
