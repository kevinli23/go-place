package cache

import "github.com/go-redis/redis/v8"

func InitBoardRedisClient(url, password string) *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:     url,
		Password: password,
		DB:       0, // use default DB
	})

	return rdb
}
