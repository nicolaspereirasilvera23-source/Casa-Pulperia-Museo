package main

import (
	"context"
	"log"

	"api/internal/config"
	"api/internal/database"
	"api/internal/repository"
	"api/internal/server"
)

func main() {
	cfg := config.Load()

	_, db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("mongodb: %v", err)
	}

	articles := repository.NewArticleRepository(db)
	if err := articles.SeedIfEmpty(context.Background()); err != nil {
		log.Fatalf("seed artículos: %v", err)
	}

	srv, err := server.New(cfg, db)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("servidor en :%s", cfg.Port)
	if err := srv.Start(); err != nil {
		log.Fatal(err)
	}
}
