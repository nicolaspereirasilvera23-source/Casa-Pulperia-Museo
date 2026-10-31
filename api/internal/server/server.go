package server

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"api/internal/config"
	"api/internal/handlers"
	"api/internal/repository"
)

type Server struct {
	httpServer *http.Server
}

func New(cfg config.Config, db *sql.DB) (*Server, error) {
	clientDir, err := resolveClientDir(cfg.ClientDir)
	if err != nil {
		return nil, err
	}

	mux := http.NewServeMux()
	articles := repository.NewArticleRepository(db)
	handlers.NewArticleHandler(articles).Register(mux)
	handlers.NewContactHandler(cfg.ResendAPIKey, cfg.ResendFrom, cfg.ContactEmail).Register(mux)
	mux.Handle("/", http.FileServer(http.Dir(clientDir)))

	return &Server{
		httpServer: &http.Server{
			Addr:    ":" + cfg.Port,
			Handler: mux,
		},
	}, nil
}

func (s *Server) Start() error {
	return s.httpServer.ListenAndServe()
}

func resolveClientDir(path string) (string, error) {
	abs, err := filepath.Abs(path)
	if err != nil {
		return "", err
	}
	info, err := os.Stat(abs)
	if err != nil {
		return "", fmt.Errorf("directorio del client: %w", err)
	}
	if !info.IsDir() {
		return "", fmt.Errorf("directorio del client: %s no es una carpeta", abs)
	}
	return abs, nil
}
