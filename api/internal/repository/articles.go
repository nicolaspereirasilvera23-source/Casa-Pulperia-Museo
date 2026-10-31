package repository

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"api/internal/models"
)

var ErrNotFound = errors.New("article not found")

type ArticleRepository struct{ db *sql.DB }

func NewArticleRepository(db *sql.DB) *ArticleRepository { return &ArticleRepository{db: db} }

const articleColumns = `id, title, excerpt, content, category, status, cover, image2, created_at, updated_at`

type scanner interface{ Scan(...any) error }

func scanArticle(row scanner) (models.Article, error) {
	var a models.Article
	var created, updated string
	if err := row.Scan(&a.ID, &a.Title, &a.Excerpt, &a.Content, &a.Category, &a.Status, &a.Cover, &a.Image2, &created, &updated); err != nil {
		return a, err
	}
	a.CreatedAt, _ = time.Parse(time.RFC3339Nano, created)
	a.UpdatedAt, _ = time.Parse(time.RFC3339Nano, updated)
	return a, nil
}

func (r *ArticleRepository) List(ctx context.Context, publishedOnly bool) ([]models.Article, error) {
	query := `SELECT ` + articleColumns + ` FROM articles ORDER BY updated_at DESC`
	if publishedOnly {
		query = `SELECT ` + articleColumns + ` FROM articles WHERE status = ? ORDER BY updated_at DESC`
	}
	args := []any{}
	if publishedOnly {
		args = append(args, models.StatusPublished)
	}
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	articles := make([]models.Article, 0)
	for rows.Next() {
		a, err := scanArticle(rows)
		if err != nil {
			return nil, err
		}
		articles = append(articles, a)
	}
	return articles, rows.Err()
}

func (r *ArticleRepository) Get(ctx context.Context, id string) (models.Article, error) {
	a, err := scanArticle(r.db.QueryRowContext(ctx, `SELECT `+articleColumns+` FROM articles WHERE id = ?`, id))
	if errors.Is(err, sql.ErrNoRows) {
		return models.Article{}, ErrNotFound
	}
	return a, err
}

func (r *ArticleRepository) Create(ctx context.Context, input models.ArticleInput) (models.Article, error) {
	now := time.Now().UTC()
	var idBytes [16]byte
	if _, err := rand.Read(idBytes[:]); err != nil {
		return models.Article{}, err
	}
	a := articleFromInput(input, hex.EncodeToString(idBytes[:]), now, now)
	_, err := r.db.ExecContext(ctx, `INSERT INTO articles (`+articleColumns+`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, a.ID, a.Title, a.Excerpt, a.Content, a.Category, a.Status, a.Cover, a.Image2, a.CreatedAt.Format(time.RFC3339Nano), a.UpdatedAt.Format(time.RFC3339Nano))
	return a, err
}

func (r *ArticleRepository) Update(ctx context.Context, id string, input models.ArticleInput) (models.Article, error) {
	result, err := r.db.ExecContext(ctx, `UPDATE articles SET title=?, excerpt=?, content=?, category=?, status=?, cover=?, image2=?, updated_at=? WHERE id=?`, input.Title, input.Excerpt, input.Content, input.Category, input.Status, input.Cover, input.Image2, time.Now().UTC().Format(time.RFC3339Nano), id)
	if err != nil {
		return models.Article{}, err
	}
	count, err := result.RowsAffected()
	if err != nil {
		return models.Article{}, err
	}
	if count == 0 {
		return models.Article{}, ErrNotFound
	}
	return r.Get(ctx, id)
}

func (r *ArticleRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM articles WHERE id = ?`, id)
	if err != nil {
		return err
	}
	count, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if count == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *ArticleRepository) SeedIfEmpty(ctx context.Context) error {
	var count int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM articles`).Scan(&count); err != nil {
		return err
	}
	if count != 0 {
		return nil
	}
	for _, a := range demoArticles() {
		_, err := r.db.ExecContext(ctx, `INSERT INTO articles (`+articleColumns+`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, a.ID, a.Title, a.Excerpt, a.Content, a.Category, a.Status, a.Cover, a.Image2, a.CreatedAt.Format(time.RFC3339Nano), a.UpdatedAt.Format(time.RFC3339Nano))
		if err != nil {
			return err
		}
	}
	return nil
}

func articleFromInput(input models.ArticleInput, id string, created, updated time.Time) models.Article {
	return models.Article{ID: id, Title: strings.TrimSpace(input.Title), Excerpt: strings.TrimSpace(input.Excerpt), Content: strings.TrimSpace(input.Content), Category: input.Category, Status: input.Status, Cover: input.Cover, Image2: input.Image2, CreatedAt: created, UpdatedAt: updated}
}

func demoArticles() []models.Article {
	return []models.Article{
		{ID: "a1", Title: "La pulpería del General del Pueblo Soberano", Excerpt: "La antigua tienda de Ezequiel Zamora, reconstruida como museo y café cultural en Villa de Cura.", Content: "La Casa-Pulpería abre sus salas para contar el pensamiento civil y la Guerra Federal. El recorrido une la casa, el patio y las piezas que guardan la memoria de Villa de Cura.", Category: "Casa", Status: models.StatusPublished, CreatedAt: time.Date(2026, 8, 12, 10, 0, 0, 0, time.UTC), UpdatedAt: time.Date(2026, 8, 20, 14, 30, 0, 0, time.UTC)},
		{ID: "a2", Title: "Cronología federal: de la pulpería al museo", Excerpt: "Hitos de la vida de Zamora y de la casa que hoy opera como espacio cultural.", Content: "Borrador de la línea de tiempo para la sala de cronología. Pendiente de revisión de fechas y fuentes.", Category: "Cronología", Status: models.StatusDraft, CreatedAt: time.Date(2026, 8, 22, 9, 0, 0, 0, time.UTC), UpdatedAt: time.Date(2026, 8, 28, 11, 15, 0, 0, time.UTC)},
	}
}
