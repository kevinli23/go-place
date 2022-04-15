package db

import (
	"errors"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitAuthDB(connString string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(connString), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	db.AutoMigrate(&User{})

	return db, nil
}

type User struct {
	gorm.Model
	Username string `gorm:"size:100;not null;unique" json:"username" validate:"required"`
	Email    string `gorm:"size:100;not null;unique" json:"email" validate:"required,email"`
	Password string `gorm:"size:100;not null;unique" json:"password" validate:"required,min=6"`
}

func (u *User) CreateUser(db *gorm.DB) (*User, error) {
	err := db.Debug().Create(&u).Error
	if err != nil {
		return &User{}, err
	}
	return u, nil
}

func (u *User) FindUserByUsername(db *gorm.DB, uname string) (*User, error) {
	err := db.Debug().Model(User{}).Where("username = ?", uname).Take(&u).Error
	if err != nil {
		return nil, err
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return &User{}, errors.New("User Not Found")
	}

	return u, err
}
