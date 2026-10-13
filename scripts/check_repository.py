"""Detect known secret formats and private paths in Git without printing values.

Run before publishing; --history also examines locally available Git history.
This is a guardrail, not a general personal-data classifier or a security audit.
"""

import argparse
import re
import subprocess
import sys
from pathlib import PurePosixPath


def git(*args):
    return subprocess.check_output(["git", *args])


def private_path(name):
    p = PurePosixPath(name.lower())
    if p.name == ".env.example":
        return False
    directories = {
        "data",
        "pgdata",
        "uploads",
        "backups",
        "outbox",
        "secrets",
        "credentials",
        "oauth-secrets",
        "documentos-privados",
        ".aws",
        ".ssh",
        ".azure",
        ".kube",
        ".gcloud",
        ".codex",
    }
    return (
        bool(set(p.parts) & directories)
        or any(
            part.startswith(
                ("pdf´s modulos", "pdf's modulos", "pdf’s modulos", "pdfs modulos")
            )
            for part in p.parts
        )
        or p.name == ".env"
        or p.name.startswith(".env.")
        or p.name in {".envrc", ".pgpass", "pgpass.conf", ".npmrc"}
        or p.suffix
        in {
            ".pem",
            ".key",
            ".p12",
            ".pfx",
            ".jks",
            ".keystore",
            ".cer",
            ".env",
            ".dump",
            ".backup",
            ".bak",
            ".db",
            ".sqlite",
            ".sqlite3",
            ".har",
            ".trace",
        }
        or p.name.endswith((".sql.gz", ".sql.zip"))
        or (
            p.suffix == ".sql"
            and any(word in p.name for word in ("dump", "backup", "respaldo"))
        )
        or (
            p.suffix == ".json"
            and p.name.startswith(
                (
                    "service-account",
                    "credentials",
                    "client_secret",
                    "token",
                    "storage-state",
                    "browser-state",
                )
            )
        )
    )


PATTERNS = {
    "private-key": re.compile(
        rb"-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----"
    ),
    "github-token": re.compile(
        rb"\b(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[A-Za-z0-9_]{70,255})\b"
    ),
    "aws-access-key": re.compile(rb"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    "google-api-key": re.compile(rb"\bAIza[A-Za-z0-9_-]{35}\b"),
    "google-oauth-secret": re.compile(rb"\bGOCSPX-[A-Za-z0-9_-]{20,255}\b"),
    "openai-key": re.compile(rb"\bsk-(?:proj-|svcacct-)[A-Za-z0-9_-]{40,255}\b"),
    "url-password": re.compile(
        rb"(?:postgres(?:ql)?(?:\+psycopg)?|mysql|redis)://[^\s/:]+:([^\s@]+)@"
    ),
}
SAFE_PASSWORDS = {b"change-me", b"clave", b"password", b"test-only-password"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--history", action="store_true")
    args = parser.parse_args()
    findings, checked = set(), set()
    revisions = [None]
    if args.history:
        revisions.extend(git("rev-list", "--all").decode().splitlines())
    for revision in revisions:
        entries = (
            git("ls-tree", "-rz", "--full-tree", revision)
            if revision
            else git("ls-files", "--stage", "-z")
        )
        for item in entries.split(b"\0"):
            if not item:
                continue
            meta, path = item.split(b"\t", 1)
            name = path.decode("utf-8")
            oid = meta.split()[2 if revision else 1].decode()
            where = revision[:8] if revision else "index"
            if private_path(name):
                findings.add((where, name, "private-path"))
            if oid in checked:
                continue
            checked.add(oid)
            data = git("cat-file", "blob", oid)
            if b"\0" in data:
                continue
            for label, pattern in PATTERNS.items():
                for match in pattern.finditer(data):
                    if label == "url-password" and match.group(1) in SAFE_PASSWORDS:
                        continue
                    line = data[: match.start()].count(b"\n") + 1
                    findings.add((where, name, f"{label}:line-{line}"))
    for where, name, category in sorted(findings):
        print(f"REVISAR {where} {name} ({category})")
    print(
        f"Revisados {len(checked)} blobs de Git; {len(findings)} hallazgos. Los valores no se muestran."
    )
    return bool(findings)


if __name__ == "__main__":
    sys.exit(main())
