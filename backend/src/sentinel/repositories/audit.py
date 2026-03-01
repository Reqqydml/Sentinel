from __future__ import annotations

import hashlib
import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4


class AuditRepository:
    def __init__(self, db_path: str) -> None:
        self.db_path = db_path
        self._ensure()

    def _ensure(self) -> None:
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS audit_log (
                  id TEXT PRIMARY KEY,
                  created_at TEXT NOT NULL,
                  model_version TEXT NOT NULL,
                  input_hash TEXT NOT NULL,
                  payload_json TEXT NOT NULL
                )
                """
            )
            conn.commit()

    def write(self, payload: dict, model_version: str = "v0.1") -> str:
        packed = json.dumps(payload, sort_keys=True)
        input_hash = hashlib.sha256(packed.encode("utf-8")).hexdigest()
        row_id = str(uuid4())
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT INTO audit_log (id, created_at, model_version, input_hash, payload_json) VALUES (?, ?, ?, ?, ?)",
                (row_id, datetime.now(UTC).isoformat(), model_version, input_hash, packed),
            )
            conn.commit()
        return row_id
