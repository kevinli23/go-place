package config

import (
	"fmt"

	"github.com/spf13/viper"
)

type Config struct {
	APIPort          string `mapstructure:"NOTIFIER_PORT"`
	RabbitMQUser     string `mapstructure:"RABBITMQ_USER"`
	RabbitMQPassword string `mapstructure:"RABBITMQ_PASSWORD"`
	RabbitMQHost     string `mapstructure:"RABBITMQ_HOST"`
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

func (c *Config) GetRabbitMQConnectionString() string {
	return fmt.Sprintf("amqps://%s:%s@%s", c.RabbitMQUser, c.RabbitMQPassword, c.RabbitMQHost)
}
