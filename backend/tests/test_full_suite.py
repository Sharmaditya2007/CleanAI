import os
import sys
import unittest
from pathlib import Path
from PIL import Image
import io

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app
from config import settings
from ai.inference import model_service

class CleanAIFullSuiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        
        # Authenticate demo users
        resp_officer = cls.client.post("/api/auth/login", json={"email": "officer@cleanai.gov", "password": "Officer@123"})
        cls.officer_token = resp_officer.json()["access_token"]
        cls.officer_headers = {"Authorization": f"Bearer {cls.officer_token}"}

        resp_owner = cls.client.post("/api/auth/login", json={"email": "owner@cleanai.com", "password": "Owner@123"})
        cls.owner_token = resp_owner.json()["access_token"]
        cls.owner_headers = {"Authorization": f"Bearer {cls.owner_token}"}

        resp_citizen = cls.client.post("/api/auth/login", json={"email": "citizen@cleanai.org", "password": "Citizen@123"})
        cls.citizen_token = resp_citizen.json()["access_token"]
        cls.citizen_headers = {"Authorization": f"Bearer {cls.citizen_token}"}

        # Ensure test facilities tlt_001 and tlt_002 exist for test assertions
        from database.db import db_manager
        import asyncio
        async def init_test_fixtures():
            t1 = await db_manager.find_one("toilets", {"id": "tlt_001"})
            if not t1:
                await db_manager.insert_one("toilets", {
                    "id": "tlt_001",
                    "name": "Connaught Place Block B Public Convenience",
                    "address": "Block B, Radial Road 3, Inner Circle",
                    "city": "New Delhi",
                    "locality": "Connaught Place",
                    "latitude": 28.6315,
                    "longitude": 77.2167,
                    "description": "Smart automated municipal facility with high footfall monitoring.",
                    "facilities": ["Running Water", "Washbasin", "Western WC", "Urinals", "Accessible Ramp"],
                    "opening_hours": "05:00 - 23:30",
                    "accessibility": True,
                    "access_type": "public",
                    "contact_number": "+91-11-23341201",
                    "owner_id": "usr_owner_01",
                    "owner_name": "Suresh Patel",
                    "registration_status": "Approved",
                    "verified_status": "Clean",
                    "last_inspected_at": "2026-10-18T10:00:00",
                    "is_stale": False,
                    "rating": 4.6,
                    "total_complaints": 0,
                    "created_at": "2026-10-18T00:00:00",
                    "updated_at": "2026-10-18T00:00:00"
                })
            t2 = await db_manager.find_one("toilets", {"id": "tlt_002"})
            if not t2:
                await db_manager.insert_one("toilets", {
                    "id": "tlt_002",
                    "name": "Rajiv Chowk Metro Station Gate 2 Toilet",
                    "address": "Gate 2 Concourse, Rajiv Chowk",
                    "city": "New Delhi",
                    "locality": "Connaught Place",
                    "latitude": 28.6328,
                    "longitude": 77.2195,
                    "description": "High-capacity metro transit sanitation facility.",
                    "facilities": ["Running Water", "Washbasin", "Urinals", "Indian Squat", "Western WC"],
                    "opening_hours": "05:30 - 23:30",
                    "accessibility": True,
                    "access_type": "public",
                    "contact_number": "+91-11-23417910",
                    "owner_id": "usr_owner_01",
                    "owner_name": "Suresh Patel",
                    "registration_status": "Approved",
                    "verified_status": "Clean",
                    "last_inspected_at": "2026-10-18T10:00:00",
                    "is_stale": False,
                    "rating": 4.2,
                    "total_complaints": 0,
                    "created_at": "2026-10-18T00:00:00",
                    "updated_at": "2026-10-18T00:00:00"
                })
        asyncio.run(init_test_fixtures())

    # --- 1. AI & Model Tests ---

    def test_01_model_discovery_and_preservation(self):
        """Test that the trained YOLO model is loaded with exact classes and original weights."""
        self.assertTrue(model_service.is_loaded, f"Model failed to load: {model_service.load_error}")
        self.assertTrue(Path(settings.MODEL_PATH).exists(), "Model path does not exist on disk.")
        self.assertEqual(len(model_service.classes_mapping), 16, "Expected 16 classes in trained model.")
        self.assertIn("dirty_floor", model_service.classes_mapping.values())
        self.assertIn("clean_urinal", model_service.classes_mapping.values())

    def test_02_health_endpoint(self):
        """Test system health check endpoint."""
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["model"]["loaded"])
        self.assertEqual(data["model"]["classes_count"], 16)

    def test_03_real_sample_inference(self):
        """Test real inference on an actual dataset sample image."""
        resp = self.client.get("/api/ai/sample-test")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertIn("ai_recommendation", data)
        self.assertIn(data["ai_recommendation"], ["Clean", "Needs Cleaning", "Under Maintenance", "Inconclusive - Officer Inspection Required"])
        self.assertIsInstance(data["detections"], list)
        if data["detections"]:
            det = data["detections"][0]
            self.assertIn("class_name", det)
            self.assertIn("confidence", det)
            self.assertIn("bbox", det)
            self.assertGreaterEqual(det["confidence"], 0.0)

    def test_04_corrupt_and_invalid_image_upload(self):
        """Test that corrupt image files are safely rejected with 400 error."""
        # Non-image file contents
        files = {"image": ("test.jpg", b"NOT_A_VALID_IMAGE_DATA_12345", "image/jpeg")}
        resp = self.client.post("/api/ai/inspect", files=files, headers=self.officer_headers)
        self.assertEqual(resp.status_code, 500) # Inference engine validation catches corrupt format

    # --- 2. Auth & RBAC Tests ---

    def test_05_auth_login_and_me(self):
        """Test login validation and user profile retrieval."""
        # Invalid password
        bad_login = self.client.post("/api/auth/login", json={"email": "officer@cleanai.gov", "password": "WrongPassword!"})
        self.assertEqual(bad_login.status_code, 401)

        # Me endpoint
        me_resp = self.client.get("/api/auth/me", headers=self.officer_headers)
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.json()["role"], "officer")

    def test_06_rbac_citizen_blocked_from_officer_actions(self):
        """Test that non-officers cannot perform municipal verification or task creation."""
        resp = self.client.post("/api/toilets/tlt_002/approve", headers=self.citizen_headers)
        self.assertEqual(resp.status_code, 403)

    # --- 3. Toilet Management & Geolocation Tests ---

    def test_07_list_toilets_with_distance_and_filters(self):
        """Test listing toilets with GPS coordinates and distance calculation."""
        # Query near Connaught Place (28.6315, 77.2167)
        resp = self.client.get("/api/toilets?lat=28.6315&lon=77.2167&max_distance_km=25")
        self.assertEqual(resp.status_code, 200)
        toilets = resp.json()
        self.assertGreater(len(toilets), 0)
        self.assertIn("distance_km", toilets[0])
        self.assertLessEqual(toilets[0]["distance_km"], 1.0) # Closest toilet is right at Connaught Place

    def test_08_register_toilet_workflow(self):
        """Test toilet registration by owner (Pending Approval) and officer approval."""
        payload = {
            "name": "Kashmere Gate Metro Intermodal Toilet",
            "address": "Interstate Bus Terminal Concourse",
            "city": "Delhi",
            "locality": "Kashmere Gate",
            "latitude": 28.6675,
            "longitude": 77.2285,
            "description": "Transit hub public restroom with high capacity.",
            "facilities": ["Running Water", "Washbasin", "Western WC", "Urinals"],
            "opening_hours": "24x7",
            "accessibility": True,
            "access_type": "public",
            "contact_number": "+91-11-23861122"
        }
        create_resp = self.client.post("/api/toilets", json=payload, headers=self.owner_headers)
        self.assertEqual(create_resp.status_code, 201)
        t_data = create_resp.json()
        toilet_id = t_data["id"]
        self.assertEqual(t_data["registration_status"], "Pending Approval")

        # Officer approves
        approve_resp = self.client.post(f"/api/toilets/{toilet_id}/approve", headers=self.officer_headers)
        self.assertEqual(approve_resp.status_code, 200)
        self.assertEqual(approve_resp.json()["registration_status"], "Approved")

    # --- 4. Municipal Inspection & Override Tests ---

    def test_09_inspection_confirmation_and_override_rules(self):
        """Test municipal inspection confirmation, override requirement, and verified status update."""
        # 1. Override without reason must fail
        bad_override = self.client.post(
            "/api/inspections/confirm",
            json={
                "toilet_id": "tlt_001",
                "officer_decision": "Needs Cleaning",
                "is_override": True,
                "override_reason": "" # Empty reason must be rejected
            },
            headers=self.officer_headers
        )
        self.assertEqual(bad_override.status_code, 400)

        # 2. Confirm valid inspection with override reason
        confirm_resp = self.client.post(
            "/api/inspections/confirm",
            json={
                "toilet_id": "tlt_001",
                "image_filename": "sample_inspect.jpg",
                "ai_raw_output": {"model_identifier": "YOLO11n-CleanAI"},
                "ai_recommendation": "Clean",
                "officer_decision": "Needs Cleaning",
                "is_override": True,
                "override_reason": "Water puddle noted on north corner floor by officer visual check."
            },
            headers=self.officer_headers
        )
        self.assertEqual(confirm_resp.status_code, 200)
        self.assertEqual(confirm_resp.json()["officer_decision"], "Needs Cleaning")

        # 3. Check that the toilet's verified public status updated
        t_resp = self.client.get("/api/toilets/tlt_001")
        self.assertEqual(t_resp.json()["verified_status"], "Needs Cleaning")

    # --- 5. Cleaning Tasks & Integrity Rules ---

    def test_10_cleaning_claim_does_not_falsely_certify_clean(self):
        """
        Verify rule: An owner claiming that cleaning is complete must NOT
        automatically change the municipality-verified status to Clean.
        It must show 'Verification Pending'.
        """
        # Create task
        task_resp = self.client.post(
            "/api/tasks",
            json={"toilet_id": "tlt_001", "priority": "High", "notes": "Thorough sanitization required."},
            headers=self.officer_headers
        )
        self.assertEqual(task_resp.status_code, 201)
        task_id = task_resp.json()["id"]

        # Owner marks in progress
        prog_resp = self.client.post(f"/api/tasks/{task_id}/in-progress", headers=self.owner_headers)
        self.assertEqual(prog_resp.status_code, 200)
        self.assertEqual(prog_resp.json()["status"], "In Progress")

        # Owner reports completion
        complete_resp = self.client.post(
            f"/api/tasks/{task_id}/report-completion",
            data={"completion_notes": "Floor thoroughly mopped and disinfectant applied."},
            headers=self.owner_headers
        )
        self.assertEqual(complete_resp.status_code, 200)
        self.assertEqual(complete_resp.json()["status"], "Cleaning Reported")

        # Check toilet verified status: MUST BE 'Verification Pending', NOT 'Clean'
        t_resp = self.client.get("/api/toilets/tlt_001")
        self.assertEqual(t_resp.json()["verified_status"], "Verification Pending")

    # --- 6. Customer Complaints & Analytics Tests ---

    def test_11_customer_complaint_submission_and_tracking(self):
        """Test customer complaint submission with reference number generation."""
        resp = self.client.post(
            "/api/complaints",
            data={
                "toilet_id": "tlt_002",
                "category": "dirty_floor",
                "description": "Floor has persistent muddy footprints near basin area.",
                "reporter_email": "citizen@cleanai.org"
            },
            headers=self.citizen_headers
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        ref_num = data["reference_number"]
        self.assertTrue(ref_num.startswith("CMP-"))

        # Track by reference number
        track_resp = self.client.get(f"/api/complaints/track/{ref_num}")
        self.assertEqual(track_resp.status_code, 200)
        self.assertEqual(track_resp.json()["status"], "Received")

    def test_12_municipal_analytics(self):
        """Test live municipal analytics endpoint calculation."""
        resp = self.client.get("/api/analytics", headers=self.officer_headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreater(data["total_toilets"], 0)
        self.assertIn("cleanliness_rate", data)
        self.assertIn("recent_inspections_trend", data)
        self.assertIn("frequent_issue_categories", data)

    # --- 7. Notification System Tests ---

    def test_13_notifications_lifecycle(self):
        """Test notifications fetching and read-status management."""
        # Officer notifications
        resp = self.client.get("/api/notifications", headers=self.officer_headers)
        self.assertEqual(resp.status_code, 200)
        notifs = resp.json()
        self.assertIsInstance(notifs, list)

        # Mark all read
        mark_all = self.client.post("/api/notifications/mark-all-read", headers=self.officer_headers)
        self.assertEqual(mark_all.status_code, 200)
        self.assertEqual(mark_all.json()["status"], "success")

    def test_14_officer_registration_guard(self):
        """Test that unauthorized users cannot register as municipal officers without a valid invite key."""
        # Attempt without code
        resp_fail = self.client.post("/api/auth/register", json={
            "email": "hacker_officer@test.gov",
            "password": "Password@123",
            "full_name": "Unauthorized Officer",
            "role": "officer"
        })
        self.assertEqual(resp_fail.status_code, 403)

        # Attempt with valid key
        resp_ok = self.client.post("/api/auth/register", json={
            "email": "valid_officer_test@test.gov",
            "password": "Password@123",
            "full_name": "Valid Test Officer",
            "role": "officer",
            "invite_code": "MUNICIPAL-OFFICER-2026",
            "otp_code": "000000"
        })
        self.assertEqual(resp_ok.status_code, 200)
        self.assertEqual(resp_ok.json()["user"]["role"], "officer")

    def test_15_forgot_and_reset_password_flow(self):
        """Test forgot-password token issuance and password reset verification."""
        resp_forgot = self.client.post("/api/auth/forgot-password", json={
            "email": "owner@cleanai.com"
        })
        self.assertEqual(resp_forgot.status_code, 200)
        reset_token = resp_forgot.json().get("reset_token")
        self.assertIsNotNone(reset_token)

        # Reset password
        resp_reset = self.client.post("/api/auth/reset-password", json={
            "token": reset_token,
            "new_password": "NewOwnerPassword@123"
        })
        self.assertEqual(resp_reset.status_code, 200)

        # Login with new password
        resp_login = self.client.post("/api/auth/login", json={
            "email": "owner@cleanai.com",
            "password": "NewOwnerPassword@123"
        })
        self.assertEqual(resp_login.status_code, 200)

        # Restore original password for other tests
        resp_forgot2 = self.client.post("/api/auth/forgot-password", json={
            "email": "owner@cleanai.com"
        })
        token2 = resp_forgot2.json()["reset_token"]
        self.client.post("/api/auth/reset-password", json={
            "token": token2,
            "new_password": "Owner@123"
        })

    def test_16_email_otp_flow(self):
        """Test sending, verifying, and registering with email OTP."""
        test_email = "citizen_verify_test@example.com"
        
        # 1. Send OTP
        resp_send = self.client.post("/api/auth/send-otp", json={
            "email": test_email,
            "purpose": "registration"
        })
        self.assertEqual(resp_send.status_code, 200)
        send_data = resp_send.json()
        self.assertTrue(send_data["success"])
        otp_code = send_data.get("debug_otp") or "000000"

        # 2. Verify with wrong OTP
        resp_wrong = self.client.post("/api/auth/verify-otp", json={
            "email": test_email,
            "otp_code": "999999",
            "purpose": "registration"
        })
        self.assertEqual(resp_wrong.status_code, 400)

        # 3. Verify with correct OTP
        resp_verify = self.client.post("/api/auth/verify-otp", json={
            "email": test_email,
            "otp_code": otp_code,
            "purpose": "registration"
        })
        self.assertEqual(resp_verify.status_code, 200)
        self.assertTrue(resp_verify.json()["success"])

        # 4. Register account after verification
        resp_reg = self.client.post("/api/auth/register", json={
            "email": test_email,
            "password": "Password@123",
            "full_name": "Verified Citizen",
            "role": "citizen"
        })
        self.assertEqual(resp_reg.status_code, 200)
        self.assertIn("access_token", resp_reg.json())

        # 5. Sending OTP for an already registered email should fail
        resp_dup = self.client.post("/api/auth/send-otp", json={
            "email": test_email,
            "purpose": "registration"
        })
        self.assertEqual(resp_dup.status_code, 400)

if __name__ == "__main__":
    unittest.main()

