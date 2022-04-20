package router

import (
	"embed"
	"go/place/api/handlers"
	"go/place/features"
	"go/place/pkg/app"

	"github.com/gin-contrib/cors"
	gcsessions "github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/github"
	"github.com/markbates/goth/providers/google"
)

func Init(app *app.App, reactBuild embed.FS) *gin.Engine {
	r := gin.Default()

	authHandler := handlers.NewAuthHandler(app.AuthDB)
	boardHandler := handlers.NewBoardHandler(app.BoardRedis, app.BoardDB, app.AuthDB, app.BoardQueue)

	store := sessions.NewCookieStore([]byte(app.Config.SessionSecret))
	store.Options.Path = "/"
	store.MaxAge(86400 * 30)
	store.Options.HttpOnly = true
	store.Options.Secure = features.IsInternal

	gothic.Store = store

	goth.UseProviders(
		google.New(app.Config.GoogleClientID, app.Config.GoogleClientSecret, features.HostName+"/auth/google/callback", "email"),
		github.New(app.Config.GithubClientID, app.Config.GithubClientSecret, features.HostName+"/auth/github/callback", "user:email"),
	)

	authStore := cookie.NewStore([]byte(app.Config.SessionSecret))

	if features.IsInternal {
		r.Use(cors.New(cors.Config{
			AllowOrigins:     []string{"http://localhost:3001", "http://localhost", "http://localhost:3000"},
			AllowCredentials: true,
			AllowMethods:     []string{"PUT", "POST", "GET", "DELETE", "OPTIONS"},
			AllowHeaders:     []string{"Content-Type", "Content-Length", "Authorization", "Accept", "X-Requested-With"},
		}))
	}

	authsession := gcsessions.Sessions("authsession", authStore)
	r.Use(authsession)

	r.Use(static.Serve("/", static.LocalFile("./build", true)))

	v1 := r.Group("/v1")
	v1.Use(authsession)

	r.GET("/auth/:provider", authHandler.OAuthLogin())
	r.GET("/auth/:provider/callback", authHandler.OAuthCallback())
	r.GET("/logout/:provider", authHandler.OAuthLogout())

	if features.IsInternal {
		v1.GET("/computedboard", boardHandler.ComputedBoard())
		v1.POST("/testplace", boardHandler.TestPlace())
		v1.POST("/updatename", authHandler.UpdateUsername())
	}

	v1.GET("/username", authHandler.GetUsername())
	v1.POST("/place", boardHandler.Place())
	v1.POST("/inspect", boardHandler.Inspect())
	v1.GET("/board", boardHandler.Board())
	v1.GET("/logout", authHandler.OAuthLogout())

	return r
}
