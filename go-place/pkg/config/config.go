package config

import (
	"fmt"

	"github.com/spf13/viper"
)

type Config struct {
	PostgresUser       string `mapstructure:"POSTGRES_USER"`
	PostgresPort       string `mapstructure:"POSTGRES_PORT"`
	PostgresHost       string `mapstructure:"POSTGRES_HOST"`
	PostgresPassword   string `mapstructure:"POSTGRES_PASSWORD"`
	PostgresDB         string `mapstructure:"POSTGRES_DB"`
	CassandraURL       string `mapstructure:"CASSANDRA_URL"`
	CassandraKeyspace  string `mapstructure:"CASSANDRA_KEYSPACE"`
	RedisURL           string `mapstructure:"REDIS_URL"`
	RedisPassword      string `mapstructure:"REDIS_PASSWORD"`
	APIPort            string `mapstructure:"API_PORT"`
	SessionSecret      string `mapstructure:"SESSION_SECRET"`
	RabbitMQUser       string `mapstructure:"RABBITMQ_USER"`
	RabbitMQPassword   string `mapstructure:"RABBITMQ_PASSWORD"`
	RabbitMQHost       string `mapstructure:"RABBITMQ_HOST"`
	GoogleClientID     string `mapstructure:"GOOGLE_CLIENT_ID"`
	GoogleClientSecret string `mapstructure:"GOOGLE_CLIENT_SECRET"`
	GithubClientID     string `mapstructure:"GITHUB_CLIENT_ID"`
	GithubClientSecret string `mapstructure:"GITHUB_CLIENT_SECRET"`
}

func LoadConfig(path, environment string) (*Config, error) {
	viper.AddConfigPath(path)
	viper.SetConfigName(environment)
	viper.SetConfigType("env")

	viper.AutomaticEnv()

	err := viper.ReadInConfig()
	if err != nil {
		return nil, err
	}

	c := &Config{}
	err = viper.Unmarshal(&c)
	return c, err
}

func (c *Config) GetAuthDBConnectionString() string {
	return fmt.Sprintf("host=%s port=%s user=%s dbname=%s sslmode=disable password=%s", c.PostgresHost, c.PostgresPort, c.PostgresUser, c.PostgresDB, c.PostgresPassword)
}

func (c *Config) GetRabbitMQConnectionString() string {
	return fmt.Sprintf("amqps://%s:%s@%s", c.RabbitMQUser, c.RabbitMQPassword, c.RabbitMQHost)
}
