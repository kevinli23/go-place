package reddit

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"go/place/pkg/db"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type RedditClient struct {
	RedditClientID     string
	RedditClientSecret string
	Scope              string
	ResponseType       string
	State              string
	RedirectURL        string
	Duration           string
	AuthDB             *gorm.DB
}

type RedditAuthTokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	Scope        string `json:"scope"`
	RefreshToken string `json:"refresh_token"`
}

type RedditUserResponse struct {
	Name string `json:"name"`
}

func NewRedditClient(clientId, secret, scope, redirectURL string) *RedditClient {
	return &RedditClient{
		RedditClientID:     clientId,
		RedditClientSecret: secret,
		Scope:              scope,
		ResponseType:       "code",
		RedirectURL:        redirectURL,
		Duration:           "temporary",
	}
}

func GenerateRandomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)
	if err != nil {
		return nil, err
	}

	return b, nil
}

func GenerateRandomString(s int) (string, error) {
	b, err := GenerateRandomBytes(s)
	return base64.URLEncoding.EncodeToString(b), err
}

func (r *RedditClient) HandleOAuth(c *gin.Context) {
	sess := sessions.Default(c)

	params := url.Values{}
	params.Add("client_id", r.RedditClientID)
	params.Add("response_type", "code")

	state, _ := GenerateRandomString(10)
	params.Add("state", state)
	sess.Set("redditauthstate", state)
	if err := sess.Save(); err != nil {
		log.Println(err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to generate state"})
	}

	params.Add("redirect_uri", r.RedirectURL)
	params.Add("duration", "temporary")
	params.Add("scope", "identity")

	url := "https://www.reddit.com/api/v1/authorize?" + params.Encode()

	c.Redirect(301, url)
}

func (r *RedditClient) HandleOAuthCallback(c *gin.Context, authDB *gorm.DB) {
	sess := sessions.Default(c)
	s := sess.Get("redditauthstate")

	params := c.Request.URL.Query()
	state, stateOK := params["state"]
	code, ok := params["code"]

	if !stateOK || len(state) < 1 || s == nil || s.(string) != state[0] {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "failed to authorize reddit request"})
		return
	}

	if ok || len(code[0]) > 0 {
		client := &http.Client{}

		data := url.Values{}
		data.Set("grant_type", "authorization_code")
		data.Set("code", code[0])
		data.Set("redirect_uri", r.RedirectURL)

		req, err := http.NewRequest("POST", "https://www.reddit.com/api/v1/access_token", strings.NewReader(data.Encode()))
		if err != nil {
			log.Fatal(err)
		}

		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		req.Header.Set("User-Agent", "goplace by u/campuspizza")
		req.SetBasicAuth(r.RedditClientID, r.RedditClientSecret)

		resp, err := client.Do(req)
		if err != nil {
			log.Fatal(err)
		}

		bodyText, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			log.Fatal(err)
		}

		var res RedditAuthTokenResponse
		if err := json.Unmarshal(bodyText, &res); err != nil {
			log.Fatal(err)
		}

		token := res.AccessToken

		fmt.Println("Token: " + token)
		req, err = http.NewRequest("GET", "https://oauth.reddit.com/api/v1/me", nil)
		if err != nil {
			log.Fatal(err)
		}

		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("User-Agent", "goplace by u/campuspizza")

		resp, err = client.Do(req)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "failed to retrieve your reddit username"})
		}

		var identity RedditUserResponse
		json.NewDecoder(resp.Body).Decode(&identity)

		var dbUser db.User
		if _, err := dbUser.FindOrCreateUser(authDB, identity.Name, identity.Name); err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to create your user"})
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
}
