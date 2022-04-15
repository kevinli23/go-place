app/dev:
	gin -i --buildArgs -tags=dev -a ${port} -p ${hr} -b "goplace" -t ./ run ./main.go

app/dev-local:
	gin -i -a 8080 -p 3000 -b "goplace" -t ./ run ./main.go

test:
	go test ./tests -v