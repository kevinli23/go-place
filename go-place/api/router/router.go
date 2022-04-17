package router

import (
	"go/place/api/handlers"
	"go/place/features"
	"go/place/pkg/app"

	"github.com/gin-contrib/cors"
	gcsessions "github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/github"
	"github.com/markbates/goth/providers/google"
)

func Init(app *app.App) *gin.Engine {
	r := gin.Default()

	authHandler := handlers.NewAuthHandler(app.AuthDB)
	boardHandler := handlers.NewBoardHandler(app.BoardRedis, app.BoardDB, app.AuthDB, app.BoardQueue)

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "potato",
		})
	})

	store := sessions.NewCookieStore([]byte(app.Config.SessionSecret))
	store.Options.Path = "/"
	store.MaxAge(86400 * 30)
	store.Options.HttpOnly = true
	store.Options.Secure = features.IsInternal

	gothic.Store = store

	goth.UseProviders(
		google.New(app.Config.GoogleClientID, app.Config.GoogleClientSecret, "http://localhost:3000/auth/google/callback", "email"),
		github.New(app.Config.GithubClientID, app.Config.GithubClientSecret, "http://localhost:3000/auth/github/callback", "user:email"),
	)

	authStore := cookie.NewStore([]byte(app.Config.SessionSecret))
	r.Use(gcsessions.Sessions("authsession", authStore))

	r.GET("/auth/:provider", authHandler.OAuthLogin())
	r.GET("/auth/:provider/callback", authHandler.OAuthCallback())
	r.GET("/logout/:provider", authHandler.OAuthLogout())

	v1 := r.Group("/v1")

	r.Use(cors.Default())
	r.GET("/username", authHandler.GetUsername())

	if features.IsInternal {
		v1.Use(cors.Default())
		v1.GET("/computedboard", boardHandler.ComputedBoard())
		v1.POST("/testplace", boardHandler.TestPlace())

		v1.POST("/register", authHandler.Register())
		v1.POST("/login", authHandler.Login())
	}

	v1.POST("/place", boardHandler.Draw())
	v1.POST("/inspect", boardHandler.Inspect())
	v1.GET("/board", boardHandler.Board())

	return r
}
