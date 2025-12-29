# Database Documentation

## Overview

ItineraryWeaver uses **SQLite** for persistent storage of itineraries. The database is automatically initialized on first startup.

## Database Location

The database file is stored at:
```
data/itineraries.db
```

The `data/` directory is automatically created if it doesn't exist.

## Schema

### `itineraries` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `itinerary_id` | TEXT | PRIMARY KEY | Unique identifier for the itinerary |
| `reference_number` | TEXT | NOT NULL | Booking reference number |
| `title` | TEXT | NOT NULL | Itinerary title |
| `description` | TEXT | NULL | Itinerary description |
| `data_json` | TEXT | NOT NULL | Complete itinerary data as JSON |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

### Indexes

- `idx_reference_number` on `reference_number` - For fast lookups by reference
- `idx_created_at` on `created_at` - For sorting by creation date

## Database Module

The `app/database.py` module provides the following functions:

### `init_database()`
Initializes the database, creating tables and indexes if they don't exist.

### `save_itinerary(itinerary_dict: Dict[str, Any]) -> bool`
Saves or updates an itinerary in the database. Returns `True` on success.

### `get_itinerary(itinerary_id: str) -> Optional[Dict[str, Any]]`
Retrieves an itinerary by ID. Returns `None` if not found.

### `get_all_itineraries() -> List[Dict[str, Any]]`
Retrieves all itineraries, ordered by creation date (newest first).

### `delete_itinerary(itinerary_id: str) -> bool`
Deletes an itinerary by ID. Returns `True` if deleted, `False` if not found.

### `get_itinerary_by_reference(reference_number: str) -> Optional[Dict[str, Any]]`
Retrieves an itinerary by reference number. Returns the most recent if multiple exist.

### `count_itineraries() -> int`
Returns the total number of itineraries in the database.

## Data Storage Format

Itineraries are stored as JSON in the `data_json` column. This provides:
- **Flexibility**: Schema can evolve without migrations
- **Simplicity**: No complex joins needed
- **Performance**: Single query retrieves all data

The JSON structure matches the `ItineraryResponse` schema from the API.

## Initialization

The database is automatically initialized when the API server starts:

1. Database file and directory are created if needed
2. Tables and indexes are created if they don't exist
3. A demo itinerary is created if it doesn't already exist

## Backup and Migration

### Backup

To backup the database:
```bash
cp data/itineraries.db data/itineraries.db.backup
```

### Migration

Since we're using JSON storage, schema changes don't require migrations. However, if you need to modify the table structure:

1. Create a migration script
2. Use `sqlite3` command-line tool or Python's `sqlite3` module
3. Test the migration on a backup first

### Example Migration

```python
import sqlite3
from app.database import get_db_path

conn = sqlite3.connect(str(get_db_path()))
cursor = conn.cursor()

# Example: Add a new column
cursor.execute("ALTER TABLE itineraries ADD COLUMN status TEXT DEFAULT 'active'")

conn.commit()
conn.close()
```

## Production Considerations

For production use, consider:

1. **Regular backups**: Set up automated backups of the database file
2. **Connection pooling**: SQLite handles concurrent reads well, but writes are serialized
3. **File permissions**: Ensure proper file permissions on the database file
4. **Disk space**: Monitor database file size
5. **Performance**: For high-traffic applications, consider PostgreSQL or another database

## Troubleshooting

### Database locked error
- SQLite locks the database during writes
- Ensure only one process writes to the database at a time
- Use connection pooling or a connection manager

### File not found
- Ensure the `data/` directory exists and is writable
- Check file permissions

### Corrupted database
- SQLite is generally robust, but corruption can occur
- Restore from backup if available
- Use `sqlite3` command-line tool to check integrity:
  ```bash
  sqlite3 data/itineraries.db "PRAGMA integrity_check;"
  ```

