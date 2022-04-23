package handlers

import (
	"errors"
	"fmt"
	"go/place/pkg/db"
	"go/place/pkg/reddit"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db           *gorm.DB
	RedditClient *reddit.RedditClient
}

type UpdateUsernameRequest struct {
	Username string
}

func NewAuthHandler(db *gorm.DB, redditClient *reddit.RedditClient) *AuthHandler {
	return &AuthHandler{
		db:           db,
		RedditClient: redditClient,
	}
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func (a *AuthHandler) OAuthLogin() gin.HandlerFunc {
	return func(c *gin.Context) {
		q := c.Request.URL.Query()
		q.Add("provider", c.Param("provider"))
		c.Request.URL.RawQuery = q.Encode()

		if c.Param("provider") == "reddit" {
			a.RedditClient.HandleOAuth(c)
		} else {
			gothic.BeginAuthHandler(c.Writer, c.Request)
		}

	}
}

func (a *AuthHandler) OAuthCallback() gin.HandlerFunc {
	return func(c *gin.Context) {
		q := c.Request.URL.Query()
		q.Add("provider", c.Param("provider"))
		c.Request.URL.RawQuery = q.Encode()

		if c.Param("provider") == "reddit" {
			a.RedditClient.HandleOAuthCallback(c, a.db)
		} else {
			user, err := gothic.CompleteUserAuth(c.Writer, c.Request)
			if err != nil {
				c.AbortWithError(http.StatusUnauthorized, err)
				return
			}

			if user.Email == "" {
				c.JSON(http.StatusBadRequest, errors.New("could not retrieve your email"))
				return
			}

			dbUser := db.User{}
			if _, err := dbUser.FindOrCreateUser(a.db, user.Email); err != nil {
				c.AbortWithError(http.StatusInternalServerError, errors.New("failed to create a user"))
				return
			}

			sess := sessions.Default(c)
			sess.Set("username", dbUser.Username)
			sess.Set("id", dbUser.ID)
			if err := sess.Save(); err != nil {
				fmt.Println(err)
				return
			}
		}

		c.Redirect(http.StatusTemporaryRedirect, "/")
	}
}

func (a *AuthHandler) OAuthLogout() gin.HandlerFunc {
	return func(c *gin.Context) {
		provider := c.Param("provider")

		if provider != "reddit" {
			gothic.Logout(c.Writer, c.Request)
		}

		c.SetCookie("authsession", "", -1, "/", "", true, true)

		c.JSON(http.StatusOK, gin.H{"message": "logout successful"})
	}
}

func (a *AuthHandler) RedditOAuth() gin.HandlerFunc {
	return func(c *gin.Context) {

	}
}

func (a *AuthHandler) GetUsername() gin.HandlerFunc {
	return func(c *gin.Context) {
		sess := sessions.Default(c)
		user := sess.Get("username")

		c.JSON(200, gin.H{"username": user})
	}
}

func (a *AuthHandler) UpdateUsername() gin.HandlerFunc {
	return func(c *gin.Context) {
		sess := sessions.Default(c)
		username := sess.Get("username").(string)

		newUser := UpdateUsernameRequest{}
		if err := c.BindJSON(&newUser); err != nil {
			c.AbortWithError(http.StatusBadRequest, err)
			return
		}

		if username == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Please login to do this."})
			return
		}

		user := db.User{Username: username}
		if err := user.UpdateUsername(a.db, newUser.Username); err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Failed to update your username"})
			return
		}

		sess.Set("username", user.Username)
		sess.Save()

		c.JSON(http.StatusAccepted, gin.H{"username": user.Username})
	}
}
