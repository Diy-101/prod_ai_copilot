import asyncio
import os
from sqlalchemy import text
from app.core.database.session import SessionLocal

async def migrate():
    print("Starting migration: adding 'type' and 'recipe' to 'capabilities' table...")
    async with SessionLocal() as session:
        try:
            # 1. Add type column if it doesn't exist
            await session.execute(text(
                "ALTER TABLE capabilities ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'ATOMIC';"
            ))
            # 2. Add recipe column if it doesn't exist
            await session.execute(text(
                "ALTER TABLE capabilities ADD COLUMN IF NOT EXISTS recipe JSONB;"
            ))
            # 3. Make action_id nullable
            await session.execute(text(
                "ALTER TABLE capabilities ALTER COLUMN action_id DROP NOT NULL;"
            ))
            
            await session.commit()
            print("Migration completed successfully!")
        except Exception as e:
            await session.rollback()
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
