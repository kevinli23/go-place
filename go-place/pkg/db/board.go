package db

import "github.com/gocql/gocql"

func InitBoardDB(url, keyspace string) (*gocql.Session, error) {
	cluster := gocql.NewCluster(url)
	cluster.Keyspace = keyspace
	cluster.Consistency = gocql.Quorum

	session, err := cluster.CreateSession()
	if err != nil {
		return nil, err
	}

	return session, nil
}
