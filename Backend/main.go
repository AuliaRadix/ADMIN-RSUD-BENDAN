package main

import (
	"encoding/json"
	"html/template"
	"net/http"
	"strings"

	"github.com/dchest/captcha"
	"github.com/gorilla/sessions"
)

// ================= TEMPLATE =================
var tmpl = template.Must(
	template.ParseFiles("../templates/login.gohtml"),
)

// ================= SESSION =================
var store = sessions.NewCookieStore(
	[]byte("super-secret-key-123456789"),
)

// ================= LOGIN =================
func loginHandler(w http.ResponseWriter, r *http.Request) {

	session, _ := store.Get(r, "admin-session")

	// kalau sudah login → index
	if auth, ok := session.Values["authenticated"].(bool); ok && auth {
		http.Redirect(w, r, "/index.html", http.StatusSeeOther)
		return
	}

	switch r.Method {

	case http.MethodGet:

		id := captcha.New()

		tmpl.Execute(w, map[string]interface{}{
			"CaptchaId": id,
		})

	case http.MethodPost:

		r.ParseForm()

		username := r.FormValue("username")
		password := r.FormValue("password")
		id := r.FormValue("captchaId")
		input := r.FormValue("captcha")

		// verify captcha
		if !captcha.VerifyString(id, input) {
			tmpl.Execute(w, map[string]interface{}{
				"CaptchaId": captcha.New(),
				"Error":     "Captcha salah!",
			})
			return
		}

		// dummy login (ganti bcrypt di production)
		if username != "admin" || password != "admin123" {
			tmpl.Execute(w, map[string]interface{}{
				"CaptchaId": captcha.New(),
				"Error":     "Username atau password salah",
			})
			return
		}

		session.Values["authenticated"] = true
		session.Save(r, w)

		http.Redirect(w, r, "/index.html", http.StatusSeeOther)
	}
}

// ================= RELOAD CAPTCHA =================
func reloadCaptchaHandler(w http.ResponseWriter, r *http.Request) {

	id := captcha.New()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"id": id,
	})
}

// ================= LOGOUT =================
func logoutHandler(w http.ResponseWriter, r *http.Request) {

	session, _ := store.Get(r, "admin-session")

	session.Options.MaxAge = -1
	session.Save(r, w)

	http.Redirect(w, r, "/login", http.StatusSeeOther)
}

// ================= MIDDLEWARE =================
func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		// 1. Berikan pengecualian untuk file statis dan halaman login
		if path == "/login" ||
			path == "/reload-captcha" ||
			strings.HasPrefix(path, "/captcha/") ||
			strings.HasPrefix(path, "/assets/") ||
			strings.HasPrefix(path, "/static/") {
			next.ServeHTTP(w, r)
			return
		}

		session, _ := store.Get(r, "admin-session")
		auth, ok := session.Values["authenticated"].(bool)

		// 2. Jika BELUM login, lempar ke /login
		if !ok || !auth {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}

		// 3. Jika SUDAH login dan akses root "/"
		if path == "/" {
			http.ServeFile(w, r, "../index.html")
			return
		}

		next.ServeHTTP(w, r)
	})
}

// ================= MAIN =================
func main() {

	mux := http.NewServeMux()

	// captcha image
	mux.Handle("/captcha/", captcha.Server(
		captcha.StdWidth,
		captcha.StdHeight,
	))

	// reload captcha
	mux.HandleFunc("/reload-captcha", reloadCaptchaHandler)

	mux.HandleFunc("/login", loginHandler)
	mux.HandleFunc("/logout", logoutHandler)

	// static files (css, js, images, html selain login)
	fs := http.FileServer(http.Dir("../templates"))
	mux.Handle("/static/", http.StripPrefix("/static/", fs))

	// assets files (css, js, plugins untuk index.html)
	assets := http.FileServer(http.Dir("../assets"))
	mux.Handle("/assets/", http.StripPrefix("/assets/", assets))

	// partials files (header, sidebar)
	partials := http.FileServer(http.Dir("../partials"))
	mux.Handle("/partials/", http.StripPrefix("/partials/", partials))

	// index (protected)
	mux.HandleFunc("/index.html", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "../index.html")
	})

	// Handle semua file lain di root (profil.html, menu.html, dll)
	mux.Handle("/", http.FileServer(http.Dir("../")))

	println("Server running: http://localhost:8080/login")

	http.ListenAndServe(":8080", authMiddleware(mux))
}
