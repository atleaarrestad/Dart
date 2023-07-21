# Linux, macOS
env GOOS=linux GOARCH=arm64 go build -o prepnode_arm64
go build -o build/dart_linux main.go
# Windows
go build -ldflags="-H windowsgui" -o build/main.exe main.go