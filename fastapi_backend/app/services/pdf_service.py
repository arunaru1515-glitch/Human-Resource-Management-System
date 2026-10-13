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
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#1e293b"),
        alignment=1  # Centered
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#64748b"),
        alignment=1
    )
    section_title = ParagraphStyle(
        'SectionTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0f172a")
    )
    cell_label = ParagraphStyle(
        'CellLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#475569")
    )
    cell_val = ParagraphStyle(
        'CellVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0f172a")
    )
    amount_style = ParagraphStyle(
        'Amount',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        alignment=2,  # Right aligned
        textColor=colors.HexColor("#0f172a")
    )
    amount_bold = ParagraphStyle(
        'AmountBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        alignment=2,
        textColor=colors.HexColor("#0f172a")
    )

    elements = []

    # Header
    elements.append(Paragraph("HUMAN RESOURCE MANAGEMENT SYSTEM", title_style))
    elements.append(Paragraph("Employee Payroll & Benefits Administration", subtitle_style))
    elements.append(Paragraph(f"<b>PAYSLIP FOR {month_name.upper()} {payroll.year}</b>", subtitle_style))
    elements.append(Spacer(1, 15))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563eb"), spaceAfter=15))

    # Employee Summary Grid
    emp_info_data = [
        [
            Paragraph("<b>Employee Code:</b>", cell_label), Paragraph(employee.employee_code, cell_val),
            Paragraph("<b>Pay Period:</b>", cell_label), Paragraph(f"{month_name} {payroll.year}", cell_val)
        ],
        [
            Paragraph("<b>Employee Name:</b>", cell_label), Paragraph(employee.full_name, cell_val),
            Paragraph("<b>Working Days:</b>", cell_label), Paragraph(str(payroll.total_working_days), cell_val)
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
            Paragraph("<b>LOP Days:</b>", cell_label), Paragraph(f"{payroll.lop_days:.1f}", cell_val)
        ]
    ]

    emp_table = Table(emp_info_data, colWidths=[110, 160, 110, 150])
    emp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(emp_table)
    elements.append(Spacer(1, 20))

    # Earnings & Deductions Breakdown
    breakdown_data = [
        [
            Paragraph("<b>EARNINGS</b>", cell_label), Paragraph("<b>AMOUNT (INR)</b>", amount_bold),
            Paragraph("<b>DEDUCTIONS</b>", cell_label), Paragraph("<b>AMOUNT (INR)</b>", amount_bold)
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
        ('BACKGROUND', (0, 0), (1, 0), colors.HexColor("#e0e7ff")),
        ('BACKGROUND', (2, 0), (3, 0), colors.HexColor("#fee2e2")),
        ('BACKGROUND', (0, -1), (1, -1), colors.HexColor("#f1f5f9")),
        ('BACKGROUND', (2, -1), (3, -1), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    elements.append(breakdown_table)
    elements.append(Spacer(1, 15))

    # Net Pay Banner
    net_data = [
        [
            Paragraph("<b>NET TAKE-HOME SALARY:</b>", ParagraphStyle('NetLabel', fontName='Helvetica-Bold', fontSize=11, textColor=colors.white)),
            Paragraph(f"<b>Rs. {payroll.net_salary:,.2f}</b>", ParagraphStyle('NetVal', fontName='Helvetica-Bold', fontSize=12, alignment=2, textColor=colors.white))
        ]
    ]
    net_table = Table(net_data, colWidths=[300, 230])
    net_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#1e3a8a")),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(net_table)
    elements.append(Spacer(1, 20))

    # Payment Status & Signature
    status_text = f"Status: {payroll.status.value}"
    if payroll.is_credited:
        status_text += f" | Credited Ref: {payroll.payment_reference or 'SIM-TXN-SUCCESS'}"

    footer_data = [
        [
            Paragraph(f"<i>{status_text}</i><br/>Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC", cell_val),
            Paragraph("<b>HR & Payroll Operations</b><br/><br/><i>Authorized Signatory</i>", ParagraphStyle('Sign', alignment=2, fontName='Helvetica', fontSize=9, leading=12))
        ]
    ]
    footer_table = Table(footer_data, colWidths=[280, 250])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(footer_table)

    doc.build(elements)
    return file_path
