from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

MAX_LOGIN_FAILURES = 5
LOGIN_WINDOW = timedelta(minutes=15)
LOGIN_LOCK_TIME = timedelta(minutes=15)


@dataclass
class LoginAttempt:
    failures: int = 0
    first_failed_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    locked_until: datetime | None = None


login_attempts: dict[str, LoginAttempt] = {}


def build_login_key(username: str, client_host: str | None) -> str:
    normalized_username = username.strip().lower() or "unknown"
    return f"{normalized_username}:{client_host or 'unknown'}"


def get_login_retry_after_seconds(key: str) -> int | None:
    attempt = login_attempts.get(key)
    if attempt is None:
        return None

    now = datetime.now(timezone.utc)
    if attempt.locked_until is None:
        if now - attempt.first_failed_at > LOGIN_WINDOW:
            login_attempts.pop(key, None)
        return None

    if attempt.locked_until <= now:
        login_attempts.pop(key, None)
        return None

    return max(1, int((attempt.locked_until - now).total_seconds()))


def record_login_failure(key: str) -> None:
    now = datetime.now(timezone.utc)
    attempt = login_attempts.get(key)

    if attempt is None or now - attempt.first_failed_at > LOGIN_WINDOW:
        attempt = LoginAttempt()
        login_attempts[key] = attempt

    attempt.failures += 1
    if attempt.failures >= MAX_LOGIN_FAILURES:
        attempt.locked_until = now + LOGIN_LOCK_TIME


def clear_login_failures(key: str) -> None:
    login_attempts.pop(key, None)
