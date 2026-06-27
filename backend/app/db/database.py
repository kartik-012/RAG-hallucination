import sqlite3
import aiosqlite
from app.core.config import SQLITE_DB


def get_db_sync():
    conn = sqlite3.connect(SQLITE_DB)
    conn.row_factory = sqlite3.Row
    return conn


async def execute_query(query: str, params: tuple = ()):
    async with aiosqlite.connect(SQLITE_DB) as db:
        db.row_factory = aiosqlite.Row
        await db.execute(query, params)
        await db.commit()


async def fetch_one(query: str, params: tuple = ()):
    async with aiosqlite.connect(SQLITE_DB) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(query, params) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def fetch_all(query: str, params: tuple = ()):
    async with aiosqlite.connect(SQLITE_DB) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def execute_returning(query: str, params: tuple = ()):
    async with aiosqlite.connect(SQLITE_DB) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(query, params) as cursor:
            await db.commit()
            return cursor.lastrowid
