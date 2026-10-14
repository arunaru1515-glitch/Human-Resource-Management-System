import os
from pathlib import Path
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.core.config import settings
from app.models.payroll import Payroll
from app.models.user import Employee

MONTH_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

def generate_salary_slip_pdf(payroll: Payroll, employee: Employee) -> Path:
    """Generate professional PDF salary slip using ReportLab."""
    month_name = MONTH_NAMES[payroll.month] if 1 <= payroll.month <= 12 else str(payroll.month)
    file_name = f"SalarySlip_{employee.employee_code}_{payroll.year}_{payroll.month:02d}.pdf"
    file_path = settings.SALARY_SLIPS_DIR / file_name

    doc = SimpleDocTemplate(
        str(file_path),
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor("#1e3a8a"),  # Corporate Navy
        alignment=1  # Centered
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#64748b"),
        alignment=1
    )
    period_style = ParagraphStyle(
        'DocPeriod',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#0f172a"),
        alignment=1
    )
    header_col_style = ParagraphStyle(
        'HeaderCol',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )
    header_col_right = ParagraphStyle(
        'HeaderColRight',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        alignment=2,
        textColor=colors.white
    )
    cell_label = ParagraphStyle(
        'CellLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#334155")
    )
    cell_val = ParagraphStyle(
        'CellVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#0f172a")
    )
    amount_style = ParagraphStyle(
        'Amount',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        alignment=2,  # Right aligned
        textColor=colors.HexColor("#0f172a")
    )
    amount_bold = ParagraphStyle(
        'AmountBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        alignment=2,
        textColor=colors.HexColor("#0f172a")
    )

    elements = []

    # Elegant Corporate Header
    elements.append(Paragraph("ENTERPRISE HUMAN RESOURCE MANAGEMENT SYSTEM", title_style))
    elements.append(Paragraph("Corporate Workforce & Payroll Administration", subtitle_style))
    elements.append(Spacer(1, 3))
    elements.append(Paragraph(f"PAYSLIP FOR {month_name.upper()} {payroll.year}", period_style))
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1e3a8a"), spaceAfter=12))

    # Employee Information Card (Crisp 4-column layout)
    emp_info_data = [
        [
            Paragraph("<b>Employee Code:</b>", cell_label), Paragraph(employee.employee_code, cell_val),
            Paragraph("<b>Pay Period:</b>", cell_label), Paragraph(f"{month_name} {payroll.year}", cell_val)
        ],
        [
            Paragraph("<b>Employee Name:</b>", cell_label), Paragraph(employee.full_name, cell_val),
            Paragraph("<b>Total Working Days:</b>", cell_label), Paragraph(str(payroll.total_working_days), cell_val)
        ],
        [
            Paragraph("<b>Department:</b>", cell_label), Paragraph(employee.department, cell_val),
            Paragraph("<b>Days Worked:</b>", cell_label), Paragraph(f"{payroll.present_days:.1f}", cell_val)
        ],
        [
            Paragraph("<b>Designation:</b>", cell_label), Paragraph(employee.designation, cell_val),
            Paragraph("<b>Paid Leaves:</b>", cell_label), Paragraph(f"{payroll.approved_leave_days:.1f}", cell_val)
        ],
        [
            Paragraph("<b>Date of Joining:</b>", cell_label), Paragraph(str(employee.joining_date), cell_val),
            Paragraph("<b>Loss of Pay (LOP):</b>", cell_label), Paragraph(f"{payroll.lop_days:.1f} days", cell_val)
        ]
    ]

    emp_table = Table(emp_info_data, colWidths=[110, 160, 110, 150])
    emp_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#f8fafc")),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor("#f8fafc")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(emp_table)
    elements.append(Spacer(1, 14))

    # Earnings & Deductions Breakdown with Unified Navy Header
    breakdown_data = [
        [
            Paragraph("<b>EARNINGS</b>", header_col_style), Paragraph("<b>AMOUNT (INR)</b>", header_col_right),
            Paragraph("<b>DEDUCTIONS</b>", header_col_style), Paragraph("<b>AMOUNT (INR)</b>", header_col_right)
        ],
        [
            Paragraph("Basic Salary", cell_val), Paragraph(f"Rs. {payroll.basic_salary:,.2f}", amount_style),
            Paragraph("Loss of Pay (LOP)", cell_val), Paragraph(f"Rs. {payroll.lop_deduction:,.2f}", amount_style)
        ],
        [
            Paragraph("House Rent Allowance (HRA)", cell_val), Paragraph(f"Rs. {payroll.hra:,.2f}", amount_style),
            Paragraph("Income Tax / TDS", cell_val), Paragraph(f"Rs. {payroll.tax_deduction:,.2f}", amount_style)
        ],
        [
            Paragraph("Special & Other Allowances", cell_val), Paragraph(f"Rs. {payroll.allowances:,.2f}", amount_style),
            Paragraph("Other Deductions", cell_val), Paragraph(f"Rs. {payroll.other_deductions:,.2f}", amount_style)
        ],
        [
            Paragraph("<b>Total Gross Earnings</b>", cell_label), Paragraph(f"<b>Rs. {payroll.gross_salary:,.2f}</b>", amount_bold),
            Paragraph("<b>Total Deductions</b>", cell_label), Paragraph(f"<b>Rs. {payroll.total_deductions:,.2f}</b>", amount_bold)
        ]
    ]

    breakdown_table = Table(breakdown_data, colWidths=[160, 105, 160, 105])
    breakdown_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),  # Refined Corporate Navy Header
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#f1f5f9")), # Subtle Totals row
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#1e3a8a")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor("#1e3a8a")),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.HexColor("#94a3b8")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(breakdown_table)
    elements.append(Spacer(1, 12))

    # Net Pay - Clean, elegant corporate highlight box
    net_data = [
        [
            Paragraph("<b>NET TAKE-HOME SALARY:</b>", ParagraphStyle('NetLabel', fontName='Helvetica-Bold', fontSize=10.5, textColor=colors.HexColor("#1e3a8a"))),
            Paragraph(f"<b>Rs. {payroll.net_salary:,.2f}</b>", ParagraphStyle('NetVal', fontName='Helvetica-Bold', fontSize=12, alignment=2, textColor=colors.HexColor("#1e3a8a")))
        ]
    ]
    net_table = Table(net_data, colWidths=[300, 230])
    net_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f0f4fa")),  # Soft ice-blue tint
        ('BOX', (0, 0), (-1, -1), 1.25, colors.HexColor("#1e3a8a")),    # Navy border
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(net_table)
    elements.append(Spacer(1, 16))

    # Formal Footer & Signatory Block
    status_text = f"Status: {payroll.status.value}"
    if payroll.is_credited:
        status_text += f" | Payment Ref: {payroll.payment_reference or 'SIM-TXN-SUCCESS'}"

    footer_data = [
        [
            Paragraph(f"<b>{status_text}</b><br/>Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC<br/><font size=7 color='#64748b'>This is a system-generated payslip and does not require a physical signature.</font>", cell_val),
            Paragraph("<b>For Enterprise HRMS</b><br/><br/><br/><i>Authorized Signatory</i><br/><font size=7.5 color='#64748b'>HR & Payroll Operations</font>", ParagraphStyle('Sign', alignment=2, fontName='Helvetica', fontSize=8.5, leading=11))
        ]
    ]
    footer_table = Table(footer_data, colWidths=[330, 200])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(footer_table)

    doc.build(elements)
    return file_path
