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
	ID        string    `json:"id" bson:"_id"`
	Title     string    `json:"title" bson:"title"`
	Excerpt   string    `json:"excerpt" bson:"excerpt"`
	Content   string    `json:"content" bson:"content"`
	Category  string    `json:"category" bson:"category"`
	Status    string    `json:"status" bson:"status"`
	Cover     string    `json:"cover" bson:"cover"`
	CreatedAt time.Time `json:"createdAt" bson:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt" bson:"updatedAt"`
}

type ArticleInput struct {
	Title    string `json:"title"`
	Excerpt  string `json:"excerpt"`
	Content  string `json:"content"`
	Category string `json:"category"`
	Status   string `json:"status"`
	Cover    string `json:"cover"`
}

func ValidCategory(value string) bool {
	_, ok := categories[value]
	return ok
}

func ValidStatus(value string) bool {
	return value == StatusDraft || value == StatusPublished
}
