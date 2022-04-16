package router

import (
	"go/place/api/handlers"
	"go/place/features"
	"go/place/pkg/app"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
)

func Init(app *app.App) *gin.Engine {
	r := gin.Default()

	authHandler := handlers.NewAuthHandler(app.AuthDB)
	boardHandler := handlers.NewBoardHandler(app.BoardRedis, app.BoardDB, app.AuthDB, app.BoardQueue)

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "potato",
		})
	})

	store := cookie.NewStore([]byte(app.Config.SessionSecret))
	r.Use(sessions.Sessions("authsession", store))

	v1 := r.Group("/v1")

	if features.IsInternal {
		v1.Use(cors.Default())
		v1.GET("/computedboard", boardHandler.ComputedBoard())
		v1.GET("/testplace", boardHandler.TestPlace())
	}

	v1.POST("/register", authHandler.Register())
	v1.POST("/login", authHandler.Login())
	v1.GET("/test", authHandler.Test())

	v1.POST("/place", boardHandler.Draw())
	v1.POST("/inspect", boardHandler.Inspect())
	v1.GET("/board", boardHandler.Board())

	return r
}
