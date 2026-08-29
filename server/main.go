package main

import (
	"net/http"
	"os"
)


func main (){

	PORT, exist := os.LookupEnv("PORT")

	if !exist{
		PORT = "3000"
	}

	mux:= http.NewServeMux()
	http.ListenAndServe(":"+PORT, mux)
}