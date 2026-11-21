from asyncio import run

import pytest
from sqlalchemy import event
from sqlalchemy.ext.asyncio import async_sessionmaker

from shared import db


def test_unit_of_work_commits_or_rolls_back(monkeypatch: pytest.MonkeyPatch) -> None:
    session_factory = async_sessionmaker(autobegin=False)
    monkeypatch.setattr(db, "_session_factory", lambda: session_factory)
    outcomes: list[str] = []

    def record_commit(_: object) -> None:
        outcomes.append("commit")

    def record_rollback(_: object) -> None:
        outcomes.append("rollback")

    async def exercise_transactions() -> None:
        async with db.unit_of_work() as successful_session:
            assert successful_session.in_transaction()
            event.listen(successful_session.sync_session, "after_commit", record_commit)

        assert not successful_session.in_transaction()

        with pytest.raises(ValueError, match="operation failed"):
            async with db.unit_of_work() as failed_session:
                assert failed_session is not successful_session
                assert failed_session.in_transaction()
                event.listen(
                    failed_session.sync_session, "after_rollback", record_rollback
                )
                raise ValueError("operation failed")

    run(exercise_transactions())
    assert outcomes == ["commit", "rollback"]
