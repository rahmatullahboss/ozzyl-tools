from __future__ import annotations

import argparse
import base64
import hashlib
import io
import shutil
import tarfile
from pathlib import Path

EXPECTED_SHA256 = "ad5b084cdd1238e3f06052af34fc5727936872e82416b12b4525c2f21eb6edda"
SOURCE_DIR = Path(__file__).resolve().parent / ".bootstrap"


def build_archive() -> bytes:
    parts = sorted(SOURCE_DIR.glob("part-*"))
    if not parts:
        raise RuntimeError("Production source archive parts are missing.")

    encoded = b"".join(part.read_bytes() for part in parts)
    archive = base64.b64decode(encoded, validate=True)
    digest = hashlib.sha256(archive).hexdigest()
    if digest != EXPECTED_SHA256:
        raise RuntimeError(f"Source archive checksum mismatch: {digest}")
    return archive


def safe_extract(archive: bytes, destination: Path) -> None:
    destination = destination.resolve()
    destination.mkdir(parents=True, exist_ok=True)

    with tarfile.open(fileobj=io.BytesIO(archive), mode="r:gz") as bundle:
        for member in bundle.getmembers():
            target = (destination / member.name).resolve()
            if destination not in target.parents and target != destination:
                raise RuntimeError(f"Unsafe archive path: {member.name}")
            if member.issym() or member.islnk():
                raise RuntimeError(f"Archive links are not allowed: {member.name}")
        bundle.extractall(destination, filter="data")


def materialize(destination: Path, cleanup: bool = False) -> None:
    safe_extract(build_archive(), destination)
    if cleanup:
        shutil.rmtree(SOURCE_DIR, ignore_errors=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Materialize the verified Ozzyl Tools source tree.")
    parser.add_argument("--materialize", type=Path, default=Path.cwd(), metavar="DIRECTORY")
    parser.add_argument("--cleanup", action="store_true", help="Remove archive parts after extraction.")
    args = parser.parse_args()
    materialize(args.materialize, cleanup=args.cleanup)
    print(f"Ozzyl Tools source materialized in {args.materialize.resolve()}")


if __name__ == "__main__":
    main()
