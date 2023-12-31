package main

import (
	"embed"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

//go:embed dist/*
var content embed.FS

func GetWorkDir() string {
	ex, err := os.Executable()
	if err != nil {
		panic(err)
	}

	dir := filepath.Dir(ex)

	// Helpful when developing:
	// when running `go run`, the executable is in a temporary directory.
	if strings.Contains(dir, "go-build") {
		return "."
	}
	return filepath.Dir(ex)
}

func AppendPrefix(prefix string, h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		trimDuplicates := func(str string, duplicate string) string {
			regex := regexp.MustCompile("(?:" + duplicate + "){2,}")

			return regex.ReplaceAllString(str, duplicate)
		}

		// Get the original URL.
		url := r.URL

		regex := regexp.MustCompile("[.][a-zA-Z]+$")
		if regex.MatchString(url.Path) {
			// has an extension, serve as normal.
			url.Path = trimDuplicates(prefix+url.Path, "/")
		} else if url.Path == "/" {
			// asking for the root path, serve as normal
			url.Path = trimDuplicates(prefix+url.Path, "/")
		} else {
			// path is not asking for a static asset, redirect to index.
			url.Path = trimDuplicates(prefix+"/index.html", "/")
		}

		h.ServeHTTP(w, r)
	})
}

func main() {
	fs := http.FileServer(http.FS(content))

	http.Handle("/", AppendPrefix("/dist", fs))
	http.ListenAndServe(":46852", nil)
}

//func main() {
//	fs := http.FileServer(http.FS(content))

//	http.Handle("/", AppendPrefix("/dist", fs))

//	go http.ListenAndServe(":46852", nil)

//	debug := true
//	w := webview.New(debug)
//	if w == nil {

//		log.Fatalln("Failed to load webview.")
//	}
//	defer w.Destroy()

//	w.SetTitle("Minimal webview example")
//	w.SetSize(800, 600, webview.HintNone)

//	w.Navigate("http://localhost:46852/index.html")

//	//if GetWorkDir() == "." {
//	//	w.Navigate("http://localhost:5173")
//	//} else {
//	//	w.Navigate("http://localhost:46852/index.html")
//	//}

//	w.Run()
//}
