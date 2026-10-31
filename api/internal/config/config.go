package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	SQLitePath   string
	ClientDir    string
	ResendAPIKey string
	ResendFrom   string
	ContactEmail string
}

func Load() Config {
	_ = godotenv.Load()

	return Config{
		Port:         getEnv("PORT", "8080"),
		SQLitePath:   getEnv("SQLITE_PATH", "./data/articulos.db"),
		ClientDir:    getEnv("CLIENT_DIR", "../client"),
		ResendAPIKey: getEnv("RESEND_API_KEY", ""),
		ResendFrom:   getEnv("RESEND_FROM", "onboarding@resend.dev"),
		ContactEmail: getEnv("CONTACT_EMAIL", ""),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
