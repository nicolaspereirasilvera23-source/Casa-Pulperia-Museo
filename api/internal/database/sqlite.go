package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	_ "modernc.org/sqlite"
)

func Connect(path string) (*sql.DB, error) {
	if path != ":memory:" {
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			return nil, fmt.Errorf("crear directorio de SQLite: %w", err)
		}
	}
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	if _, err := db.Exec(`PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;`); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("configurar SQLite: %w", err)
	}
	if err := migrate(db); err != nil {
		_ = db.Close()
		return nil, err
	}
	return db, nil
}

func migrate(db *sql.DB) error {
	const schema = `CREATE TABLE IF NOT EXISTS articles (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		excerpt TEXT NOT NULL DEFAULT '',
		content TEXT NOT NULL,
		category TEXT NOT NULL,
		status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
		cover TEXT NOT NULL DEFAULT '',
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_articles_updated_at ON articles(updated_at DESC);
	CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);`
	if _, err := db.Exec(schema); err != nil {
		return fmt.Errorf("crear esquema SQLite: %w", err)
	}
	// Older local demo databases only had a single cover image.
	if _, err := db.Exec(`ALTER TABLE articles ADD COLUMN image2 TEXT NOT NULL DEFAULT ''`); err != nil && !isDuplicateColumn(err) {
		return fmt.Errorf("actualizar esquema SQLite: %w", err)
	}
	return nil
}

func isDuplicateColumn(err error) bool {
	return err != nil && strings.Contains(err.Error(), "duplicate column")
}
