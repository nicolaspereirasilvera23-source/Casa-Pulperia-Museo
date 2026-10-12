package handlers

import (
	"encoding/json"
	"fmt"
	"html"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/resend/resend-go/v4"
)

const maxContactBodyBytes = 16 << 10

type ContactHandler struct {
	apiKey string
	from   string
	to     string
}

func NewContactHandler(apiKey, from, to string) *ContactHandler {
	return &ContactHandler{apiKey: apiKey, from: from, to: to}
}

func (h *ContactHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/contact", h.Send)
}

func (h *ContactHandler) Send(w http.ResponseWriter, r *http.Request) {
	if h.apiKey == "" || h.to == "" {
		writeError(w, http.StatusServiceUnavailable, "El correo de contacto no está configurado.")
		return
	}

	var payload struct {
		Email   string `json:"email"`
		Message string `json:"message"`
	}
	_ = json.NewDecoder(http.MaxBytesReader(w, r.Body, maxContactBodyBytes)).Decode(&payload)
	payload.Email = strings.TrimSpace(payload.Email)
	payload.Message = strings.TrimSpace(payload.Message)

	client := resend.NewClient(h.apiKey)
	params := &resend.SendEmailRequest{
		From:    h.from,
		To:      []string{h.to},
		Subject: "Solicitud de información · Casa-Pulpería Ezequiel Zamora",
		Html:    contactHTML(payload.Email, payload.Message, r.RemoteAddr, time.Now()),
	}

	sent, err := client.Emails.Send(params)
	if err != nil {
		log.Printf("contact send: %v", err)
		writeError(w, http.StatusBadGateway, "No se pudo enviar el correo. Inténtalo de nuevo.")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "id": sent.Id})
}

func contactHTML(email, message, remote string, now time.Time) string {
	var b strings.Builder
	b.WriteString("<p>Un visitante solicitó información desde el sitio de la Casa-Pulpería Ezequiel Zamora.</p>")
	b.WriteString("<ul>")
	fmt.Fprintf(&b, "<li><strong>Fecha:</strong> %s</li>", now.Format("02/01/2006 15:04 (Venezuela)"))
	if email != "" {
		fmt.Fprintf(&b, "<li><strong>Correo del visitante:</strong> %s</li>", html.EscapeString(email))
	}
	if message != "" {
		fmt.Fprintf(&b, "<li><strong>Mensaje:</strong> %s</li>", html.EscapeString(message))
	}
	fmt.Fprintf(&b, "<li><strong>Origen:</strong> %s</li>", html.EscapeString(remote))
	b.WriteString("</ul>")
	return b.String()
}
