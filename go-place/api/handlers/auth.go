package handlers

import (
	"errors"
	"fmt"
	"go/place/pkg/db"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db *gorm.DB
}

func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{
		db: db,
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

func (a *AuthHandler) Register() gin.HandlerFunc {
	return func(c *gin.Context) {
		user := db.User{}

		if err := c.BindJSON(&user); err != nil {
			c.AbortWithError(http.StatusBadRequest, err)
			return
		}

		// Check to see if the user already exists
		_, err := user.FindUserByUsername(a.db, user.Username)
		if err == nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "the username provided is taken"})
		}

		_, err = user.FindUserByEmail(a.db, user.Email)
		if err == nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "the email provided is taken"})
		}

		// Create the user
		hashedPassword, err := HashPassword(user.Password)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "failed to generate your account, please try again"})
		}

		user.Password = hashedPassword
		user.CreateUser(a.db)

		c.AbortWithStatus(http.StatusCreated)
	}
}

func (a *AuthHandler) Login() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		user := db.User{}

		if err := c.BindJSON(&user); err != nil {
			c.AbortWithError(http.StatusBadRequest, err)
			return
		}

		inputPassword := user.Password

		foundUser, err := user.FindUserByUsername(a.db, user.Username)
		if err != nil {
			c.AbortWithError(http.StatusNotFound, err)
			return
		}

		if CheckPasswordHash(inputPassword, foundUser.Password) {
			session.Set("username", foundUser.Username)
			session.Save()
			c.JSON(http.StatusOK, gin.H{"username": foundUser.Username, "email": foundUser.Email})
			return
		}

		c.AbortWithStatus(http.StatusBadRequest)
	}
}

func (a *AuthHandler) OAuthLogin() gin.HandlerFunc {
	return func(c *gin.Context) {
		q := c.Request.URL.Query()
		q.Add("provider", c.Param("provider"))
		c.Request.URL.RawQuery = q.Encode()

		gothic.BeginAuthHandler(c.Writer, c.Request)
	}
}

func (a *AuthHandler) OAuthCallback() gin.HandlerFunc {
	return func(c *gin.Context) {
		q := c.Request.URL.Query()
		q.Add("provider", c.Param("provider"))
		c.Request.URL.RawQuery = q.Encode()

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
		if err := sess.Save(); err != nil {
			fmt.Println(err)
			return
		}

		c.Redirect(http.StatusTemporaryRedirect, "/")
	}
}

func (a *AuthHandler) OAuthLogout() gin.HandlerFunc {
	return func(c *gin.Context) {
		gothic.Logout(c.Writer, c.Request)
		c.Redirect(http.StatusTemporaryRedirect, "/")
	}
}

func (a *AuthHandler) GetUsername() gin.HandlerFunc {
	return func(c *gin.Context) {
		sess := sessions.Default(c)
		user := sess.Get("username")

		c.JSON(200, gin.H{"username": user})
	}
}
