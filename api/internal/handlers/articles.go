package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"api/internal/models"
	"api/internal/repository"
)

const maxArticleBodyBytes = 12 << 20

type ArticleHandler struct {
	repo *repository.ArticleRepository
}

func NewArticleHandler(repo *repository.ArticleRepository) *ArticleHandler {
	return &ArticleHandler{repo: repo}
}

func (h *ArticleHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/articles", h.ListPublished)
	mux.HandleFunc("GET /api/articles/{id}", h.GetPublished)
	mux.HandleFunc("GET /api/admin/articles", h.List)
	mux.HandleFunc("POST /api/admin/articles", h.Create)
	mux.HandleFunc("GET /api/admin/articles/{id}", h.Get)
	mux.HandleFunc("PUT /api/admin/articles/{id}", h.Update)
	mux.HandleFunc("DELETE /api/admin/articles/{id}", h.Delete)
}

func (h *ArticleHandler) ListPublished(w http.ResponseWriter, r *http.Request) {
	h.list(w, r, true)
}

func (h *ArticleHandler) List(w http.ResponseWriter, r *http.Request) {
	h.list(w, r, false)
}

func (h *ArticleHandler) list(w http.ResponseWriter, r *http.Request, publishedOnly bool) {
	articles, err := h.repo.List(r.Context(), publishedOnly)
	if err != nil {
		log.Printf("articles list: %v", err)
		writeError(w, http.StatusInternalServerError, "No se pudieron cargar los artículos.")
		return
	}
	writeJSON(w, http.StatusOK, articles)
}

func (h *ArticleHandler) GetPublished(w http.ResponseWriter, r *http.Request) {
	article, ok := h.load(w, r)
	if !ok {
		return
	}
	if article.Status != models.StatusPublished {
		writeError(w, http.StatusNotFound, "No se encontró ese artículo.")
		return
	}
	writeJSON(w, http.StatusOK, article)
}

func (h *ArticleHandler) Get(w http.ResponseWriter, r *http.Request) {
	article, ok := h.load(w, r)
	if !ok {
		return
	}
	writeJSON(w, http.StatusOK, article)
}

func (h *ArticleHandler) Create(w http.ResponseWriter, r *http.Request) {
	input, ok := readArticleInput(w, r)
	if !ok {
		return
	}
	article, err := h.repo.Create(r.Context(), input)
	if err != nil {
		log.Printf("articles create: %v", err)
		writeError(w, http.StatusInternalServerError, "No se pudo guardar el artículo.")
		return
	}
	writeJSON(w, http.StatusCreated, article)
}

func (h *ArticleHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	input, ok := readArticleInput(w, r)
	if !ok {
		return
	}
	article, err := h.repo.Update(r.Context(), id, input)
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "No se encontró ese artículo.")
		return
	}
	if err != nil {
		log.Printf("articles update: %v", err)
		writeError(w, http.StatusInternalServerError, "No se pudo guardar el artículo.")
		return
	}
	writeJSON(w, http.StatusOK, article)
}

func (h *ArticleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	err := h.repo.Delete(r.Context(), id)
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "No se encontró ese artículo.")
		return
	}
	if err != nil {
		log.Printf("articles delete: %v", err)
		writeError(w, http.StatusInternalServerError, "No se pudo eliminar el artículo.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ArticleHandler) load(w http.ResponseWriter, r *http.Request) (models.Article, bool) {
	article, err := h.repo.Get(r.Context(), r.PathValue("id"))
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "No se encontró ese artículo.")
		return models.Article{}, false
	}
	if err != nil {
		log.Printf("articles get: %v", err)
		writeError(w, http.StatusInternalServerError, "No se pudo cargar el artículo.")
		return models.Article{}, false
	}
	return article, true
}

func readArticleInput(w http.ResponseWriter, r *http.Request) (models.ArticleInput, bool) {
	r.Body = http.MaxBytesReader(w, r.Body, maxArticleBodyBytes)
	defer r.Body.Close()

	var input models.ArticleInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			writeError(w, http.StatusRequestEntityTooLarge, "La petición supera el tamaño permitido.")
			return models.ArticleInput{}, false
		}
		writeError(w, http.StatusBadRequest, "El cuerpo de la petición no es válido.")
		return models.ArticleInput{}, false
	}

	input.Title = strings.TrimSpace(input.Title)
	input.Excerpt = strings.TrimSpace(input.Excerpt)
	input.Content = strings.TrimSpace(input.Content)
	input.Category = strings.TrimSpace(input.Category)
	input.Status = strings.TrimSpace(input.Status)

	switch {
	case input.Title == "":
		writeError(w, http.StatusBadRequest, "El título es obligatorio.")
		return models.ArticleInput{}, false
	case input.Content == "":
		writeError(w, http.StatusBadRequest, "El cuerpo es obligatorio.")
		return models.ArticleInput{}, false
	case !models.ValidCategory(input.Category):
		writeError(w, http.StatusBadRequest, "La categoría no es válida.")
		return models.ArticleInput{}, false
	case !models.ValidStatus(input.Status):
		writeError(w, http.StatusBadRequest, "El estado no es válido.")
		return models.ArticleInput{}, false
	}

	return input, true
}
