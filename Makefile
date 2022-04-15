docker/up:
	docker-compose up --build

docker/down:
	docker compose down

go-place/test:
	go test ./tests -v

