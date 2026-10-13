import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCANNER = Path(__file__).with_name("check_repository.py").resolve()


class RepositoryGuardTest(unittest.TestCase):
    def test_blocks_private_files_and_masks_detected_credentials(self):
        with tempfile.TemporaryDirectory(prefix="uto-repo-guard-") as directory:
            root = Path(directory)
            subprocess.run(["git", "init", "-q", directory], check=True)
            # Deliberately synthetic credential; never valid or used by a service.
            synthetic = "ghp_" + "0" * 36
            (root / ".env.local").write_text("PRIVATE_CONFIG=example", encoding="utf-8")
            (root / "leak.txt").write_text(synthetic, encoding="utf-8")
            subprocess.run(["git", "-C", directory, "add", "."], check=True)
            result = subprocess.run(
                [sys.executable, str(SCANNER)], cwd=root, capture_output=True, text=True
            )
            self.assertEqual(result.returncode, 1)
            self.assertIn("private-path", result.stdout)
            self.assertIn("github-token", result.stdout)
            self.assertNotIn(synthetic, result.stdout + result.stderr)

    def test_accepts_sanitized_example_and_migration_source(self):
        with tempfile.TemporaryDirectory(prefix="uto-repo-guard-") as directory:
            root = Path(directory)
            subprocess.run(["git", "init", "-q", directory], check=True)
            (root / ".env.example").write_text(
                "DATABASE_URL=postgresql://uto:change-me@localhost/uto",
                encoding="utf-8",
            )
            (root / "migration.sql").write_text(
                "CREATE TABLE example (id integer);", encoding="utf-8"
            )
            subprocess.run(["git", "-C", directory, "add", "."], check=True)
            result = subprocess.run(
                [sys.executable, str(SCANNER)], cwd=root, capture_output=True, text=True
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_blocks_oauth_exports_and_browser_traces(self):
        with tempfile.TemporaryDirectory(prefix="uto-oauth-guard-") as directory:
            root = Path(directory)
            subprocess.run(["git", "init", "-q", directory], check=True)
            for name in [
                "client_secret_example.json",
                "token-example.json",
                "storage-state.json",
                "session.har",
            ]:
                (root / name).write_text("{}", encoding="utf-8")
            subprocess.run(["git", "-C", directory, "add", "."], check=True)
            result = subprocess.run(
                [sys.executable, str(SCANNER)], cwd=root, capture_output=True, text=True
            )
            self.assertEqual(result.returncode, 1)
            self.assertEqual(result.stdout.count("private-path"), 4)


if __name__ == "__main__":
    unittest.main()
