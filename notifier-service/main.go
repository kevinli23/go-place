package main

import (
	"fmt"
	"net/http"
	"notifier-service/wsocket"
	"time"
)

func serveWs(pool *wsocket.Pool, w http.ResponseWriter, r *http.Request) {
	conn, err := wsocket.Upgrade(w, r)
	if err != nil {
		fmt.Fprintf(w, "%+v\n", err)
	}

	client := &wsocket.Client{
		Conn: conn,
		Pool: pool,
	}

	pool.Register <- client
	client.Read()
}

func main() {
	pool := wsocket.NewPool()
	go pool.Start()

	go func() {
		for {
			time.Sleep(5 * time.Second)
			pool.Broadcast <- wsocket.Message{Type: 0, Body: "100,12,3"}
		}
	}()

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(pool, w, r)
	})

	http.ListenAndServe(":8080", nil)
}
