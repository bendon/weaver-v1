#!/usr/bin/env python3
"""
Cleanup script to delete all conversations and start fresh
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import get_connection

def cleanup_conversations():
    """Delete all conversations and their messages"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Get count before deletion
        cursor.execute("SELECT COUNT(*) as count FROM conversations")
        conv_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) as count FROM conversation_messages")
        msg_count = cursor.fetchone()[0]
        
        print(f"Found {conv_count} conversations and {msg_count} messages")
        
        # Delete conversation messages first (due to foreign key)
        cursor.execute("DELETE FROM conversation_messages")
        deleted_messages = cursor.rowcount
        
        # Delete conversations
        cursor.execute("DELETE FROM conversations")
        deleted_conversations = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        print(f"SUCCESS: Deleted {deleted_conversations} conversations")
        print(f"SUCCESS: Deleted {deleted_messages} conversation messages")
        print("\nConversations cleaned up! You can now start fresh.")
        
    except Exception as e:
        print(f"Error cleaning up conversations: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("Cleaning up conversations...")
    print("=" * 50)
    success = cleanup_conversations()
    if success:
        print("=" * 50)
        print("Cleanup completed successfully!")
    else:
        print("=" * 50)
        print("Cleanup failed!")
        sys.exit(1)

