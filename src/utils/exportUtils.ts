import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { CalculationItem } from "../types";

/**
 * Downloads a canvas or DOM element as a high-resolution PNG image
 */
export async function exportElementAsPng(
  element: HTMLElement | HTMLCanvasElement,
  filename: string = "equation_result.png"
): Promise<void> {
  try {
    let dataUrl: string;

    if (element instanceof HTMLCanvasElement) {
      dataUrl = element.toDataURL("image/png");
    } else {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#0f172a", // Dark navy slate backdrop for export
        useCORS: true,
        logging: false,
      });
      dataUrl = canvas.toDataURL("image/png");
    }

    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Export PNG failed:", error);
  }
}

/**
 * Generates a clean PDF document for calculation history or single equation
 */
export function exportCalculationPdf(
  items: CalculationItem[],
  reportTitle: string = "AI Math Calculation Report",
  handwritingCanvas?: HTMLCanvasElement | null
): void {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    // Header Title
    doc.setFillColor(15, 23, 42); // Navy Dark slate
    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(reportTitle, margin, 14);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const dateStr = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    doc.text(`Generated on: ${dateStr}`, margin, 21);

    y = 36;

    // Include Canvas Image if provided (Handwritten equation report)
    if (handwritingCanvas) {
      try {
        const canvasDataUrl = handwritingCanvas.toDataURL("image/png");
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("Handwritten Canvas Snapshot:", margin, y);
        y += 6;

        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (handwritingCanvas.height / handwritingCanvas.width) * imgWidth;
        const cappedHeight = Math.min(imgHeight, 60);

        doc.addImage(canvasDataUrl, "PNG", margin, y, imgWidth, cappedHeight);
        y += cappedHeight + 10;
      } catch (err) {
        console.warn("Could not append canvas image to PDF", err);
      }
    }

    // List Calculations
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`Calculations Log (${items.length} items)`, margin, y);
    y += 8;

    if (items.length === 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 116, 139);
      doc.text("No calculation records found.", margin, y);
      doc.save(`${reportTitle.toLowerCase().replace(/\s+/g, "_")}.pdf`);
      return;
    }

    items.forEach((item, idx) => {
      // Check for page overflow
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      // Draw item box
      const boxHeight = item.steps && item.steps.length > 0 ? 28 + item.steps.length * 5 : 22;
      
      doc.setFillColor(248, 250, 252); // Light slate gray card
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, pageWidth - margin * 2, boxHeight, 2, 2, "FD");

      // Category badge
      doc.setFillColor(99, 102, 241); // Indigo
      doc.rect(margin, y, 3, boxHeight, "F");

      // Number & Type
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(99, 102, 241);
      const typeLabel = item.type.toUpperCase();
      const itemTime = new Date(item.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.text(`#${idx + 1}  [${typeLabel}]  -  ${itemTime}`, margin + 6, y + 6);

      // Title or Expression
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      const exprText = item.title ? `${item.title}: ${item.expression || ""}` : item.expression || "Query";
      doc.text(exprText, margin + 6, y + 12);

      // Result
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129); // Emerald Green
      doc.text(`= ${item.result}`, margin + 6, y + 18);

      // Steps if available
      let stepY = y + 23;
      if (item.steps && item.steps.length > 0) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        item.steps.slice(0, 5).forEach((step) => {
          doc.text(`• ${step}`, margin + 8, stepY);
          stepY += 4.5;
        });
      }

      y += boxHeight + 6;
    });

    // Save PDF
    const filename = `${reportTitle.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Failed to export PDF document.");
  }
}
