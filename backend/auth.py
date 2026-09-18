"""API-key governance for mutating endpoints (additive, opt-in).

Builds on the repo's existing Depends(get_db) wiring contract — no new
framework. SIH26_API_KEY is read ONCE at import; empty/unset means auth is
disabled, so the open demo behavior (read endpoints AND dev-mode mutating
endpoints) stays byte-identical until a deployment exports the key. When
the key IS configured, every mutating endpoint carrying Depends(require_api_key)
401-rejects calls that do not present the matching key, so waiver/approval
audit-trail entries become attributable.
"""

import os
import secrets

from fastapi import Depends, Header, HTTPException

API_KEY = os.environ.get("SIH26_API_KEY", "")


class UnauthorizedError(Exception):
    """Raised when a mutating call presents no/mismatched API key."""


def require_api_key(authorization: str = Header(None)) -> None:
    """Require the configured SIH26_API_KEY (accepts Bearer token or bare key).

    No-op when API_KEY is empty (default demo-open behavior). When a key is
    configured, a missing/mismatched key raises 401 BEFORE the handler body
    runs, so no mutating effect or audit-trail entry is ever produced.
    """
    if not API_KEY:
        return
    candidate = None
    if authorization:
        if authorization.startswith("Bearer "):
            candidate = authorization[7:]
        else:
            candidate = authorization
    if not candidate or not secrets.compare_digest(candidate, API_KEY):
        raise HTTPException(status_code=401, detail="Invalid or missing API key")