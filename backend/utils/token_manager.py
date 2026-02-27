"""
Token rotation manager for Apify API keys.
Rotates through multiple keys when one is exhausted.
"""

import threading
from typing import List, Optional


class TokenManager:
    """Manages rotation of API tokens."""

    def __init__(self, tokens: List[str]):
        if not tokens:
            raise ValueError("At least one token is required")
        self._tokens = [t for t in tokens if t]  # Filter empty strings
        if not self._tokens:
            raise ValueError("At least one non-empty token is required")
        self._current_index = 0
        self._lock = threading.Lock()
        self._exhausted: set[int] = set()

    @property
    def current_token(self) -> str:
        """Get the current active token."""
        with self._lock:
            return self._tokens[self._current_index]

    def rotate(self) -> Optional[str]:
        """
        Rotate to the next available token.
        Returns the new token, or None if all tokens are exhausted.
        """
        with self._lock:
            self._exhausted.add(self._current_index)

            # Find next non-exhausted token
            for _ in range(len(self._tokens)):
                self._current_index = (self._current_index + 1) % len(self._tokens)
                if self._current_index not in self._exhausted:
                    return self._tokens[self._current_index]

            return None  # All tokens exhausted

    def mark_exhausted(self) -> Optional[str]:
        """Mark current token as exhausted and rotate to next."""
        return self.rotate()

    def reset(self) -> None:
        """Reset all tokens to available state."""
        with self._lock:
            self._exhausted.clear()
            self._current_index = 0

    @property
    def has_available_tokens(self) -> bool:
        """Check if there are any non-exhausted tokens."""
        with self._lock:
            return len(self._exhausted) < len(self._tokens)

    @property
    def available_count(self) -> int:
        """Get count of available (non-exhausted) tokens."""
        with self._lock:
            return len(self._tokens) - len(self._exhausted)
