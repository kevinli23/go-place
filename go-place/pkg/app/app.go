package app

import (
	"context"
	"go/place/api/handlers"
	"go/place/pkg/cache"
	"go/place/pkg/config"
	"go/place/pkg/db"
	"go/place/pkg/queue"
	"log"

	"github.com/go-redis/redis/v8"
	"github.com/gocql/gocql"
	"gorm.io/gorm"
)

type App struct {
	AuthDB     *gorm.DB
	BoardDB    *gocql.Session
	Config     *config.Config
	BoardRedis *redis.Client
	BoardQueue *queue.BoardUpdateQueue
}

func InitApp() (*App, error) {
	cfg, err := config.LoadConfig("./", "app")
	if err != nil {
		return nil, err
	}

	authDB, err := db.InitAuthDB(cfg.GetAuthDBConnectionString())
	if err != nil {
		return nil, err
	}

	boardDB, err := db.InitBoardDB(cfg.CassandraURL, cfg.CassandraKeyspace)
	if err != nil {
		return nil, err
	}

	boardQueue, err := queue.InitRabbitMQConnection(cfg.GetRabbitMQConnectionString())
	if err != nil {
		return nil, err
	}

	boardRedis := cache.InitBoardRedisClient(cfg.RedisURL, cfg.RedisPassword)

	ctx := context.Background()

	for x := 0; x <= 20; x++ {
		for y := 0; y <= 20; y++ {
			pos := (x * 50) + (handlers.CANVAS_WIDTH * 50 * y)
			boardRedis.BitField(ctx, "canvas", "SET", "u50", pos, 0).Result()
		}
	}

	scanner := boardDB.Query(`SELECT x,y,color FROM pixel`).WithContext(ctx).Iter().Scanner()
	for scanner.Next() {
		var (
			x     int
			y     int
			color int
		)
		err = scanner.Scan(&x, &y, &color)
		if err != nil {
			log.Fatal(err)
		}
		boardRedis.BitField(ctx, "canvas", "SET", "u4", (x*4)+(handlers.CANVAS_WIDTH*4*y), color)
	}

	a := &App{}

	a.Config = cfg
	a.AuthDB = authDB
	a.BoardDB = boardDB
	a.BoardRedis = boardRedis
	a.BoardQueue = boardQueue

	return a, nil
}
