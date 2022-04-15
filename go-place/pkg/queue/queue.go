package queue

import (
	"fmt"

	"github.com/streadway/amqp"
)

type BoardUpdateQueue struct {
	Conn *amqp.Connection
	Chan *amqp.Channel
}

func NewBoardUpdateMsg(msg string) amqp.Publishing {
	return amqp.Publishing{
		ContentType: "text/plain",
		Body:        []byte(msg),
	}
}

func InitRabbitMQConnection(url string) (*BoardUpdateQueue, error) {
	connectRabbitMQ, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}

	channelRabbitMQ, err := connectRabbitMQ.Channel()
	if err != nil {
		return nil, err
	}

	_, err = channelRabbitMQ.QueueDeclare(
		"BoardUpdate", // queue name
		true,          // durable
		false,         // auto delete
		false,         // exclusive
		false,         // no wait
		nil,           // arguments
	)
	if err != nil {
		return nil, err
	}

	return &BoardUpdateQueue{
		Conn: connectRabbitMQ,
		Chan: channelRabbitMQ,
	}, nil
}

func (q *BoardUpdateQueue) Close() {
	q.Conn.Close()
	q.Chan.Close()
}

func (q *BoardUpdateQueue) Publish(x, y, color int) error {
	message := fmt.Sprintf("%d,%d,%d", x, y, color)

	if err := q.Chan.Publish(
		"",                         // exchange
		"BoardUpdate",              // queue name
		false,                      // mandatory
		false,                      // immediate
		NewBoardUpdateMsg(message), // message to publish
	); err != nil {
		return err
	}

	return nil
}
