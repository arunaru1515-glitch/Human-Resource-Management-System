from django.db import models

class SharedUser(models.Model):
    id = models.IntegerField(primary_key=True)
    email = models.CharField(max_length=255, unique=True)
    hashed_password = models.CharField(max_length=255)
    role = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'users'
        verbose_name = 'HRMS User Account'
        verbose_name_plural = 'HRMS User Accounts'

    def __str__(self):
        return f"{self.email} ({self.role})"


class SharedEmployee(models.Model):
    id = models.IntegerField(primary_key=True)
    user = models.ForeignKey(SharedUser, on_delete=models.DO_NOTHING, db_column='user_id')
    employee_code = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, null=True, blank=True)
    department = models.CharField(max_length=100)
    designation = models.CharField(max_length=100)
    joining_date = models.DateField()
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    basic_salary = models.FloatField(default=0.0)
    hra = models.FloatField(default=0.0)
    allowances = models.FloatField(default=0.0)
    deductions = models.FloatField(default=0.0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'employees'
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_code})"

    @property
    def gross_salary(self):
        return round(self.basic_salary + self.hra + self.allowances, 2)


class SharedEmployeeDocument(models.Model):
    id = models.IntegerField(primary_key=True)
    employee = models.ForeignKey(SharedEmployee, on_delete=models.DO_NOTHING, db_column='employee_id')
    title = models.CharField(max_length=150)
    document_type = models.CharField(max_length=50)
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    file_size = models.IntegerField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'employee_documents'
        verbose_name = 'Employee Document'
        verbose_name_plural = 'Employee Documents'

    def __str__(self):
        return f"{self.title} - {self.employee.employee_code}"


class SharedAttendance(models.Model):
    id = models.IntegerField(primary_key=True)
    employee = models.ForeignKey(SharedEmployee, on_delete=models.DO_NOTHING, db_column='employee_id')
    date = models.DateField()
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    working_hours = models.FloatField(default=0.0)
    status = models.CharField(max_length=50)
    is_override = models.BooleanField(default=False)
    override_reason = models.CharField(max_length=255, null=True, blank=True)
    overridden_by_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'attendance'
        verbose_name = 'Attendance Record'
        verbose_name_plural = 'Attendance Records'

    def __str__(self):
        return f"{self.employee.employee_code} - {self.date} ({self.status})"


class SharedLeaveRequest(models.Model):
    id = models.IntegerField(primary_key=True)
    employee = models.ForeignKey(SharedEmployee, on_delete=models.DO_NOTHING, db_column='employee_id')
    leave_type = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.FloatField()
    reason = models.CharField(max_length=500)
    status = models.CharField(max_length=50)
    is_lop = models.BooleanField(default=False)
    reviewed_by_id = models.IntegerField(null=True, blank=True)
    reviewer_comment = models.CharField(max_length=255, null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'leave_requests'
        verbose_name = 'Leave Request'
        verbose_name_plural = 'Leave Requests'

    def __str__(self):
        return f"{self.employee.employee_code} - {self.leave_type} ({self.status})"


class SharedLeaveBalance(models.Model):
    id = models.IntegerField(primary_key=True)
    employee = models.ForeignKey(SharedEmployee, on_delete=models.DO_NOTHING, db_column='employee_id')
    year = models.IntegerField()
    casual_allocated = models.FloatField(default=12.0)
    casual_used = models.FloatField(default=0.0)
    sick_allocated = models.FloatField(default=10.0)
    sick_used = models.FloatField(default=0.0)
    paid_allocated = models.FloatField(default=15.0)
    paid_used = models.FloatField(default=0.0)
    lop_days = models.FloatField(default=0.0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'leave_balances'
        verbose_name = 'Leave Balance'
        verbose_name_plural = 'Leave Balances'

    def __str__(self):
        return f"{self.employee.employee_code} - {self.year}"


class SharedPayroll(models.Model):
    id = models.IntegerField(primary_key=True)
    employee = models.ForeignKey(SharedEmployee, on_delete=models.DO_NOTHING, db_column='employee_id')
    month = models.IntegerField()
    year = models.IntegerField()
    total_working_days = models.IntegerField(default=30)
    present_days = models.FloatField(default=0.0)
    approved_leave_days = models.FloatField(default=0.0)
    lop_days = models.FloatField(default=0.0)
    basic_salary = models.FloatField(default=0.0)
    hra = models.FloatField(default=0.0)
    allowances = models.FloatField(default=0.0)
    gross_salary = models.FloatField(default=0.0)
    lop_deduction = models.FloatField(default=0.0)
    tax_deduction = models.FloatField(default=0.0)
    other_deductions = models.FloatField(default=0.0)
    total_deductions = models.FloatField(default=0.0)
    net_salary = models.FloatField(default=0.0)
    status = models.CharField(max_length=50)
    is_locked = models.BooleanField(default=False)
    is_credited = models.BooleanField(default=False)
    credited_at = models.DateTimeField(null=True, blank=True)
    payment_reference = models.CharField(max_length=100, null=True, blank=True)
    notes = models.CharField(max_length=255, null=True, blank=True)
    processed_by_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'payrolls'
        verbose_name = 'Payroll Record'
        verbose_name_plural = 'Payroll Records'

    def __str__(self):
        return f"{self.employee.employee_code} - {self.month}/{self.year} (Net: Rs {self.net_salary})"


class SharedSalarySlip(models.Model):
    id = models.IntegerField(primary_key=True)
    payroll = models.ForeignKey(SharedPayroll, on_delete=models.DO_NOTHING, db_column='payroll_id')
    employee = models.ForeignKey(SharedEmployee, on_delete=models.DO_NOTHING, db_column='employee_id')
    file_path = models.CharField(max_length=500)
    file_name = models.CharField(max_length=255)
    download_count = models.IntegerField(default=0)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'salary_slips'
        verbose_name = 'Salary Slip'
        verbose_name_plural = 'Salary Slips'

    def __str__(self):
        return f"{self.file_name}"


class SharedAuditLog(models.Model):
    id = models.IntegerField(primary_key=True)
    user_id = models.IntegerField(null=True, blank=True)
    user_email = models.CharField(max_length=255, null=True, blank=True)
    action = models.CharField(max_length=100)
    entity = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=50, null=True, blank=True)
    details = models.TextField(null=True, blank=True)
    ip_address = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'audit_logs'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'

    def __str__(self):
        return f"[{self.created_at}] {self.action} by {self.user_email}"


class SharedNotification(models.Model):
    id = models.IntegerField(primary_key=True)
    user = models.ForeignKey(SharedUser, on_delete=models.DO_NOTHING, db_column='user_id')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=50)
    is_read = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=True)
    email_recipient = models.CharField(max_length=255, null=True, blank=True)
    email_subject = models.CharField(max_length=255, null=True, blank=True)
    email_log = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f"{self.title} to {self.user.email}"
