package handlers

import (
	"fmt"
	"go/place/pkg/db"
	"go/place/pkg/queue"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/gocql/gocql"
	"gorm.io/gorm"
)

const (
	CANVAS_WIDTH   = 250
	CANVAS_HEIGHT  = 250
	PLACE_COOLDOWN = 5
)

type Pixel struct {
	XPos      int       `json:"x"`
	YPos      int       `json:"y"`
	Color     int16     `json:"color"`
	User      string    `json:"user"`
	Timestamp time.Time `json:"placed"`
}

type BoardHandler struct {
	boardRedis *redis.Client
	boardDB    *gocql.Session
	authDB     *gorm.DB
	queue      *queue.BoardUpdateQueue
}

func NewBoardHandler(rdb *redis.Client, cass *gocql.Session, authDB *gorm.DB, queue *queue.BoardUpdateQueue) *BoardHandler {
	return &BoardHandler{
		boardRedis: rdb,
		boardDB:    cass,
		authDB:     authDB,
		queue:      queue,
	}
}

func (a *BoardHandler) Board() gin.HandlerFunc {
	return func(c *gin.Context) {
		res, _ := a.boardRedis.Get(c, "canvas").Bytes()

		c.JSON(http.StatusOK, gin.H{"board": res})
	}
}

func (a *BoardHandler) ComputedBoard() gin.HandlerFunc {
	return func(c *gin.Context) {
		canvasBytes, _ := a.boardRedis.Get(c, "canvas").Bytes()
		colors := strings.Builder{}

		for i, byt := range canvasBytes {
			bits := fmt.Sprintf("%08b", byt)
			first, err := strconv.ParseInt(bits[0:4], 2, 8)
			if err != nil {
				c.AbortWithError(http.StatusInternalServerError, err)
			}

			second, err := strconv.ParseInt(bits[4:], 2, 8)
			if err != nil {
				c.AbortWithError(http.StatusInternalServerError, err)
			}

			colors.WriteString(fmt.Sprintf("%d", first))
			colors.WriteString(",")
			colors.WriteString(fmt.Sprintf("%d", second))

			if i < len(canvasBytes)-1 {
				colors.WriteString(",")
			}
		}

		c.JSON(http.StatusOK, gin.H{"board": colors.String()})

	}
}

func (a *BoardHandler) Inspect() gin.HandlerFunc {
	return func(c *gin.Context) {
		pixel := Pixel{}

		if err := c.BindJSON(&pixel); err != nil {
			c.AbortWithError(http.StatusBadRequest, err)
			return
		}

		if pixel.XPos < 0 || pixel.XPos > CANVAS_WIDTH || pixel.YPos < 0 || pixel.YPos > CANVAS_HEIGHT {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Not a valid coordinate"})
		}

		pos := ((pixel.XPos - 1) * 4) + ((pixel.YPos - 1) * 4 * CANVAS_WIDTH)

		res, _ := a.boardRedis.BitField(c, "canvas", "GET", "u4", pos).Result()

		c.JSON(http.StatusOK, gin.H{"board": res})

	}
}

func (b *BoardHandler) Draw() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		var user db.User

		// Validate that the user's session is valid
		username := session.Get("username")
		_, err := user.FindUserByUsername(b.authDB, fmt.Sprintf("%v", username))
		if err != nil {
			c.AbortWithStatus(http.StatusUnauthorized)
		}

		// Initialize the pixel they are trying to update
		pixel := Pixel{}

		if err := c.BindJSON(&pixel); err != nil {
			c.AbortWithError(http.StatusBadRequest, err)
			return
		}

		if pixel.XPos < 1 || pixel.XPos > CANVAS_WIDTH || pixel.YPos < 1 || pixel.YPos > CANVAS_HEIGHT {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Not a valid coordinate"})
		}

		// Get this user's last placement
		var last_placed time.Time

		if err := b.boardDB.Query(`SELECT last_placed FROM userinfo WHERE type = ? AND user = ? LIMIT 1`, "last tile timestamp", username).Consistency(gocql.One).Scan(&last_placed); err != nil {
			if err == gocql.ErrNotFound {
				last_placed = time.UnixMilli(1257894000000).UTC()
			} else {
				c.AbortWithError(http.StatusInternalServerError, err)
			}
		}

		if diff := time.Since(last_placed); diff.Minutes() < PLACE_COOLDOWN {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": fmt.Sprintf("You have placed a piece in the last %d minutes", PLACE_COOLDOWN),
				"secondsRemaining": time.Until(last_placed.Add(time.Minute * 5)).Seconds()})
		}

		// Update the pos in cassandra
		if err := b.boardDB.Query(`INSERT INTO pixel (x, y, color, user, last_placed) VALUES (?, ?, ?, ?, ?)`,
			pixel.XPos, pixel.YPos, pixel.Color, user.Username, time.Now()).Exec(); err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
		}

		if err := b.boardDB.Query(`INSERT INTO userinfo (type, user, last_placed) VALUES (?, ?, ?)`,
			"last tile timestamp", user.Username, time.Now()).Exec(); err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
		}

		// Update the redis board
		pos := ((pixel.XPos - 1) * 4) + ((pixel.YPos - 1) * 4 * CANVAS_WIDTH)
		nn, err := b.boardRedis.BitField(c, "canvas", "SET", "u4", pos, pixel.Color).Result()

		if (len(nn) == 0) || err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to update the board cache"})
		}

		if err := b.queue.Publish(pixel.XPos, pixel.YPos, int(pixel.Color)); err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to notify connected users!"})
		}

		c.AbortWithStatus(http.StatusOK)
	}
}

func (b *BoardHandler) TestPlace() gin.HandlerFunc {
	return func(c *gin.Context) {
		pixel := Pixel{}

		if err := c.BindJSON(&pixel); err != nil {
			c.AbortWithError(http.StatusBadRequest, err)
			return
		}

		if pixel.XPos < 1 || pixel.XPos > CANVAS_WIDTH || pixel.YPos < 1 || pixel.YPos > CANVAS_HEIGHT {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Not a valid coordinate"})
		}

		// Update the pos in cassandra
		if err := b.boardDB.Query(`INSERT INTO pixel (x, y, color, user, last_placed) VALUES (?, ?, ?, ?, ?)`,
			pixel.XPos, pixel.YPos, pixel.Color, "root", time.Now()).Exec(); err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
		}

		// Update the redis board
		pos := ((pixel.XPos - 1) * 4) + ((pixel.YPos - 1) * 4 * CANVAS_WIDTH)
		nn, err := b.boardRedis.BitField(c, "canvas", "SET", "u4", pos, pixel.Color).Result()

		if (len(nn) == 0) || err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to update the board cache"})
		}

		// if err := b.queue.Publish(1, 1, 15); err != nil {
		// 	c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to notify connected users!"})
		// }

		c.JSON(http.StatusAccepted, gin.H{"message": "accepted"})
	}
}
