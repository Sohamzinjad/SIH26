import asyncio
import io
import zipfile

import pytest
from fastapi import HTTPException, UploadFile

from backend.routes.fleet import _collect_files, ZIP_SIZE_CAP, ZIP_MAX_MEMBERS


def _zip_upload(members):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for name, payload in members:
            z.writestr(name, payload)
    return UploadFile(io.BytesIO(buf.getvalue()), filename="bomb.zip")


def test_fleet_zip_size_cap_rejected():
    oversized = _zip_upload([("big.cfg", b"0" * (ZIP_SIZE_CAP + 1024))])
    with pytest.raises(HTTPException) as e:
        asyncio.run(_collect_files([], [oversized]))
    assert e.value.status_code == 400


def test_fleet_zip_member_cap_rejected():
    many_members = _zip_upload(
        [(f"f{i}.cfg", b"x") for i in range(ZIP_MAX_MEMBERS + 1)]
    )
    with pytest.raises(HTTPException) as e:
        asyncio.run(_collect_files([], [many_members]))
    assert e.value.status_code == 400