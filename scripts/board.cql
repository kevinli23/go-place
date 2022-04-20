drop keyspace board;
create keyspace board with replication = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 };
create table board.userinfo(type text, user int, last_placed timestamp, PRIMARY KEY(type, user));
create table board.pixel(x smallint, y smallint, color smallint, user text, last_placed timestamp, PRIMARY KEY(x, y));
create table board.places(date text, places counter, PRIMARY KEY(date));