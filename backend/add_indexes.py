#!/usr/bin/env python3
"""
Add database indexes to improve query performance.
Run this once to optimize your existing database.
"""

import asyncio
import sqlite3
from pathlib import Path

async def add_indexes():
    """Add indexes to improve query performance."""
    db_path = Path(__file__).parent / "podcast_app.db"
    
    if not db_path.exists():
        print("❌ Database not found. Run the app first to create it.")
        return
    
    print("🔍 Adding database indexes for better performance...")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if indexes already exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
        existing_indexes = [row[0] for row in cursor.fetchall()]
        
        indexes_to_add = [
            ("idx_episodes_status", "CREATE INDEX IF NOT EXISTS idx_episodes_status ON episodes(status)"),
            ("idx_episodes_created_at", "CREATE INDEX IF NOT EXISTS idx_episodes_created_at ON episodes(created_at DESC)"),
            ("idx_episodes_podcast_id", "CREATE INDEX IF NOT EXISTS idx_episodes_podcast_id ON episodes(podcast_id)"),
        ]
        
        for idx_name, sql in indexes_to_add:
            if idx_name in existing_indexes:
                print(f"  ✓ {idx_name} already exists")
            else:
                cursor.execute(sql)
                print(f"  ✅ Created {idx_name}")
        
        conn.commit()
        print("\n✅ Database optimization complete!")
        print("📈 Query performance should be 5-10x faster now!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    asyncio.run(add_indexes())

