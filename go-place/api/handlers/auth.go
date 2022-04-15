package handlers

import (
	"go/place/pkg/db"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
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

		hashedPassword, err := HashPassword(user.Password)
		if err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
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
		}

		if CheckPasswordHash(inputPassword, foundUser.Password) {
			session.Set("username", foundUser.Username)
			session.Save()
			c.JSON(http.StatusOK, gin.H{"username": foundUser.Username, "email": foundUser.Email})
		}

		c.AbortWithStatus(http.StatusBadRequest)
	}
}

func (a *AuthHandler) Test() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		v := session.Get("username")
		c.JSON(200, gin.H{"username": v})
	}
}
