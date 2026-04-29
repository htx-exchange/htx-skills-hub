.PHONY: all build install test clean

BIN := bin/htx-cli

all: build

build:
	go build -o $(BIN) ./cmd/htx-cli

install:
	go install ./cmd/htx-cli

test:
	go test ./...

test-no-live:
	HTX_DISABLE_LIVE=1 go test ./...

clean:
	rm -f $(BIN)
	go clean
