"""
Simple in-memory caching middleware for ShoutAloud API.
Production should use Redis-backed caching.
"""
import time
import hashlib
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class SimpleCache:
    def __init__(self, ttl: int = 300):
        self.ttl = ttl
        self._store: dict[str, tuple[float, Response]] = {}

    def get(self, key: str) -> Response | None:
        if key in self._store:
            timestamp, response = self._store[key]
            if time.time() - timestamp < self.ttl:
                return response
            del self._store[key]
        return None

    def set(self, key: str, response: Response):
        self._store[key] = (time.time(), response)

    def invalidate(self, prefix: str):
        keys_to_delete = [k for k in self._store if k.startswith(prefix)]
        for k in keys_to_delete:
            del self._store[k]


cache = SimpleCache(ttl=300)

CACHEABLE_METHODS = {"GET"}
CACHEABLE_PREFIXES = ["/api/proposals", "/api/officials", "/api/analytics", "/api/ratings"]


class CacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method not in CACHEABLE_METHODS:
            response = await call_next(request)
            return response

        if not any(request.url.path.startswith(p) for p in CACHEABLE_PREFIXES):
            response = await call_next(request)
            return response

        cache_key = hashlib.md5(
            f"{request.method}:{request.url.path}:{request.url.query}".encode()
        ).hexdigest()

        cached = cache.get(cache_key)
        if cached:
            return cached

        response = await call_next(request)

        if response.status_code == 200:
            cache.set(cache_key, response)

        return response
