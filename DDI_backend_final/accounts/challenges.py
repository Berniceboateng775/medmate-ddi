# accounts/challenges.py
from django.core.cache import cache
from secrets import token_urlsafe

PREFIX = "webauthn:challenge:"
TTL = 300  # 5 minutes

def new_challenge_id() -> str:
    return token_urlsafe(16)

def put_challenge(challenge_id: str, payload: dict, ttl: int = TTL) -> None:
    cache.set(PREFIX + challenge_id, payload, ttl)

def get_challenge(challenge_id: str) -> dict | None:
    return cache.get(PREFIX + challenge_id)

def pop_challenge(challenge_id: str) -> dict | None:
    key = PREFIX + challenge_id
    data = cache.get(key)
    cache.delete(key)
    return data
