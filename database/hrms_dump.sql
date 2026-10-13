BEGIN TRANSACTION;
CREATE TABLE attendance (
	id INTEGER NOT NULL, 
	employee_id INTEGER NOT NULL, 
	date DATE NOT NULL, 
	check_in_time DATETIME, 
	check_out_time DATETIME, 
	working_hours FLOAT NOT NULL, 
	status VARCHAR(8) NOT NULL, 
	is_override BOOLEAN NOT NULL, 
	override_reason VARCHAR(255), 
	overridden_by_id INTEGER, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT unique_employee_attendance_date UNIQUE (employee_id, date), 
	FOREIGN KEY(employee_id) REFERENCES employees (id) ON DELETE CASCADE, 
	FOREIGN KEY(overridden_by_id) REFERENCES users (id) ON DELETE SET NULL
);
INSERT INTO "attendance" VALUES(1,4,'2026-10-13','2026-10-13 07:43:47.189706','2026-10-13 07:46:43.777576',0.05,'HALF_DAY',0,NULL,NULL,'2026-10-13 07:43:47.194209','2026-10-13 07:46:43.782574');
CREATE TABLE audit_logs (
	id INTEGER NOT NULL, 
	user_id INTEGER, 
	user_email VARCHAR(255), 
	action VARCHAR(100) NOT NULL, 
	entity VARCHAR(100) NOT NULL, 
	entity_id VARCHAR(50), 
	details TEXT, 
	ip_address VARCHAR(50), 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id)
);
INSERT INTO "audit_logs" VALUES(1,1,'admin@hrms.com','USER_LOGIN','User','1','Successful login for admin@hrms.com (Role: ADMIN)','127.0.0.1','2026-10-13 07:26:06.965581');
INSERT INTO "audit_logs" VALUES(2,1,'admin@hrms.com','USER_LOGIN','User','1','Successful login for admin@hrms.com (Role: ADMIN)','127.0.0.1','2026-10-13 07:34:54.555128');
INSERT INTO "audit_logs" VALUES(3,1,'admin@hrms.com','EMPLOYEE_ONBOARDED','Employee','4','Onboarded Shyam Connor (EMP-004) into Engineering','127.0.0.1','2026-10-13 07:38:46.035507');
INSERT INTO "audit_logs" VALUES(4,4,'shyam@hrms.com','USER_LOGIN','User','4','Successful login for shyam@hrms.com (Role: EMPLOYEE)','127.0.0.1','2026-10-13 07:42:58.865724');
INSERT INTO "audit_logs" VALUES(5,4,'shyam@hrms.com','ATTENDANCE_CHECK_IN','Attendance','1','Shyam Connor checked in at 07:43:47','127.0.0.1','2026-10-13 07:43:47.212512');
INSERT INTO "audit_logs" VALUES(6,4,'shyam@hrms.com','ATTENDANCE_CHECK_OUT','Attendance','1','Shyam Connor checked out at 07:46:43 (Worked: 0.05 hrs)','127.0.0.1','2026-10-13 07:46:43.808688');
INSERT INTO "audit_logs" VALUES(7,4,'shyam@hrms.com','LEAVE_APPLIED','LeaveRequest','1','Shyam Connor applied for 2.0 days CASUAL leave (LOP: False)','127.0.0.1','2026-10-13 07:49:38.475458');
INSERT INTO "audit_logs" VALUES(8,2,'hr@hrms.com','USER_LOGIN','User','2','Successful login for hr@hrms.com (Role: HR)','127.0.0.1','2026-10-13 08:06:52.668823');
INSERT INTO "audit_logs" VALUES(9,2,'hr@hrms.com','PAYROLL_GENERATED','Payroll',NULL,'Processed payroll for 1 employees for 10/2026','127.0.0.1','2026-10-13 08:07:25.156145');
INSERT INTO "audit_logs" VALUES(10,2,'hr@hrms.com','SALARY_SLIP_DOWNLOADED','SalarySlip','1','Downloaded salary slip for Shyam Connor (10/2026)','127.0.0.1','2026-10-13 08:08:30.348548');
CREATE TABLE "auth_group" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "name" varchar(150) NOT NULL UNIQUE);
CREATE TABLE "auth_group_permissions" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "group_id" integer NOT NULL REFERENCES "auth_group" ("id") DEFERRABLE INITIALLY DEFERRED, "permission_id" integer NOT NULL REFERENCES "auth_permission" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE TABLE "auth_permission" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "content_type_id" integer NOT NULL REFERENCES "django_content_type" ("id") DEFERRABLE INITIALLY DEFERRED, "codename" varchar(100) NOT NULL, "name" varchar(255) NOT NULL);
INSERT INTO "auth_permission" VALUES(1,1,'add_logentry','Can add log entry');
INSERT INTO "auth_permission" VALUES(2,1,'change_logentry','Can change log entry');
INSERT INTO "auth_permission" VALUES(3,1,'delete_logentry','Can delete log entry');
INSERT INTO "auth_permission" VALUES(4,1,'view_logentry','Can view log entry');
INSERT INTO "auth_permission" VALUES(5,2,'add_permission','Can add permission');
INSERT INTO "auth_permission" VALUES(6,2,'change_permission','Can change permission');
INSERT INTO "auth_permission" VALUES(7,2,'delete_permission','Can delete permission');
INSERT INTO "auth_permission" VALUES(8,2,'view_permission','Can view permission');
INSERT INTO "auth_permission" VALUES(9,3,'add_group','Can add group');
INSERT INTO "auth_permission" VALUES(10,3,'change_group','Can change group');
INSERT INTO "auth_permission" VALUES(11,3,'delete_group','Can delete group');
INSERT INTO "auth_permission" VALUES(12,3,'view_group','Can view group');
INSERT INTO "auth_permission" VALUES(13,4,'add_user','Can add user');
INSERT INTO "auth_permission" VALUES(14,4,'change_user','Can change user');
INSERT INTO "auth_permission" VALUES(15,4,'delete_user','Can delete user');
INSERT INTO "auth_permission" VALUES(16,4,'view_user','Can view user');
INSERT INTO "auth_permission" VALUES(17,5,'add_contenttype','Can add content type');
INSERT INTO "auth_permission" VALUES(18,5,'change_contenttype','Can change content type');
INSERT INTO "auth_permission" VALUES(19,5,'delete_contenttype','Can delete content type');
INSERT INTO "auth_permission" VALUES(20,5,'view_contenttype','Can view content type');
INSERT INTO "auth_permission" VALUES(21,6,'add_session','Can add session');
INSERT INTO "auth_permission" VALUES(22,6,'change_session','Can change session');
INSERT INTO "auth_permission" VALUES(23,6,'delete_session','Can delete session');
INSERT INTO "auth_permission" VALUES(24,6,'view_session','Can view session');
INSERT INTO "auth_permission" VALUES(25,7,'add_shareduser','Can add User');
INSERT INTO "auth_permission" VALUES(26,7,'change_shareduser','Can change User');
INSERT INTO "auth_permission" VALUES(27,7,'delete_shareduser','Can delete User');
INSERT INTO "auth_permission" VALUES(28,7,'view_shareduser','Can view User');
INSERT INTO "auth_permission" VALUES(29,8,'add_sharedemployee','Can add Employee');
INSERT INTO "auth_permission" VALUES(30,8,'change_sharedemployee','Can change Employee');
INSERT INTO "auth_permission" VALUES(31,8,'delete_sharedemployee','Can delete Employee');
INSERT INTO "auth_permission" VALUES(32,8,'view_sharedemployee','Can view Employee');
INSERT INTO "auth_permission" VALUES(33,9,'add_sharedemployeedocument','Can add Employee Document');
INSERT INTO "auth_permission" VALUES(34,9,'change_sharedemployeedocument','Can change Employee Document');
INSERT INTO "auth_permission" VALUES(35,9,'delete_sharedemployeedocument','Can delete Employee Document');
INSERT INTO "auth_permission" VALUES(36,9,'view_sharedemployeedocument','Can view Employee Document');
INSERT INTO "auth_permission" VALUES(37,10,'add_sharedattendance','Can add Attendance Record');
INSERT INTO "auth_permission" VALUES(38,10,'change_sharedattendance','Can change Attendance Record');
INSERT INTO "auth_permission" VALUES(39,10,'delete_sharedattendance','Can delete Attendance Record');
INSERT INTO "auth_permission" VALUES(40,10,'view_sharedattendance','Can view Attendance Record');
INSERT INTO "auth_permission" VALUES(41,11,'add_sharedleaverequest','Can add Leave Request');
INSERT INTO "auth_permission" VALUES(42,11,'change_sharedleaverequest','Can change Leave Request');
INSERT INTO "auth_permission" VALUES(43,11,'delete_sharedleaverequest','Can delete Leave Request');
INSERT INTO "auth_permission" VALUES(44,11,'view_sharedleaverequest','Can view Leave Request');
INSERT INTO "auth_permission" VALUES(45,12,'add_sharedleavebalance','Can add Leave Balance');
INSERT INTO "auth_permission" VALUES(46,12,'change_sharedleavebalance','Can change Leave Balance');
INSERT INTO "auth_permission" VALUES(47,12,'delete_sharedleavebalance','Can delete Leave Balance');
INSERT INTO "auth_permission" VALUES(48,12,'view_sharedleavebalance','Can view Leave Balance');
INSERT INTO "auth_permission" VALUES(49,13,'add_sharedpayroll','Can add Payroll Record');
INSERT INTO "auth_permission" VALUES(50,13,'change_sharedpayroll','Can change Payroll Record');
INSERT INTO "auth_permission" VALUES(51,13,'delete_sharedpayroll','Can delete Payroll Record');
INSERT INTO "auth_permission" VALUES(52,13,'view_sharedpayroll','Can view Payroll Record');
INSERT INTO "auth_permission" VALUES(53,14,'add_sharedsalaryslip','Can add Salary Slip');
INSERT INTO "auth_permission" VALUES(54,14,'change_sharedsalaryslip','Can change Salary Slip');
INSERT INTO "auth_permission" VALUES(55,14,'delete_sharedsalaryslip','Can delete Salary Slip');
INSERT INTO "auth_permission" VALUES(56,14,'view_sharedsalaryslip','Can view Salary Slip');
INSERT INTO "auth_permission" VALUES(57,15,'add_sharedauditlog','Can add Audit Log');
INSERT INTO "auth_permission" VALUES(58,15,'change_sharedauditlog','Can change Audit Log');
INSERT INTO "auth_permission" VALUES(59,15,'delete_sharedauditlog','Can delete Audit Log');
INSERT INTO "auth_permission" VALUES(60,15,'view_sharedauditlog','Can view Audit Log');
INSERT INTO "auth_permission" VALUES(61,16,'add_sharednotification','Can add Notification');
INSERT INTO "auth_permission" VALUES(62,16,'change_sharednotification','Can change Notification');
INSERT INTO "auth_permission" VALUES(63,16,'delete_sharednotification','Can delete Notification');
INSERT INTO "auth_permission" VALUES(64,16,'view_sharednotification','Can view Notification');
CREATE TABLE "auth_user" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "password" varchar(128) NOT NULL, "last_login" datetime NULL, "is_superuser" bool NOT NULL, "username" varchar(150) NOT NULL UNIQUE, "last_name" varchar(150) NOT NULL, "email" varchar(254) NOT NULL, "is_staff" bool NOT NULL, "is_active" bool NOT NULL, "date_joined" datetime NOT NULL, "first_name" varchar(150) NOT NULL);
INSERT INTO "auth_user" VALUES(1,'pbkdf2_sha256$1000000$JjTjyVzHi0Qt95qdvdSnSj$WiRG3V5hr4sk9mwSgTlqmahgy/sBdTQ0gMCWCyf+7io=','2026-10-13 07:51:47.438870',1,'admin','','admin@thestackly.com',1,1,'2026-10-13 06:29:29.263287','');
CREATE TABLE "auth_user_groups" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED, "group_id" integer NOT NULL REFERENCES "auth_group" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE TABLE "auth_user_user_permissions" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED, "permission_id" integer NOT NULL REFERENCES "auth_permission" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE TABLE "django_admin_log" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "object_id" text NULL, "object_repr" varchar(200) NOT NULL, "action_flag" smallint unsigned NOT NULL CHECK ("action_flag" >= 0), "change_message" text NOT NULL, "content_type_id" integer NULL REFERENCES "django_content_type" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED, "action_time" datetime NOT NULL);
INSERT INTO "django_admin_log" VALUES(1,'1','EMP-004 - CASUAL (APPROVED)',2,'[{"changed": {"fields": ["Status", "Reviewer comment"]}}]',11,1,'2026-10-13 07:57:37.856596');
CREATE TABLE "django_content_type" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "app_label" varchar(100) NOT NULL, "model" varchar(100) NOT NULL);
INSERT INTO "django_content_type" VALUES(1,'admin','logentry');
INSERT INTO "django_content_type" VALUES(2,'auth','permission');
INSERT INTO "django_content_type" VALUES(3,'auth','group');
INSERT INTO "django_content_type" VALUES(4,'auth','user');
INSERT INTO "django_content_type" VALUES(5,'contenttypes','contenttype');
INSERT INTO "django_content_type" VALUES(6,'sessions','session');
INSERT INTO "django_content_type" VALUES(7,'admin_app','shareduser');
INSERT INTO "django_content_type" VALUES(8,'admin_app','sharedemployee');
INSERT INTO "django_content_type" VALUES(9,'admin_app','sharedemployeedocument');
INSERT INTO "django_content_type" VALUES(10,'admin_app','sharedattendance');
INSERT INTO "django_content_type" VALUES(11,'admin_app','sharedleaverequest');
INSERT INTO "django_content_type" VALUES(12,'admin_app','sharedleavebalance');
INSERT INTO "django_content_type" VALUES(13,'admin_app','sharedpayroll');
INSERT INTO "django_content_type" VALUES(14,'admin_app','sharedsalaryslip');
INSERT INTO "django_content_type" VALUES(15,'admin_app','sharedauditlog');
INSERT INTO "django_content_type" VALUES(16,'admin_app','sharednotification');
CREATE TABLE "django_migrations" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "app" varchar(255) NOT NULL, "name" varchar(255) NOT NULL, "applied" datetime NOT NULL);
INSERT INTO "django_migrations" VALUES(1,'contenttypes','0001_initial','2026-10-13 06:29:28.854721');
INSERT INTO "django_migrations" VALUES(2,'auth','0001_initial','2026-10-13 06:29:28.881234');
INSERT INTO "django_migrations" VALUES(3,'admin','0001_initial','2026-10-13 06:29:28.899380');
INSERT INTO "django_migrations" VALUES(4,'admin','0002_logentry_remove_auto_add','2026-10-13 06:29:28.920805');
INSERT INTO "django_migrations" VALUES(5,'admin','0003_logentry_add_action_flag_choices','2026-10-13 06:29:28.937737');
INSERT INTO "django_migrations" VALUES(6,'contenttypes','0002_remove_content_type_name','2026-10-13 06:29:28.978884');
INSERT INTO "django_migrations" VALUES(7,'auth','0002_alter_permission_name_max_length','2026-10-13 06:29:28.994732');
INSERT INTO "django_migrations" VALUES(8,'auth','0003_alter_user_email_max_length','2026-10-13 06:29:29.007523');
INSERT INTO "django_migrations" VALUES(9,'auth','0004_alter_user_username_opts','2026-10-13 06:29:29.017606');
INSERT INTO "django_migrations" VALUES(10,'auth','0005_alter_user_last_login_null','2026-10-13 06:29:29.037204');
INSERT INTO "django_migrations" VALUES(11,'auth','0006_require_contenttypes_0002','2026-10-13 06:29:29.040204');
INSERT INTO "django_migrations" VALUES(12,'auth','0007_alter_validators_add_error_messages','2026-10-13 06:29:29.052985');
INSERT INTO "django_migrations" VALUES(13,'auth','0008_alter_user_username_max_length','2026-10-13 06:29:29.071998');
INSERT INTO "django_migrations" VALUES(14,'auth','0009_alter_user_last_name_max_length','2026-10-13 06:29:29.087973');
INSERT INTO "django_migrations" VALUES(15,'auth','0010_alter_group_name_max_length','2026-10-13 06:29:29.105258');
INSERT INTO "django_migrations" VALUES(16,'auth','0011_update_proxy_permissions','2026-10-13 06:29:29.124325');
INSERT INTO "django_migrations" VALUES(17,'auth','0012_alter_user_first_name_max_length','2026-10-13 06:29:29.140552');
INSERT INTO "django_migrations" VALUES(18,'sessions','0001_initial','2026-10-13 06:29:29.153231');
CREATE TABLE "django_session" ("session_key" varchar(40) NOT NULL PRIMARY KEY, "session_data" text NOT NULL, "expire_date" datetime NOT NULL);
INSERT INTO "django_session" VALUES('i73zo5q7bnsuwzsegq34wjyqe542wt1i','.eJxVjMsOwiAQRf-FtSHlNYBL934DGRiQqoGktCvjv2uTLnR7zzn3xQJuaw3byEuYiZ2ZYKffLWJ65LYDumO7dZ56W5c58l3hBx382ik_L4f7d1Bx1G-tNAjM3qRkNRRjQUgsTkUlvZOofdFkkcga42ACXyYPRWspBBSpsiT2_gDGyzb6:1xGXIZ:IaEU8kGkpDZa7vZ3ai08JP5jam5LG-KE12hnzQP1chU','2026-10-27 07:51:47.448033');
CREATE TABLE employee_documents (
	id INTEGER NOT NULL, 
	employee_id INTEGER NOT NULL, 
	title VARCHAR(150) NOT NULL, 
	document_type VARCHAR(50) NOT NULL, 
	file_name VARCHAR(255) NOT NULL, 
	file_path VARCHAR(500) NOT NULL, 
	file_size INTEGER, 
	uploaded_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(employee_id) REFERENCES employees (id) ON DELETE CASCADE
);
CREATE TABLE employees (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	employee_code VARCHAR(50) NOT NULL, 
	first_name VARCHAR(100) NOT NULL, 
	last_name VARCHAR(100) NOT NULL, 
	phone VARCHAR(20), 
	department VARCHAR(100) NOT NULL, 
	designation VARCHAR(100) NOT NULL, 
	joining_date DATE NOT NULL, 
	date_of_birth DATE, 
	address VARCHAR(255), 
	basic_salary FLOAT NOT NULL, 
	hra FLOAT NOT NULL, 
	allowances FLOAT NOT NULL, 
	deductions FLOAT NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
INSERT INTO "employees" VALUES(1,1,'EMP-001','Admin','User','9000000001','Management','System Administrator','2024-01-01',NULL,NULL,100000.0,30000.0,10000.0,2000.0,1,'2026-10-13 07:16:06.776945','2026-10-13 07:16:06.776945');
INSERT INTO "employees" VALUES(2,2,'EMP-002','HR','Manager','9000000002','Human Resources','HR Specialist','2024-01-01',NULL,NULL,60000.0,20000.0,5000.0,1500.0,1,'2026-10-13 07:16:07.183875','2026-10-13 07:16:07.183875');
INSERT INTO "employees" VALUES(3,3,'EMP-003','John','Doe','9000000003','Engineering','Software Developer','2024-06-01',NULL,NULL,50000.0,15000.0,5000.0,1000.0,1,'2026-10-13 07:16:07.184924','2026-10-13 07:16:07.184924');
INSERT INTO "employees" VALUES(4,4,'EMP-004','Shyam','Connor','9888877777','Engineering','Frontend Developer','2024-10-01',NULL,NULL,55000.0,18000.0,7000.0,2000.0,1,'2026-10-13 07:38:45.997636','2026-10-13 07:38:45.997636');
CREATE TABLE leave_balances (
	id INTEGER NOT NULL, 
	employee_id INTEGER NOT NULL, 
	year INTEGER NOT NULL, 
	casual_allocated FLOAT NOT NULL, 
	casual_used FLOAT NOT NULL, 
	sick_allocated FLOAT NOT NULL, 
	sick_used FLOAT NOT NULL, 
	paid_allocated FLOAT NOT NULL, 
	paid_used FLOAT NOT NULL, 
	lop_days FLOAT NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (employee_id), 
	FOREIGN KEY(employee_id) REFERENCES employees (id) ON DELETE CASCADE
);
INSERT INTO "leave_balances" VALUES(1,3,2026,12.0,0.0,10.0,0.0,15.0,0.0,0.0,'2026-10-13 07:16:07.187009');
INSERT INTO "leave_balances" VALUES(2,4,2026,12.0,0.0,10.0,0.0,15.0,0.0,0.0,'2026-10-13 07:38:46.004438');
CREATE TABLE leave_requests (
	id INTEGER NOT NULL, 
	employee_id INTEGER NOT NULL, 
	leave_type VARCHAR(6) NOT NULL, 
	start_date DATE NOT NULL, 
	end_date DATE NOT NULL, 
	total_days FLOAT NOT NULL, 
	reason VARCHAR(500) NOT NULL, 
	status VARCHAR(9) NOT NULL, 
	is_lop BOOLEAN NOT NULL, 
	reviewed_by_id INTEGER, 
	reviewer_comment VARCHAR(255), 
	reviewed_at DATETIME, 
	applied_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(employee_id) REFERENCES employees (id) ON DELETE CASCADE, 
	FOREIGN KEY(reviewed_by_id) REFERENCES users (id) ON DELETE SET NULL
);
INSERT INTO "leave_requests" VALUES(1,4,'CASUAL','2026-10-20','2026-10-21',2.0,'Family function','APPROVED',0,NULL,'Approved by Admin',NULL,'2026-10-13 07:49:38.441162');
CREATE TABLE notifications (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	message TEXT NOT NULL, 
	notification_type VARCHAR(17) NOT NULL, 
	is_read BOOLEAN NOT NULL, 
	email_sent BOOLEAN NOT NULL, 
	email_recipient VARCHAR(255), 
	email_subject VARCHAR(255), 
	email_log TEXT, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
INSERT INTO "notifications" VALUES(1,4,'Welcome Onboard!','Hello Shyam Connor,

Your employee profile (EMP-004) has been successfully created. Your department is Engineering and designation is Frontend Developer.

You can now log in using your registered email: shyam@hrms.com.

Welcome to the team!
HR Operations Team','ONBOARDING',0,1,'shyam@hrms.com','Welcome to HRMS, Shyam Connor!','--- EMAIL DISPATCH LOG ---
Timestamp: 2026-10-13T07:38:46.015807Z
To: shyam@hrms.com
Subject: Welcome to HRMS, Shyam Connor!
Status: DELIVERED (Simulated SMTP Gateway 250 OK)
Content-Type: text/plain; charset=utf-8

Hello Shyam Connor,

Your employee profile (EMP-004) has been successfully created. Your department is Engineering and designation is Frontend Developer.

You can now log in using your registered email: shyam@hrms.com.

Welcome to the team!
HR Operations Team
--------------------------','2026-10-13 07:38:46.019296');
INSERT INTO "notifications" VALUES(2,4,'Leave Request Submitted','Hello Shyam Connor,

Your leave application for 2.0 day(s) of CASUAL leave from 2026-10-20 to 2026-10-21 has been submitted and is pending review by Admin/HR.

Reason: Family function','LEAVE_APPLICATION',0,1,'shyam@hrms.com','Leave Request Submitted - CASUAL','--- EMAIL DISPATCH LOG ---
Timestamp: 2026-10-13T07:49:38.461954Z
To: shyam@hrms.com
Subject: Leave Request Submitted - CASUAL
Status: DELIVERED (Simulated SMTP Gateway 250 OK)
Content-Type: text/plain; charset=utf-8

Hello Shyam Connor,

Your leave application for 2.0 day(s) of CASUAL leave from 2026-10-20 to 2026-10-21 has been submitted and is pending review by Admin/HR.

Reason: Family function
--------------------------','2026-10-13 07:49:38.463478');
INSERT INTO "notifications" VALUES(3,4,'Monthly Payroll Processed','Hello Shyam Connor,

Your payroll for the month of 10/2026 has been computed. Net Pay: ₹74,000.00.
Present days: 0.5, LOP days: 0.','PAYROLL_GENERATED',0,1,'shyam@hrms.com','Payroll Processed for 10/2026','--- EMAIL DISPATCH LOG ---
Timestamp: 2026-10-13T08:07:25.144562Z
To: shyam@hrms.com
Subject: Payroll Processed for 10/2026
Status: DELIVERED (Simulated SMTP Gateway 250 OK)
Content-Type: text/plain; charset=utf-8

Hello Shyam Connor,

Your payroll for the month of 10/2026 has been computed. Net Pay: ₹74,000.00.
Present days: 0.5, LOP days: 0.
--------------------------','2026-10-13 08:07:25.145574');
CREATE TABLE payrolls (
	id INTEGER NOT NULL, 
	employee_id INTEGER NOT NULL, 
	month INTEGER NOT NULL, 
	year INTEGER NOT NULL, 
	total_working_days INTEGER NOT NULL, 
	present_days FLOAT NOT NULL, 
	approved_leave_days FLOAT NOT NULL, 
	lop_days FLOAT NOT NULL, 
	basic_salary FLOAT NOT NULL, 
	hra FLOAT NOT NULL, 
	allowances FLOAT NOT NULL, 
	gross_salary FLOAT NOT NULL, 
	lop_deduction FLOAT NOT NULL, 
	tax_deduction FLOAT NOT NULL, 
	other_deductions FLOAT NOT NULL, 
	total_deductions FLOAT NOT NULL, 
	net_salary FLOAT NOT NULL, 
	status VARCHAR(9) NOT NULL, 
	is_locked BOOLEAN NOT NULL, 
	is_credited BOOLEAN NOT NULL, 
	credited_at DATETIME, 
	payment_reference VARCHAR(100), 
	notes VARCHAR(255), 
	processed_by_id INTEGER, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT unique_employee_payroll_period UNIQUE (employee_id, month, year), 
	FOREIGN KEY(employee_id) REFERENCES employees (id) ON DELETE CASCADE, 
	FOREIGN KEY(processed_by_id) REFERENCES users (id) ON DELETE SET NULL
);
INSERT INTO "payrolls" VALUES(1,4,10,2026,30,0.5,2.0,0.0,55000.0,18000.0,7000.0,80000.0,0.0,4000.0,2000.0,6000.0,74000.0,'PROCESSED',0,0,NULL,NULL,NULL,2,'2026-10-13 08:07:25.051350','2026-10-13 08:07:25.051350');
CREATE TABLE salary_slips (
	id INTEGER NOT NULL, 
	payroll_id INTEGER NOT NULL, 
	employee_id INTEGER NOT NULL, 
	file_path VARCHAR(500) NOT NULL, 
	file_name VARCHAR(255) NOT NULL, 
	download_count INTEGER NOT NULL, 
	generated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (payroll_id), 
	FOREIGN KEY(payroll_id) REFERENCES payrolls (id) ON DELETE CASCADE, 
	FOREIGN KEY(employee_id) REFERENCES employees (id) ON DELETE CASCADE
);
INSERT INTO "salary_slips" VALUES(1,1,4,'C:\Users\HP\Desktop\Backend Accessment\Human Resource Management System(HRMS)\Human Resource Management System\fastapi_backend\media\salary_slips\SalarySlip_EMP-004_2026_10.pdf','SalarySlip_EMP-004_2026_10.pdf',1,'2026-10-13 08:07:25.147655');
CREATE TABLE users (
	id INTEGER NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	hashed_password VARCHAR(255) NOT NULL, 
	role VARCHAR(8) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id)
);
INSERT INTO "users" VALUES(1,'admin@hrms.com','$2b$12$OB7pXHfCP0KRrTLYFPQI5eb8wl9UOnxciMvXUkUPEZkWPIV4w3fJ6','ADMIN',1,'2026-10-13 07:16:06.291958','2026-10-13 07:16:06.291958');
INSERT INTO "users" VALUES(2,'hr@hrms.com','$2b$12$BqX.nHjec8LFjOpHBKGdJ.zu0Qd9kfOTJmZwNz2mznSs5HaaqJ4iS','HR',1,'2026-10-13 07:16:06.774939','2026-10-13 07:16:06.774939');
INSERT INTO "users" VALUES(3,'employee@hrms.com','$2b$12$b2PiRMrO8WH7a7VYtrGvP.xxzXxqSqzBggY6wYzVsy0dgPPiy98uS','EMPLOYEE',1,'2026-10-13 07:16:07.182359','2026-10-13 07:16:07.182359');
INSERT INTO "users" VALUES(4,'shyam@hrms.com','$2b$12$l2og3QGrmpIkDdNRIlhV8eGWooGr3bPfOBzSZnGP1/rnNrE53u9C.','EMPLOYEE',1,'2026-10-13 07:38:45.966552','2026-10-13 07:38:45.966552');
CREATE UNIQUE INDEX "auth_group_permissions_group_id_permission_id_0cd325b0_uniq" ON "auth_group_permissions" ("group_id", "permission_id");
CREATE INDEX "auth_group_permissions_group_id_b120cbf9" ON "auth_group_permissions" ("group_id");
CREATE INDEX "auth_group_permissions_permission_id_84c5c92e" ON "auth_group_permissions" ("permission_id");
CREATE UNIQUE INDEX "auth_user_groups_user_id_group_id_94350c0c_uniq" ON "auth_user_groups" ("user_id", "group_id");
CREATE INDEX "auth_user_groups_user_id_6a12ed8b" ON "auth_user_groups" ("user_id");
CREATE INDEX "auth_user_groups_group_id_97559544" ON "auth_user_groups" ("group_id");
CREATE UNIQUE INDEX "auth_user_user_permissions_user_id_permission_id_14a6b632_uniq" ON "auth_user_user_permissions" ("user_id", "permission_id");
CREATE INDEX "auth_user_user_permissions_user_id_a95ead1b" ON "auth_user_user_permissions" ("user_id");
CREATE INDEX "auth_user_user_permissions_permission_id_1fbb5f2c" ON "auth_user_user_permissions" ("permission_id");
CREATE INDEX "django_admin_log_content_type_id_c4bce8eb" ON "django_admin_log" ("content_type_id");
CREATE INDEX "django_admin_log_user_id_c564eba6" ON "django_admin_log" ("user_id");
CREATE UNIQUE INDEX "django_content_type_app_label_model_76bd3d3b_uniq" ON "django_content_type" ("app_label", "model");
CREATE UNIQUE INDEX "auth_permission_content_type_id_codename_01ab375a_uniq" ON "auth_permission" ("content_type_id", "codename");
CREATE INDEX "auth_permission_content_type_id_2f476e4b" ON "auth_permission" ("content_type_id");
CREATE INDEX "django_session_expire_date_a5c62663" ON "django_session" ("expire_date");
CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE INDEX ix_users_id ON users (id);
CREATE INDEX ix_audit_logs_created_at ON audit_logs (created_at);
CREATE INDEX ix_audit_logs_id ON audit_logs (id);
CREATE INDEX ix_employees_department ON employees (department);
CREATE UNIQUE INDEX ix_employees_employee_code ON employees (employee_code);
CREATE INDEX ix_employees_id ON employees (id);
CREATE INDEX ix_notifications_id ON notifications (id);
CREATE INDEX ix_employee_documents_id ON employee_documents (id);
CREATE INDEX ix_attendance_date ON attendance (date);
CREATE INDEX ix_attendance_id ON attendance (id);
CREATE INDEX ix_leave_requests_id ON leave_requests (id);
CREATE INDEX ix_leave_requests_status ON leave_requests (status);
CREATE INDEX ix_leave_balances_id ON leave_balances (id);
CREATE INDEX ix_payrolls_id ON payrolls (id);
CREATE INDEX ix_salary_slips_id ON salary_slips (id);
DELETE FROM "sqlite_sequence";
INSERT INTO "sqlite_sequence" VALUES('django_migrations',18);
INSERT INTO "sqlite_sequence" VALUES('django_admin_log',1);
INSERT INTO "sqlite_sequence" VALUES('django_content_type',16);
INSERT INTO "sqlite_sequence" VALUES('auth_permission',64);
INSERT INTO "sqlite_sequence" VALUES('auth_group',0);
INSERT INTO "sqlite_sequence" VALUES('auth_user',1);
COMMIT;
