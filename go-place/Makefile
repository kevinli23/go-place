app/dev:
	gin -i --buildArgs -tags=internal -a ${port} -p ${hr} -b "goplace" -t ./ run ./main.go

test:
	go test ./tests -v