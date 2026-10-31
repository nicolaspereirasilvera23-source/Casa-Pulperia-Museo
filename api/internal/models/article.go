package models

import "time"

const (
	StatusDraft     = "draft"
	StatusPublished = "published"
)

var categories = map[string]struct{}{
	"Casa":       {},
	"Salas":      {},
	"Patio":      {},
	"Cronología": {},
	"Visita":     {},
}

type Article struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Excerpt   string    `json:"excerpt"`
	Content   string    `json:"content"`
	Category  string    `json:"category"`
	Status    string    `json:"status"`
	Cover     string    `json:"cover"`
	Image2    string    `json:"image2"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type ArticleInput struct {
	Title    string `json:"title"`
	Excerpt  string `json:"excerpt"`
	Content  string `json:"content"`
	Category string `json:"category"`
	Status   string `json:"status"`
	Cover    string `json:"cover"`
	Image2   string `json:"image2"`
}

func ValidCategory(value string) bool {
	_, ok := categories[value]
	return ok
}

func ValidStatus(value string) bool {
	return value == StatusDraft || value == StatusPublished
}
