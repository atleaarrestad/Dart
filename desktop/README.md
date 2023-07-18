# Linux, macOS
go build -o build/basic basic.go && ./build/basic
# Windows
go build -ldflags="-H windowsgui" -o build/main.exe main.go