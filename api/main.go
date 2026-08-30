package main

import (
	"log"

	"api/internal/config"
	"api/internal/database"
	"api/internal/server"
)

func main() {
	cfg := config.Load()

	_, _, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("mongodb: %v", err)
	}

	srv := server.New(cfg)
	log.Printf("servidor en :%s", cfg.Port)
	if err := srv.Start(); err != nil {
		log.Fatal(err)
	}
}
