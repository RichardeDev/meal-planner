import { jsPDF } from "jspdf"
import "jspdf-autotable"

// Add the missing type for jsPDF
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function generatePDF(title: string, headers: string[], data: string[][], filename: string) {
  const doc = new jsPDF()
  
  // Add title
  doc.setFontSize(18)
  doc.text(title, 14, 22)
  
  // Add table
  doc.autoTable({
    head: [headers],
    body: data,
    startY: 30,
  })
  
  // Save PDF
  doc.save(filename)
  
  return doc
}