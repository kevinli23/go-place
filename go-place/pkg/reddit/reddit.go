package reddit

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type OAuthClient interface {
	HandleOAuth() gin.HandlerFunc
	HandleOAuthCallback() gin.HandlerFunc
}

type RedditClient struct {
	RedditClientID     string
	RedditClientSecret string
	Scope              string
	ResponseType       string
	State              string
	RedirectURL        string
	Duration           string
}

func NewRedditClient(clientId, secret, scope, redirectURL string) OAuthClient {
	return &RedditClient{
		RedditClientID:     clientId,
		RedditClientSecret: secret,
		Scope:              scope,
		ResponseType:       "code",
		RedirectURL:        redirectURL,
		Duration:           "temporary",
	}
}

func (r *RedditClient) HandleOAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		url := fmt.Sprintf("https://www.reddit.com/api/v1/authorize?client_id=%s&response_type=%s&redirect_uri=%s&duration=%s&scope=%s",
			r.RedditClientID, r.ResponseType, r.RedirectURL, r.Duration, r.Scope)

		c.Redirect(http.StatusTemporaryRedirect, url)
	}
}

func (r *RedditClient) HandleOAuthCallback() gin.HandlerFunc {
	return func(c *gin.Context) {

	}
}
