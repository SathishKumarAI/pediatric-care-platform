"""Point the store at a throwaway SQLite DB so tests never touch dev data and
always start clean. Runs before any `app` import (pytest imports conftest first).
"""
import os
import tempfile

_dir = tempfile.mkdtemp(prefix="pcp_test_")
os.environ["DATABASE_URL"] = f"sqlite:///{_dir}/test.db"
