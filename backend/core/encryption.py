import base64
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from django.conf import settings

def get_fernet_key():
    secret = getattr(settings, 'ENCRYPTION_KEY', 'JRAM_GROUPS_FERNET_SECRET_KEY_2026_32BYTES_LEN_SECURE=')
    salt = b'jram_groups_salt_2026'
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(secret.encode()))
    return key

def encrypt_val(val: str) -> str:
    if not val:
        return ""
    try:
        f = Fernet(get_fernet_key())
        return f.encrypt(str(val).encode()).decode()
    except Exception as e:
        return str(val)

def decrypt_val(val: str) -> str:
    if not val:
        return ""
    try:
        f = Fernet(get_fernet_key())
        return f.decrypt(str(val).encode()).decode()
    except Exception as e:
        return str(val)
