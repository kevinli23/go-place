app/dev:
	gin -i -x /app/client --buildArgs -tags=internal -a ${port} -p ${hr} -b "goplace" -t ./ run ./main.go

build-internal:
	go build --tags=internal -o goplace .

test:
	go test ./tests -v