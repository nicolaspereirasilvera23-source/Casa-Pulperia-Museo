package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	MongoURI     string
	MongoDB      string
	ClientDir    string
	ResendAPIKey string
	ResendFrom   string
	ContactEmail string
}

func Load() Config {
	_ = godotenv.Load()

	return Config{
		Port:         getEnv("PORT", "8080"),
		MongoURI:     getEnv("MONGO_URI", "mongodb://localhost:27017"),
		MongoDB:      getEnv("MONGO_DB", "articulos"),
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
