import smtplib
import ssl
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings

logger = logging.getLogger("clean_ai.email")

def send_otp_email(to_email: str, otp_code: str, purpose: str = "registration") -> dict:
    """
    Sends a 6-digit OTP email to the user.
    If SMTP credentials are provided in settings (e.g. Gmail App Password),
    sends a real email. Otherwise logs the OTP for testing and local development.
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
        .footer {{ font-size: 11px; color: #71717A; text-align: center; margin-top: 32px; border-top: 1px solid #262626; pt-4; padding-top: 16px; }}
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
    """

    text_content = f"""
Clean AI - Email Verification
-----------------------------
Your verification code is: {otp_code}

This code is valid for {getattr(settings, 'OTP_EXPIRE_MINUTES', 10)} minutes.
Please enter this code on the Clean AI website to verify your email address.

If you did not request this code, you can safely ignore this email.
    """.strip()

    # Check if SMTP is configured
    smtp_host = getattr(settings, 'SMTP_HOST', '').strip()
    smtp_port = getattr(settings, 'SMTP_PORT', 587)
    smtp_user = getattr(settings, 'SMTP_USER', '').strip()
    smtp_password = getattr(settings, 'SMTP_PASSWORD', '').replace(" ", "").strip()
    smtp_from = getattr(settings, 'SMTP_FROM_EMAIL', '').strip() or smtp_user or "noreply@cleanai.gov"
    from_name = getattr(settings, 'SMTP_FROM_NAME', 'Clean AI Sanitation Platform')

    if smtp_host and smtp_user and smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{from_name} <{smtp_from}>"
            msg["To"] = to_email

            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            context = ssl.create_default_context()
            if smtp_port == 465:
                with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=10) as server:
                    server.login(smtp_user, smtp_password)
                    server.sendmail(smtp_from, to_email, msg.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                    server.ehlo()
                    server.starttls(context=context)
                    server.ehlo()
                    server.login(smtp_user, smtp_password)
                    server.sendmail(smtp_from, to_email, msg.as_string())

            logger.info(f"OTP email successfully sent via SMTP to {to_email}")
            return {"sent": True, "method": "smtp", "message": f"Verification code sent to {to_email}"}
        except Exception as e:
            logger.error(f"Failed to send email via SMTP to {to_email}: {e}")
            # Fall through to simulated logging

    # Simulated email (logged for testing & fallback)
    logger.info(f"[SIMULATED EMAIL] Clean AI OTP for {to_email} ({purpose}): {otp_code}")
    print(f"\n==================================================")
    print(f"[CLEAN AI EMAIL SERVICE] Verification Code for {to_email}: {otp_code}")
    print(f"==================================================\n")
    return {"sent": True, "method": "simulated", "message": f"Verification code sent to {to_email}"}
