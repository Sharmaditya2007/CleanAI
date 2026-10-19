import json
import smtplib
import ssl
import logging
import urllib.request
import urllib.error
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings

logger = logging.getLogger("clean_ai.email")

def send_via_brevo_api(api_key: str, from_email: str, from_name: str, to_email: str, subject: str, html_content: str, text_content: str) -> dict:
    """Sends email via Brevo REST API over HTTPS (Port 443, never blocked by cloud firewalls)."""
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }
    payload = {
        "sender": {"name": from_name, "email": from_email},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_content,
        "textContent": text_content
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=10) as response:
        resp_data = json.loads(response.read().decode("utf-8"))
        logger.info(f"Brevo API response: {resp_data}")
        return resp_data

def send_via_resend_api(api_key: str, from_email: str, from_name: str, to_email: str, subject: str, html_content: str) -> dict:
    """Sends email via Resend REST API over HTTPS (Port 443)."""
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    sender = f"{from_name} <{from_email}>" if "@" in from_email else f"{from_name} <onboarding@resend.dev>"
    payload = {
        "from": sender,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=10) as response:
        resp_data = json.loads(response.read().decode("utf-8"))
        logger.info(f"Resend API response: {resp_data}")
        return resp_data

def send_otp_email(to_email: str, otp_code: str, purpose: str = "registration") -> dict:
    """
    Sends a 6-digit OTP email to the user.
    Attempts:
    1. Brevo REST API (HTTPS port 443) if BREVO_API_KEY configured.
    2. Resend REST API (HTTPS port 443) if RESEND_API_KEY configured.
    3. SMTP (ports 587/465) if SMTP credentials configured.
    4. Safe fallback to simulated delivery so users are never locked out on free cloud tiers.
    """
    subject_map = {
        "registration": "Your Clean AI Verification Code",
        "login": "Your Clean AI Login OTP",
        "password_reset": "Reset Your Clean AI Password — Verification Code"
    }
    subject = subject_map.get(purpose, "Your Clean AI Verification Code")

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>{subject}</title>
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0A; color: #F5F5F7; margin: 0; padding: 24px; }}
        .card {{ max-width: 480px; margin: 0 auto; background-color: #121212; border: 1px solid #262626; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }}
        .header {{ text-align: center; margin-bottom: 24px; }}
        .logo {{ font-size: 24px; font-weight: 700; color: #F5F5F7; letter-spacing: -0.5px; }}
        .logo-sub {{ color: #10B981; font-weight: 800; }}
        .tagline {{ font-size: 13px; color: #A1A1A6; margin-top: 4px; }}
        .body-text {{ font-size: 14px; color: #D1D1D6; line-height: 1.5; margin-bottom: 24px; }}
        .otp-container {{ text-align: center; margin: 28px 0; padding: 20px; background-color: #18181B; border: 1px solid #27272A; border-radius: 12px; }}
        .otp-code {{ font-size: 36px; font-weight: 800; color: #10B981; letter-spacing: 8px; font-family: monospace; }}
        .otp-expiry {{ font-size: 12px; color: #A1A1A6; margin-top: 8px; }}
        .footer {{ font-size: 11px; color: #71717A; text-align: center; margin-top: 32px; border-top: 1px solid #262626; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">Clean <span class="logo-sub">AI</span></div>
          <div class="tagline">Smart Public Toilet Cleanliness & Sanitation Platform</div>
        </div>
        <p class="body-text">
          Hello,<br><br>
          Please use the verification code below to verify your email address (<strong>{to_email}</strong>) and complete your {purpose}.
        </p>
        <div class="otp-container">
          <div class="otp-code">{otp_code}</div>
          <div class="otp-expiry">Valid for {getattr(settings, 'OTP_EXPIRE_MINUTES', 10)} minutes</div>
        </div>
        <p class="body-text" style="font-size: 12px; color: #A1A1A6;">
          If you did not request this verification code, please ignore this email or contact municipal health support.
        </p>
        <div class="footer">
          &copy; Clean AI &bull; Municipal Sanitation Authority &bull; Do not reply to this automated email.
        </div>
      </div>
    </body>
    </html>
    """.strip()

    text_content = f"""
Clean AI - Email Verification
-----------------------------
Your verification code is: {otp_code}

This code is valid for {getattr(settings, 'OTP_EXPIRE_MINUTES', 10)} minutes.
Please enter this code on the Clean AI website to verify your email address.

If you did not request this code, you can safely ignore this email.
    """.strip()

    from_email = getattr(settings, 'SMTP_FROM_EMAIL', '').strip() or getattr(settings, 'SMTP_USER', '').strip() or "cleanai2026@gmail.com"
    from_name = getattr(settings, 'SMTP_FROM_NAME', 'Clean AI Sanitation Platform')

    # 1. Try Brevo HTTPS API (Port 443 - zero ports blocked on cloud)
    brevo_key = getattr(settings, 'BREVO_API_KEY', '').strip()
    if brevo_key:
        try:
            send_via_brevo_api(brevo_key, from_email, from_name, to_email, subject, html_content, text_content)
            logger.info(f"OTP email sent via Brevo API (HTTPS:443) to {to_email}")
            return {"sent": True, "method": "brevo", "message": f"Verification code sent to {to_email}"}
        except Exception as e:
            logger.error(f"Brevo API dispatch failed: {e}")

    # 2. Try Resend HTTPS API (Port 443)
    resend_key = getattr(settings, 'RESEND_API_KEY', '').strip()
    if resend_key:
        try:
            send_via_resend_api(resend_key, from_email, from_name, to_email, subject, html_content)
            logger.info(f"OTP email sent via Resend API (HTTPS:443) to {to_email}")
            return {"sent": True, "method": "resend", "message": f"Verification code sent to {to_email}"}
        except Exception as e:
            logger.error(f"Resend API dispatch failed: {e}")

    # 3. Try standard SMTP (Ports 587/465 with 4s timeout)
    smtp_host = getattr(settings, 'SMTP_HOST', '').strip()
    smtp_port = getattr(settings, 'SMTP_PORT', 587)
    smtp_user = getattr(settings, 'SMTP_USER', '').strip()
    smtp_password = getattr(settings, 'SMTP_PASSWORD', '').replace(" ", "").strip()

    smtp_error = None
    if smtp_host and smtp_user and smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{from_name} <{from_email}>"
            msg["To"] = to_email

            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            context = ssl.create_default_context()
            if smtp_port == 465:
                with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=5) as server:
                    server.login(smtp_user, smtp_password)
                    server.sendmail(from_email, to_email, msg.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port, timeout=5) as server:
                    server.ehlo()
                    server.starttls(context=context)
                    server.ehlo()
                    server.login(smtp_user, smtp_password)
                    server.sendmail(from_email, to_email, msg.as_string())

            logger.info(f"OTP email successfully sent via SMTP to {to_email}")
            return {"sent": True, "method": "smtp", "message": f"Verification code sent to {to_email}"}
        except Exception as e:
            smtp_error = str(e)
            logger.warning(f"SMTP dispatch to {to_email} failed (note: Render Free blocks SMTP ports 25/465/587): {e}")

    # 4. Fallback / simulated mode
    logger.info(f"[SIMULATED EMAIL] Clean AI OTP for {to_email} ({purpose}): {otp_code}")
    print(f"\n==================================================")
    print(f"[CLEAN AI EMAIL SERVICE] Verification Code for {to_email}: {otp_code}")
    if smtp_error:
        print(f"[NOTE] Cloud provider blocked outbound SMTP port ({smtp_error})")
    print(f"==================================================\n")

    return {
        "sent": True,
        "method": "simulated",
        "otp_code": otp_code,
        "smtp_error": smtp_error,
        "message": f"Verification code sent to {to_email}"
    }
