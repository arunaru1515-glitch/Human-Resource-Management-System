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
INSERT INTO "auth_user" VALUES(1,'pbkdf2_sha256$1000000$JjTjyVzHi0Qt95qdvdSnSj$WiRG3V5hr4sk9mwSgTlqmahgy/sBdTQ0gMCWCyf+7io=','2026-10-13 06:55:03.381190',1,'admin','','admin@thestackly.com',1,1,'2026-10-13 06:29:29.263287','');
CREATE TABLE "auth_user_groups" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED, "group_id" integer NOT NULL REFERENCES "auth_group" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE TABLE "auth_user_user_permissions" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED, "permission_id" integer NOT NULL REFERENCES "auth_permission" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE TABLE "django_admin_log" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "object_id" text NULL, "object_repr" varchar(200) NOT NULL, "action_flag" smallint unsigned NOT NULL CHECK ("action_flag" >= 0), "change_message" text NOT NULL, "content_type_id" integer NULL REFERENCES "django_content_type" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED, "action_time" datetime NOT NULL);
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
INSERT INTO "django_session" VALUES('4w14ezs1js0gvc32w68pl49ak8t6gn5g','.eJxVjEEOwiAQRe_C2hAGCgWX7j0DGZhBqoYmpV0Z765NutDtf-_9l4i4rTVunZc4kTgLEKffLWF-cNsB3bHdZpnnti5TkrsiD9rldSZ-Xg7376Bir9_aKjJ6NCpoazGRUcq5kpMGQNbFAoEuI6RiyJH2bILxwBCQi7d2CIN4fwDFgDc2:1xGWPf:iN3smOUhJy4xn9HU617Y6zArkMpwo8bQhtBA2p0HYTY','2026-10-27 06:55:03.391474');
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
INSERT INTO "sqlite_sequence" VALUES('django_admin_log',0);
INSERT INTO "sqlite_sequence" VALUES('django_content_type',16);
INSERT INTO "sqlite_sequence" VALUES('auth_permission',64);
INSERT INTO "sqlite_sequence" VALUES('auth_group',0);
INSERT INTO "sqlite_sequence" VALUES('auth_user',1);
COMMIT;
