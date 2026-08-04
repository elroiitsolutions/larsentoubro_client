declare global {
    interface Window {
        jspdf: any;
    }
}

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

    // L&T Logo Box
    doc.setFillColor(14, 76, 146); // L&T Navy Blue
    doc.roundedRect(14, 12, 35, 10, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('L&T Construction', 18, 18.5);

    // Main Company Title
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Larsen & Toubro Limited, Construction', pageWidth / 2, 28, { align: 'center' });

    // Top Border Box Frame (Y: 34 to 74)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(14, 34, 182, 40);

    // Vertical split between Left title/meta box and Right Consignee box (Y: 34 to 60)
    doc.line(110, 34, 110, 60);

    // Title inside Left Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const titleText = isReturn ? 'RETURN CHALLAN' : 'DELIVERY CHALLAN';
    doc.text(titleText, 62, 44, { align: 'center' });

    // Horizontal divider in Left Box for DC NO and DATE
    doc.line(14, 50, 110, 50);

    // Vertical line between DC NO and DATE
    doc.line(62, 50, 62, 60);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(isReturn ? 'RC NO.' : 'DC NO.', 16, 54);
    doc.text('DATE', 64, 54);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(String(challan.challanNumber || '-'), 16, 58.5);
    const dateStr = challan.challanDate
        ? new Date(challan.challanDate).toLocaleDateString()
        : new Date().toLocaleDateString();
    doc.text(dateStr, 64, 58.5);

    // Consignee Right Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(isReturn ? 'CONSIGNEE (STORE)' : 'CONSIGNEE (VENDOR)', 112, 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const vendorName = challan.vendor?.name || 'Authorized Vendor';
    const vendorAddr = challan.vendor?.address || '';
    const vendorCode = challan.vendor?.vendorCode || 'UJ - 0002';

    if (isReturn) {
        doc.text('L&T Construction Site Store', 112, 44);
        doc.setFontSize(8);
        doc.text(`Return from: ${vendorName}`, 112, 50);
    } else {
        doc.text(vendorName, 112, 44);
        if (vendorAddr) {
            doc.setFontSize(7.5);
            const addrLines = doc.splitTextToSize(vendorAddr, 80);
            doc.text(addrLines, 112, 49);
        }
    }

    // Horizontal divider line across full box at Y: 60
    doc.line(14, 60, 196, 60);

    // TRN CD / ACCOUNTING CENTRE ROW (Y: 60 to 74)
    doc.line(30, 60, 30, 74);
    doc.line(60, 60, 60, 74);
    doc.line(82, 60, 82, 74);
    doc.line(105, 60, 105, 74);
    doc.line(132, 60, 132, 74);
    doc.line(168, 60, 168, 74);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text('TRN CD', 22, 64, { align: 'center' });
    doc.text('SENDING CENTRE', 45, 64, { align: 'center' });
    doc.text('M. R. NO.', 71, 64, { align: 'center' });
    doc.text('M. R. DATE', 93.5, 64, { align: 'center' });
    doc.text('STOCK TYPE', 118.5, 64, { align: 'center' });

    const col6Label = isReturn ? 'CONSIGNEE / SITE CODE NO.' : 'VENDOR CODE';
    doc.setFontSize(isReturn ? 5.0 : 5.8);
    doc.text(col6Label, 150, 64, { align: 'center' });

    doc.setFontSize(5.8);
    doc.text('E-WAY BILL NO.', 182, 64, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(isReturn ? 'RET' : 'M 25', 22, 71, { align: 'center' });
    doc.text('STR-01', 45, 71, { align: 'center' });
    doc.text('-', 71, 71, { align: 'center' });
    doc.text('-', 93.5, 71, { align: 'center' });
    doc.text('CAPTIVE', 118.5, 71, { align: 'center' });
    doc.text(String(vendorCode), 150, 71, { align: 'center' });
    doc.text(String(challan.ewayBillNo || '-'), 182, 71, { align: 'center' });

    // Italic note below box
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    const noteText = isReturn
        ? 'We have returned the following goods. Kindly acknowledge receipt of returned goods.'
        : 'We have despatched the following goods. Kindly return the duplicate copy duly signed acknowledging receipt of goods';
    doc.text(noteText, pageWidth / 2, 79, { align: 'center' });
};

/**
 * Draws L&T Construction Footer, Signatures, and Copy Distribution Notice
 */
const drawLnTFooter = (doc: any, challan: any, finalY: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = finalY + 4;

    // Ensure we don't overflow bottom of page
    if (y > 220) {
        doc.addPage();
        y = 25;
    }

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);

    // GATE PASS APPROVED / TOTAL ROW
    doc.rect(14, y, 140, 10);
    doc.rect(154, y, 42, 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('GATE PASS COPY APPROVED BY', 50, y + 6);
    doc.text('TOTAL', 158, y + 6);

    const totalQty = (challan.items || []).reduce((sum: number, it: any) => sum + Number(it.quantity || 1), 0);
    doc.setFont('helvetica', 'normal');
    doc.text(String(totalQty), 185, y + 6, { align: 'right' });

    y += 10;

    // TAX & VEHICLE DETAILS ROW (12mm height)
    doc.rect(14, y, 91, 12);
    doc.rect(105, y, 91, 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text("CONSIGNOR'S SALES TAX NO. & DATE", 16, y + 4);
    doc.text("CONSIGNEE'S SALES TAX / GST NO. & DATE", 107, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('27AAACL0140P1Z0', 16, y + 9);
    doc.text(String(challan.vendor?.gstNumber || '-'), 107, y + 9);

    y += 12;

    // VEHICLE / LR / FREIGHT ROW (12mm height)
    doc.rect(14, y, 70, 12);
    doc.rect(84, y, 70, 12);
    doc.rect(154, y, 42, 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('VEHICLE / PATCH THROUGH', 16, y + 4);
    doc.text('LR / RR NO. & DATE', 86, y + 4);
    doc.text('FREIGHT RS. TO PAY / PAID', 156, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.text(String(challan.vehicleNo || '-'), 16, y + 9);
    doc.text(String(challan.lrNo || '-'), 86, y + 9);
    doc.text('PAID', 156, y + 9);

    y += 12;

    // RECEIPT DETAILS & L&T SIGNATURE ROW (30mm height)
    doc.rect(14, y, 91, 30);
    doc.rect(105, y, 91, 30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('RECEIPT DETAILS', 16, y + 5);
    doc.text('FOR LARSEN & TOUBRO LIMITED CONSTRUCTION DIVISION', 107, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('(RMN NO.)         (DATE)         (SIGNATURE OF RECEIVER)', 16, y + 27);
    doc.text('AUTHORIZED SIGNATORY', 150, y + 27, { align: 'center' });

    y += 30;

    // REMARKS ROW (16mm height)
    doc.rect(14, y, 182, 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('REMARKS', 16, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const remarksText = challan.remarks || challan.notes || 'No remarks provided.';
    const remarksLines = doc.splitTextToSize(remarksText, 175);
    doc.text(remarksLines, 16, y + 10);

    y += 19;

    // BOTTOM NOTICE & RED COPY DISTRIBUTION
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('D&M/STR/906', 14, y);
    doc.text('Registered Office : L & T House, Ballard Estate, Bombay - 400 038.', pageWidth / 2, y, { align: 'center' });

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('COPY DISTRIBUTION', 14, y);

    doc.setTextColor(204, 0, 0); // L&T Red Accent
    doc.text('CONSIGNEE   |   CONSIGNEE - CONSIGNOR   |   GATE PASS (SECURITY - ACCOUNTS)   |   CONSIGNOR\'S FILE', 52, y);
    doc.setTextColor(0, 0, 0);
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

    // Items Table
    const tableBody = (challan.items || []).map((item: any, idx: number) => {
        const toolCodeStr = item.toolCode ? `\nCode: ${item.toolCode}` : '';
        const desc = `${item.description || 'Tool Item'}\nQR: DSSDOP00${String(item.toolId || '').replace(/[^a-zA-Z0-9]/g, '')}${toolCodeStr}`;
        return [
            String(idx + 1),
            desc,
            String(item.quantity || 1),
            item.unit || 'NOS',
            item.rate ? `Rs. ${item.rate}` : ''
        ];
    });

    doc.autoTable({
        startY: 83,
        head: [['SL. NO.', 'DESCRIPTION', 'QUANTITY', 'UNIT', 'RATE RS.']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            lineWidth: 0.3,
            lineColor: [0, 0, 0]
        },
        styles: {
            fontSize: 9,
            cellPadding: 3,
            lineWidth: 0.3,
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0]
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 16 },
            1: { cellWidth: 104 },
            2: { halign: 'center', cellWidth: 22 },
            3: { halign: 'center', cellWidth: 18 },
            4: { halign: 'right', cellWidth: 22 }
        },
        margin: { left: 14, right: 14 }
    });

    const finalY = doc.lastAutoTable.finalY;
    drawLnTFooter(doc, challan, finalY);

    if (options.download !== false) {
        const filename = options.fileName || `${challan.challanNumber || 'Delivery_Challan'}.pdf`;
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
        const statusTag = item.returnStatus === 'Missing' ? ' [MISSING]' : '';
        const desc = `${item.description || 'Tool Item'}${statusTag}\nQR: DSSDOP00${String(item.toolId || '').replace(/[^a-zA-Z0-9]/g, '')}`;
        return [
            String(idx + 1),
            desc,
            String(item.quantity || 1),
            item.unit || 'NOS',
            item.returnStatus || 'Returned'
        ];
    });

    doc.autoTable({
        startY: 83,
        head: [['SL. NO.', 'DESCRIPTION', 'QUANTITY', 'UNIT', 'STATUS']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            lineWidth: 0.3,
            lineColor: [0, 0, 0]
        },
        styles: {
            fontSize: 9,
            cellPadding: 3,
            lineWidth: 0.3,
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0]
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 16 },
            1: { cellWidth: 104 },
            2: { halign: 'center', cellWidth: 22 },
            3: { halign: 'center', cellWidth: 18 },
            4: { halign: 'center', cellWidth: 22 }
        },
        margin: { left: 14, right: 14 }
    });

    const finalY = doc.lastAutoTable.finalY;
    drawLnTFooter(doc, challan, finalY);

    if (options.download !== false) {
        const filename = options.fileName || `${challan.challanNumber || 'Return_Challan'}.pdf`;
        doc.save(filename);
    }

    return doc;
};
