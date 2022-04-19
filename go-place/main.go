package main

import (
	"context"
	"embed"
	"go/place/api/router"
	"go/place/features"
	"go/place/pkg/app"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"
)

//go:embed build
var reactBuild embed.FS

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	inst, err := app.InitApp()
	if err != nil {
		log.Fatal(err)
	}

	r := router.Init(inst, reactBuild)

	log.Printf("Initializing the %s server on port: %s\n", features.EnvName, inst.Config.APIPort)

	srv := &http.Server{
		Addr:    ":" + inst.Config.APIPort,
		Handler: r,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil {
			log.Printf("server started: %s\n", err)
		}
	}()

	// Listen for the interrupt signal.
	<-ctx.Done()

	// Restore default behavior on the interrupt signal and notify user of shutdown.
	stop()
	log.Println("shutting down gracefully, press Ctrl+C again to force")

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown: ", err)
	}

	log.Println("Server exiting")
}
