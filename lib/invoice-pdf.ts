import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface InvoiceItem {
  name: string
  price: number
  discount?: number
  note?: string
}

interface InvoiceData {
  invoiceNumber: string
  date: string
  customerName: string
  customerPhone?: string
  staffName?: string
  services: InvoiceItem[]
  subtotal: number
  discountAmount: number
  tip: number
  grandTotal: number
  paymentMethod: 'CASH' | 'BANK'
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' })
  const pageW = doc.internal.pageSize.getWidth()

  // Colors
  const primary = '#059669'
  const gray = '#6B7280'
  const dark = '#1F2937'

  // Header
  doc.setFillColor('#FEF3C7')
  doc.rect(0, 0, pageW, 50, 'F')
  doc.setFontSize(20)
  doc.setTextColor('#92400E')
  doc.setFont('helvetica', 'bold')
  doc.text('MIN NAIL & HAIR', pageW / 2, 20, { align: 'center' })
  doc.setFontSize(9)
  doc.setTextColor('#A16207')
  doc.setFont('helvetica', 'normal')
  doc.text('TM14 Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức', pageW / 2, 28, { align: 'center' })
  doc.text('Hotline: 0934 323 878', pageW / 2, 34, { align: 'center' })

  // Invoice title
  doc.setFontSize(14)
  doc.setTextColor(dark)
  doc.setFont('helvetica', 'bold')
  doc.text('HOÁ ĐƠN THANH TOÁN', pageW / 2, 50, { align: 'center' })
  doc.line(30, 53, pageW - 30, 53)

  // Info rows
  let y = 60
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const infoRows = [
    { label: 'Số hoá đơn', value: data.invoiceNumber },
    { label: 'Ngày', value: data.date },
    { label: 'Khách hàng', value: data.customerName },
  ]
  if (data.customerPhone) infoRows.push({ label: 'SĐT', value: data.customerPhone })
  if (data.staffName) infoRows.push({ label: 'Nhân viên', value: data.staffName })

  infoRows.forEach((row) => {
    doc.setTextColor(gray)
    doc.text(row.label, 20, y)
    doc.setTextColor(dark)
    doc.text(': ' + row.value, 45, y)
    y += 6
  })

  // Services table
  y += 4
  const tableBody = data.services.map((svc) => {
    const finalPrice = svc.discount
      ? svc.price - Math.round(svc.price * (svc.discount / 100))
      : svc.price
    return [
      svc.note ? `${svc.name} (${svc.note})` : svc.name,
      '1',
      svc.price.toLocaleString('vi') + 'đ',
      svc.discount ? `${svc.discount}%` : '-',
      finalPrice.toLocaleString('vi') + 'đ',
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [['Dịch vụ', 'SL', 'Đơn giá', 'KM', 'Thành tiền']],
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [31, 41, 55],
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
    },
    margin: { left: 20, right: 20 },
  })

  // @ts-expect-error - lastAutoTable is set by autoTable
  const finalY = doc.lastAutoTable?.finalY || y + 40

  // Totals
  let ty = finalY + 8
  const leftX = pageW - 65
  const col1X = leftX + 30

  doc.setFontSize(9)
  const totalRows = [
    { label: 'Tạm tính', value: data.subtotal, color: dark },
    ...(data.discountAmount > 0 ? [{ label: 'Giảm giá', value: -data.discountAmount, color: '#DC2626' as string }] : []),
    ...(data.tip > 0 ? [{ label: 'Tiền Tip', value: data.tip, color: '#DB2777' as string }] : []),
  ]

  totalRows.forEach((row) => {
    doc.setTextColor(gray)
    doc.setFont('helvetica', 'normal')
    doc.text(row.label, leftX, ty)
    doc.setTextColor(row.color)
    doc.setFont('helvetica', 'bold')
    const valStr = (row.value >= 0 ? '' : '-') + Math.abs(row.value).toLocaleString('vi') + 'đ'
    doc.text(valStr, col1X, ty, { align: 'right' })
    ty += 6
  })

  // Grand total
  doc.setDrawColor(primary)
  doc.setLineWidth(0.5)
  doc.line(leftX, ty, pageW - 20, ty)
  ty += 6
  doc.setTextColor(dark)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Tổng thanh toán', leftX, ty)
  doc.setTextColor('#059669')
  doc.text(data.grandTotal.toLocaleString('vi') + 'đ', col1X, ty, { align: 'right' })

  // Payment method
  ty += 8
  doc.setFontSize(8)
  doc.setTextColor(gray)
  doc.setFont('helvetica', 'normal')
  doc.text(`Phương thức: ${data.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}`, leftX, ty)

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20
  doc.setDrawColor('#E5E7EB')
  doc.line(20, footerY, pageW - 20, footerY)
  doc.setFontSize(8)
  doc.setTextColor(gray)
  doc.setFont('helvetica', 'normal')
  doc.text('Cảm ơn quý khách! Hẹn gặp lại tại Min Nail & Hair.', pageW / 2, footerY + 6, { align: 'center' })
  doc.text('Hoá đơn này được tạo từ hệ thống Min Salon.', pageW / 2, footerY + 12, { align: 'center' })

  return doc
}

export function downloadInvoicePDF(data: InvoiceData) {
  const doc = generateInvoicePDF(data)
  doc.save(`hoa-don-${data.invoiceNumber}.pdf`)
}

export function shareInvoicePDF(data: InvoiceData) {
  const doc = generateInvoicePDF(data)
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
