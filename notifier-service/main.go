package main

import (
	"fmt"
	"log"
	"net/http"
	"notifier-service/config"
	"notifier-service/wsocket"

	"github.com/streadway/amqp"
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
	cfg, err := config.LoadConfig("./", "app")
	if err != nil {
		log.Fatal(err)
	}

	pool := wsocket.NewPool()
	go pool.Start()

	go func() {
		amqpServerURL := cfg.GetRabbitMQConnectionString()

		connectRabbitMQ, err := amqp.Dial(amqpServerURL)
		if err != nil {
			panic(err)
		}
		defer connectRabbitMQ.Close()

		channelRabbitMQ, err := connectRabbitMQ.Channel()
		if err != nil {
			panic(err)
		}
		defer channelRabbitMQ.Close()

		messages, err := channelRabbitMQ.Consume(
			"BoardUpdate", // queue name
			"",            // consumer
			true,          // auto-ack
			false,         // exclusive
			false,         // no local
			false,         // no wait
			nil,           // arguments
		)
		if err != nil {
			log.Println(err)
		}

		forever := make(chan bool)

		go func() {
			for message := range messages {
				pool.Broadcast <- wsocket.NewMessage(string(message.Body))
			}
		}()

		<-forever
	}()

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(pool, w, r)
	})

	fmt.Printf("Starting websocket notifier service on port: %s\n", cfg.APIPort)
	http.ListenAndServe(":"+cfg.APIPort, nil)
}
