import os
import sys
from pathlib import Path

os.environ.setdefault("RESEND_API_KEY", "test")
os.environ.setdefault("SENDER_EMAIL", "test@example.com")
os.environ.setdefault("ADMIN_EMAIL", "admin@example.com")
os.environ.setdefault("ADMIN_PASSWORD", "password")
os.environ.setdefault("JWT_SECRET", "secret")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import _calculate_promo_discount


def test_promo_amount_is_percentage_of_subtotal():
    assert _calculate_promo_discount({"amount": 25}, 200) == 50
    assert _calculate_promo_discount({"amount": 150}, 200) == 200


if __name__ == "__main__":
    test_promo_amount_is_percentage_of_subtotal()
