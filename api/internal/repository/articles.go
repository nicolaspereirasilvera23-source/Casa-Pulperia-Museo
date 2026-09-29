package repository

import (
	"context"
	"errors"
	"time"

	"api/internal/models"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var ErrNotFound = errors.New("article not found")

type ArticleRepository struct {
	coll *mongo.Collection
}

func NewArticleRepository(db *mongo.Database) *ArticleRepository {
	return &ArticleRepository{coll: db.Collection("articles")}
}

func (r *ArticleRepository) List(ctx context.Context, publishedOnly bool) ([]models.Article, error) {
	filter := bson.D{}
	if publishedOnly {
		filter = bson.D{{Key: "status", Value: models.StatusPublished}}
	}

	cursor, err := r.coll.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "updatedAt", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	articles := make([]models.Article, 0)
	if err := cursor.All(ctx, &articles); err != nil {
		return nil, err
	}
	return articles, nil
}

func (r *ArticleRepository) Get(ctx context.Context, id string) (models.Article, error) {
	var article models.Article
	err := r.coll.FindOne(ctx, bson.D{{Key: "_id", Value: id}}).Decode(&article)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return models.Article{}, ErrNotFound
	}
	if err != nil {
		return models.Article{}, err
	}
	return article, nil
}

func (r *ArticleRepository) Create(ctx context.Context, input models.ArticleInput) (models.Article, error) {
	now := time.Now().UTC()
	article := models.Article{
		ID:        bson.NewObjectID().Hex(),
		Title:     input.Title,
		Excerpt:   input.Excerpt,
		Content:   input.Content,
		Category:  input.Category,
		Status:    input.Status,
		Cover:     input.Cover,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if _, err := r.coll.InsertOne(ctx, article); err != nil {
		return models.Article{}, err
	}
	return article, nil
}

func (r *ArticleRepository) Update(ctx context.Context, id string, input models.ArticleInput) (models.Article, error) {
	now := time.Now().UTC()
	result, err := r.coll.UpdateOne(ctx, bson.D{{Key: "_id", Value: id}}, bson.D{{
		Key: "$set",
		Value: bson.D{
			{Key: "title", Value: input.Title},
			{Key: "excerpt", Value: input.Excerpt},
			{Key: "content", Value: input.Content},
			{Key: "category", Value: input.Category},
			{Key: "status", Value: input.Status},
			{Key: "cover", Value: input.Cover},
			{Key: "updatedAt", Value: now},
		},
	}})
	if err != nil {
		return models.Article{}, err
	}
	if result.MatchedCount == 0 {
		return models.Article{}, ErrNotFound
	}
	return r.Get(ctx, id)
}

func (r *ArticleRepository) Delete(ctx context.Context, id string) error {
	result, err := r.coll.DeleteOne(ctx, bson.D{{Key: "_id", Value: id}})
	if err != nil {
		return err
	}
	if result.DeletedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *ArticleRepository) SeedIfEmpty(ctx context.Context) error {
	count, err := r.coll.CountDocuments(ctx, bson.D{})
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	seed := demoArticles()
	docs := make([]any, len(seed))
	for i := range seed {
		docs[i] = seed[i]
	}
	_, err = r.coll.InsertMany(ctx, docs)
	return err
}

func demoArticles() []models.Article {
	return []models.Article{
		{
			ID:        "a1",
			Title:     "La pulpería del General del Pueblo Soberano",
			Excerpt:   "La antigua tienda de Ezequiel Zamora, reconstruida como museo y café cultural en Villa de Cura.",
			Content:   "La Casa-Pulpería abre sus salas para contar el pensamiento civil y la Guerra Federal. El recorrido une la casa, el patio y las piezas que guardan la memoria de Villa de Cura.",
			Category:  "Casa",
			Status:    models.StatusPublished,
			Cover:     "",
			CreatedAt: time.Date(2026, 8, 12, 10, 0, 0, 0, time.UTC),
			UpdatedAt: time.Date(2026, 8, 20, 14, 30, 0, 0, time.UTC),
		},
		{
			ID:        "a2",
			Title:     "Cronología federal: de la pulpería al museo",
			Excerpt:   "Hitos de la vida de Zamora y de la casa que hoy opera como espacio cultural.",
			Content:   "Borrador de la línea de tiempo para la sala de cronología. Pendiente de revisión de fechas y fuentes.",
			Category:  "Cronología",
			Status:    models.StatusDraft,
			Cover:     "",
			CreatedAt: time.Date(2026, 8, 22, 9, 0, 0, 0, time.UTC),
			UpdatedAt: time.Date(2026, 8, 28, 11, 15, 0, 0, time.UTC),
		},
	}
}
