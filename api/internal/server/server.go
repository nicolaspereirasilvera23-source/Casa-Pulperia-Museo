package server

import (
	"net/http"

	"api/internal/config"
)

type Server struct {
	httpServer *http.Server
}

func New(cfg config.Config) *Server {
	mux := http.NewServeMux()

	return &Server{
		httpServer: &http.Server{
			Addr:    ":" + cfg.Port,
			Handler: mux,
		},
	}
}

func (s *Server) Start() error {
	return s.httpServer.ListenAndServe()
}
