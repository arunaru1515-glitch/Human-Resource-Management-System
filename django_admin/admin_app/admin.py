from django.contrib import admin
from django.utils.html import format_html
from .models import (
    SharedUser,
    SharedEmployee,
    SharedEmployeeDocument,
    SharedAttendance,
    SharedLeaveRequest,
    SharedLeaveBalance,
    SharedPayroll,
    SharedSalarySlip,
    SharedAuditLog,
    SharedNotification,
)

class DocumentInline(admin.TabularInline):
    model = SharedEmployeeDocument
    extra = 0
    readonly_fields = ('title', 'document_type', 'file_name', 'file_size', 'uploaded_at')

@admin.register(SharedEmployee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        'employee_code',
        'first_name',
        'last_name',
        'department',
        'designation',
        'joining_date',
        'basic_salary',
        'is_active',
    )
    list_filter = ('department', 'designation', 'is_active', 'joining_date')
    search_fields = ('employee_code', 'first_name', 'last_name', 'department', 'designation')
    inlines = [DocumentInline]

@admin.register(SharedAttendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = (
        'employee',
        'date',
        'check_in_time',
        'check_out_time',
        'working_hours',
        'status',
        'is_override',
    )
    list_filter = ('status', 'is_override', 'date')
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_code')
    actions = ['mark_present_override']

    @admin.action(description="Override selected records to PRESENT (8 hrs)")
    def mark_present_override(self, request, queryset):
        queryset.update(status='PRESENT', working_hours=8.0, is_override=True, override_reason='Admin bulk override')

@admin.register(SharedLeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = (
        'employee',
        'leave_type',
        'start_date',
        'end_date',
        'total_days',
        'status',
        'is_lop',
        'applied_at',
    )
    list_filter = ('status', 'leave_type', 'is_lop', 'start_date')
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_code', 'reason')
    actions = ['approve_leaves', 'reject_leaves']

    @admin.action(description="Approve selected leave requests")
    def approve_leaves(self, request, queryset):
        queryset.update(status='APPROVED', reviewer_comment='Approved via Django Admin')

    @admin.action(description="Reject selected leave requests")
    def reject_leaves(self, request, queryset):
        queryset.update(status='REJECTED', reviewer_comment='Rejected via Django Admin')

@admin.register(SharedLeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = (
        'employee',
        'year',
        'casual_allocated',
        'casual_used',
        'sick_allocated',
        'sick_used',
        'paid_allocated',
        'paid_used',
        'lop_days',
    )
    list_filter = ('year',)
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_code')

@admin.register(SharedPayroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = (
        'employee',
        'month',
        'year',
        'gross_salary',
        'lop_days',
        'lop_deduction',
        'total_deductions',
        'net_salary',
        'status',
        'is_locked',
        'is_credited',
    )
    list_filter = ('status', 'is_locked', 'is_credited', 'year', 'month')
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_code')
    actions = ['lock_payroll', 'simulate_salary_credit']

    @admin.action(description="Lock selected payrolls")
    def lock_payroll(self, request, queryset):
        queryset.update(is_locked=True, status='LOCKED')

    @admin.action(description="Simulate salary credit for selected payrolls")
    def simulate_salary_credit(self, request, queryset):
        queryset.update(is_credited=True, status='PAID', is_locked=True)

@admin.register(SharedSalarySlip)
class SalarySlipAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'employee', 'download_count', 'generated_at')
    search_fields = ('file_name', 'employee__employee_code')

@admin.register(SharedAuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'action', 'entity', 'user_email', 'details', 'ip_address')
    list_filter = ('action', 'entity', 'created_at')
    search_fields = ('action', 'entity', 'user_email', 'details')
    readonly_fields = ('user_id', 'user_email', 'action', 'entity', 'entity_id', 'details', 'ip_address', 'created_at')

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(SharedNotification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'notification_type', 'is_read', 'email_sent', 'created_at')
    list_filter = ('notification_type', 'is_read', 'email_sent', 'created_at')
    search_fields = ('title', 'message', 'email_recipient')
