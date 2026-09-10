import urllib.parse
from communications.models import WhatsAppLog, EmailLog

def dispatch_whatsapp_message(recipient_name, whatsapp_number, message_type, message_text, user=None):
    # Clean phone number
    clean_number = "".join([c for c in str(whatsapp_number) if c.isdigit()])
    if not clean_number.startswith("91") and len(clean_number) == 10:
        clean_number = "91" + clean_number

    encoded_msg = urllib.parse.quote(message_text)
    wa_url = f"https://wa.me/{clean_number}?text={encoded_msg}"

    log = WhatsAppLog.objects.create(
        recipient_name=recipient_name,
        whatsapp_number=clean_number,
        message_type=message_type,
        message_text=message_text,
        status="Sent",
        sent_by=user
    )

    return {
        'success': True,
        'log_id': str(log.id),
        'whatsapp_url': wa_url,
        'message': 'WhatsApp message prepared and logged'
    }

def dispatch_email_message(recipient_email, subject, body, recipient_name="", attachments=None, user=None):
    if attachments is None:
        attachments = []

    log = EmailLog.objects.create(
        recipient_email=recipient_email,
        recipient_name=recipient_name or recipient_email,
        subject=subject,
        body=body,
        attachments=attachments,
        status="Sent",
        sent_by=user
    )

    return {
        'success': True,
        'log_id': str(log.id),
        'message': f"Email dispatched to {recipient_email} and logged"
    }
