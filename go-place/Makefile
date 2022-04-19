app/dev:
	gin -i -x /app/client --buildArgs -tags=internal -a ${port} -p ${hr} -b "goplace" -t ./ run ./main.go

build-internal:
	go build --tags=internal -o goplace .

build-linux:
	GOOS=linux GOARCH=amd64 go build --tags=prod -o go-place-api .

test:
	go test ./tests -v