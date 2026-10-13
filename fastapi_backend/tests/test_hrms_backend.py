import sys
import os
import unittest
from fastapi.testclient import TestClient

# Add app to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database.session import SessionLocal
from app.models.user import User

client = TestClient(app)

class TestHRMSBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # 1. Login as Admin
        res_admin = client.post("/api/auth/login", json={
            "email": "admin@company.com",
            "password": "Admin@123"
        })
        assert res_admin.status_code == 200, f"Admin login failed: {res_admin.text}"
        cls.admin_token = res_admin.json()["access_token"]
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

        # 2. Login as HR
        res_hr = client.post("/api/auth/login", json={
            "email": "hr@company.com",
            "password": "Hr@123"
        })
        assert res_hr.status_code == 200, f"HR login failed: {res_hr.text}"
        cls.hr_token = res_hr.json()["access_token"]
        cls.hr_headers = {"Authorization": f"Bearer {cls.hr_token}"}

        # 3. Login as Employee (Mohamed)
        res_emp = client.post("/api/auth/login", json={
            "email": "mohamed@company.com",
            "password": "Emp@123"
        })
        assert res_emp.status_code == 200, f"Employee login failed: {res_emp.text}"
        cls.emp_token = res_emp.json()["access_token"]
        cls.emp_headers = {"Authorization": f"Bearer {cls.emp_token}"}
        cls.emp_id = res_emp.json()["employee_id"]

    def test_01_auth_me(self):
        """Test /api/auth/me returns current user info."""
        res = client.get("/api/auth/me", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["email"], "admin@company.com")
        self.assertEqual(data["role"], "ADMIN")

    def test_02_invalid_login(self):
        """Test invalid credentials return 401."""
        res = client.post("/api/auth/login", json={
            "email": "admin@company.com",
            "password": "WrongPassword999"
        })
        self.assertEqual(res.status_code, 401)

    def test_03_list_employees(self):
        """Test employee list endpoint."""
        res = client.get("/api/employees", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        emps = res.json()
        self.assertGreaterEqual(len(emps), 6)
        print(f"Verified {len(emps)} employees in directory.")

    def test_04_create_employee(self):
        """Test onboarding a new employee by HR."""
        new_emp_payload = {
            "first_name": "Divya",
            "last_name": "R",
            "email": "divya@company.com",
            "phone": "9876500001",
            "department": "Quality Assurance",
            "designation": "QA Automation Engineer",
            "joining_date": "2025-01-15",
            "basic_salary": 45000.0,
            "hra": 15000.0,
            "allowances": 5000.0,
            "deductions": 2000.0,
            "role": "EMPLOYEE"
        }
        res = client.post("/api/employees", json=new_emp_payload, headers=self.hr_headers)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["first_name"], "Divya")
        self.assertTrue(data["employee_code"].startswith("EMP-"))
        print(f"Created new employee {data['employee_code']} ({data['first_name']})")

    def test_05_document_upload_and_download(self):
        """Test uploading and downloading employee documents."""
        file_content = b"Mock Resume content for HRMS employee test"
        files = {
            "file": ("sample_resume.txt", file_content, "text/plain")
        }
        data = {
            "title": "Updated Resume 2026",
            "document_type": "Resume"
        }
        res = client.post(
            f"/api/employees/{self.emp_id}/documents",
            data=data,
            files=files,
            headers=self.emp_headers
        )
        self.assertEqual(res.status_code, 200)
        doc = res.json()
        doc_id = doc["id"]
        self.assertEqual(doc["title"], "Updated Resume 2026")

        # Download document
        res_dl = client.get(f"/api/employees/documents/{doc_id}/download", headers=self.emp_headers)
        self.assertEqual(res_dl.status_code, 200)
        self.assertEqual(res_dl.content, file_content)
        print("Document upload and secure download verified successfully.")

    def test_06_attendance_flow(self):
        """Test today status, check-in, duplicate prevention, and check-out."""
        # 1. Today status
        res_today = client.get("/api/attendance/today", headers=self.emp_headers)
        self.assertEqual(res_today.status_code, 200)

        # 2. Check in if not already checked in
        if not res_today.json()["has_checked_in"]:
            res_cin = client.post("/api/attendance/check-in", json={}, headers=self.emp_headers)
            self.assertEqual(res_cin.status_code, 200)
            self.assertEqual(res_cin.json()["status"], "PRESENT")

            # 3. Duplicate check-in should fail
            res_dup = client.post("/api/attendance/check-in", json={}, headers=self.emp_headers)
            self.assertEqual(res_dup.status_code, 400)
            print("Duplicate check-in prevention verified.")

        # 4. Check out
        res_cout = client.post("/api/attendance/check-out", json={}, headers=self.emp_headers)
        if res_cout.status_code == 200:
            self.assertIn("working_hours", res_cout.json())
            print(f"Check-out successful. Hours calculated: {res_cout.json()['working_hours']}")

    def test_07_attendance_admin_override(self):
        """Test Admin attendance override capability."""
        override_payload = {
            "employee_id": self.emp_id,
            "date": "2026-10-01",
            "status": "PRESENT",
            "working_hours": 8.5,
            "override_reason": "Forgot badge, verified by manager"
        }
        res = client.post("/api/attendance/override", json=override_payload, headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["is_override"])
        self.assertEqual(data["override_reason"], "Forgot badge, verified by manager")
        print("Attendance admin override verified.")

    def test_08_leave_workflow_and_lop(self):
        """Test applying for leave, balance check, and review workflow."""
        # 1. Get balance
        res_bal = client.get("/api/leaves/balance", headers=self.emp_headers)
        self.assertEqual(res_bal.status_code, 200)
        initial_casual_avail = res_bal.json()["casual_available"]

        # 2. Apply for leave
        apply_payload = {
            "leave_type": "CASUAL",
            "start_date": "2026-11-10",
            "end_date": "2026-11-11",
            "reason": "Personal work"
        }
        res_apply = client.post("/api/leaves/apply", json=apply_payload, headers=self.emp_headers)
        self.assertEqual(res_apply.status_code, 201)
        leave_id = res_apply.json()["id"]
        self.assertEqual(res_apply.json()["total_days"], 2.0)
        self.assertEqual(res_apply.json()["status"], "PENDING")

        # 3. HR Approves the leave
        res_review = client.put(
            f"/api/leaves/{leave_id}/review",
            json={"status": "APPROVED", "comment": "Approved by HR Manager"},
            headers=self.hr_headers
        )
        self.assertEqual(res_review.status_code, 200)
        self.assertEqual(res_review.json()["status"], "APPROVED")

        # 4. Verify balance was deducted
        res_bal_after = client.get("/api/leaves/balance", headers=self.emp_headers)
        self.assertEqual(res_bal_after.json()["casual_available"], initial_casual_avail - 2.0)
        print("Leave application, approval, and balance adjustment verified.")

    def test_09_payroll_computation_and_pdf(self):
        """Test payroll generation, salary credit simulation, and PDF payslip download."""
        # 1. Generate payroll for month 10, year 2026
        gen_payload = {
            "month": 10,
            "year": 2026,
            "employee_id": self.emp_id
        }
        res_gen = client.post("/api/payroll/generate", json=gen_payload, headers=self.hr_headers)
        self.assertEqual(res_gen.status_code, 200)
        payrolls = res_gen.json()
        self.assertGreaterEqual(len(payrolls), 1)
        payroll_id = payrolls[0]["id"]
        self.assertGreater(payrolls[0]["net_salary"], 0)
        print(f"Generated Payroll #{payroll_id}. Net Salary: Rs {payrolls[0]['net_salary']}")

        # 2. Simulate salary credit
        res_credit = client.post(f"/api/payroll/{payroll_id}/simulate-credit", headers=self.hr_headers)
        self.assertEqual(res_credit.status_code, 200)
        self.assertTrue(res_credit.json()["payment_reference"].startswith("SIM-TXN-"))

        # 3. Lock payroll
        res_lock = client.post(f"/api/payroll/{payroll_id}/lock", headers=self.hr_headers)
        self.assertEqual(res_lock.status_code, 200)

        # 4. Download PDF salary slip
        res_slips = client.get(f"/api/salary-slips?employee_id={self.emp_id}", headers=self.emp_headers)
        self.assertEqual(res_slips.status_code, 200)
        slips = res_slips.json()
        self.assertGreaterEqual(len(slips), 1)
        slip_id = slips[0]["id"]

        res_pdf = client.get(f"/api/salary-slips/{slip_id}/download", headers=self.emp_headers)
        self.assertEqual(res_pdf.status_code, 200)
        self.assertEqual(res_pdf.headers["content-type"], "application/pdf")
        self.assertTrue(res_pdf.content.startswith(b"%PDF"), "Response is not a valid PDF")
        print(f"PDF Payslip verified and downloaded successfully ({len(res_pdf.content)} bytes).")

    def test_10_reports_export(self):
        """Test reporting dashboard and CSV exports."""
        # 1. Dashboard summary
        res_dash = client.get("/api/reports/dashboard-summary", headers=self.admin_headers)
        self.assertEqual(res_dash.status_code, 200)
        summary = res_dash.json()
        self.assertGreater(summary["total_employees"], 0)

        # 2. Export attendance CSV
        res_att_csv = client.get("/api/reports/attendance/export?format=csv", headers=self.admin_headers)
        self.assertEqual(res_att_csv.status_code, 200)
        self.assertIn("Employee Code,Employee Name", res_att_csv.text)

        # 3. Export leaves CSV
        res_leave_csv = client.get("/api/reports/leaves/export?format=csv", headers=self.admin_headers)
        self.assertEqual(res_leave_csv.status_code, 200)
        self.assertIn("Request ID,Employee Code", res_leave_csv.text)

        # 4. Export payroll CSV
        res_pay_csv = client.get("/api/reports/payroll/export?month=9&year=2026", headers=self.admin_headers)
        self.assertEqual(res_pay_csv.status_code, 200)
        self.assertIn("Gross Salary,LOP Days", res_pay_csv.text)
        print("Reports dashboard and CSV exports verified.")

    def test_11_audit_logs_and_notifications(self):
        """Test audit logs (Admin only) and notification retrieval."""
        # 1. Audit logs
        res_audit = client.get("/api/audit-logs", headers=self.admin_headers)
        self.assertEqual(res_audit.status_code, 200)
        logs = res_audit.json()
        self.assertGreater(len(logs), 0)

        # 2. Non-admin accessing audit logs must be 403 Forbidden
        res_audit_emp = client.get("/api/audit-logs", headers=self.emp_headers)
        self.assertEqual(res_audit_emp.status_code, 403)

        # 3. Notifications
        res_notif = client.get("/api/notifications", headers=self.emp_headers)
        self.assertEqual(res_notif.status_code, 200)
        notifs = res_notif.json()
        self.assertGreater(len(notifs), 0)
        print("Audit logs protection and notifications verified.")

if __name__ == "__main__":
    unittest.main()
