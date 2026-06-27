"""Provider registry — instantiate enabled providers from the key store.

To add a new provider:
  1. Create backend/app/providers/yourprovider.py implementing Provider ABC.
  2. Import it here and instantiate it inside get_providers() if its key is present.
"""
from app.providers.base import Provider


def get_providers() -> list[Provider]:
    """Return a list of enabled provider instances based on currently active keys."""
    from app.providers.virustotal import VirusTotalProvider
    from app.providers.abuseipdb import AbuseIPDBProvider
    from app.services.keystore import keystore, VT, ABUSE

    providers: list[Provider] = []

    vt_key = keystore.get(VT)
    if vt_key:
        providers.append(VirusTotalProvider(vt_key))

    abuse_key = keystore.get(ABUSE)
    if abuse_key:
        providers.append(AbuseIPDBProvider(abuse_key))

    return providers
