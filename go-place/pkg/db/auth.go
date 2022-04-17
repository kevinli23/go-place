package db

import (
	"errors"

	"github.com/google/uuid"
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
	Password string `gorm:"size:100;not null;unique" json:"password"`
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
		return &User{}, errors.New("user not found")
	}

	return u, err
}

func (u *User) FindUserByEmail(db *gorm.DB, email string) (*User, error) {
	err := db.Debug().Model(User{}).Where("email = ?", email).Take(&u).Error
	if err != nil {
		return nil, err
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return &User{}, errors.New("email not found")
	}

	return u, err
}

func (u *User) DoesEmailExists(db *gorm.DB, email string) (bool, error) {
	err := db.Debug().Model(User{}).Where("email = ?", email).Take(&u).Error
	if err != nil {
		return false, err
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return false, errors.New("email not found")
	}

	return true, err
}

func (u *User) FindOrCreateUser(db *gorm.DB, email string) (*User, error) {
	err := db.Debug().Model(User{}).Where("email = ?", email).Take(&u).Error
	if err != nil {
		return nil, err
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		u.Username = uuid.NewString()
		u.Email = email

		if _, err = u.CreateUser(db); err != nil {
			return nil, err
		}

		return u, nil
	}

	return u, err
}
