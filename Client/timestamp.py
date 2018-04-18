import sys
import sqlite3
import time
import sys
import requests

#int(time.time()) 


database_file = 'local_mission_timestamp.db'
table_name = 'mission_time'
station = 'dummy'
previous_line = ''
server_endpoint = 'http://192.168.1.100:3000/sync-table'

def create_table_if_not_exist():

	conn = sqlite3.connect(database_file)
	c = conn.cursor()

	sql = 'create table if not exists ' + table_name + ' (\
			tx_id INTEGER PRIMARY KEY, \
			token_number TEXT NOT NULL,	\
			station TEXT NOT NULL, \
			timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, \
			sync_status TEXT NOT NULL)'

	c.execute(sql)

	conn.commit()
	conn.close()

def record_transaction(dataset):
	last_id = insert_to_table(dataset)
	sync_table(last_id)

def insert_to_table(dataset):

	conn = sqlite3.connect(database_file)
	c = conn.cursor()

	sql = 'insert into ' + table_name + ' (token_number, station, sync_status) values ("%s", "%s", "%s")' % (dataset['token_number'], dataset['station'], 'none')

	c.execute(sql)
	conn.commit()

	last_id = c.lastrowid
	conn.close()

	return last_id

def sync_table(last_id):
	# call server API for table sync

	conn = sqlite3.connect(database_file)
	c = conn.cursor()

	sql = 'select token_number, station, timestamp from '+table_name+' where tx_id = %s' % (last_id)
	c.execute(sql)

	tx = c.fetchone()

	payload = {'token': tx[0], 'station': tx[1], 'timestamp': tx[2]}

	sync_result = requests.get(server_endpoint, params=payload)

	if(sync_result.status_code == 200):
		sql = 'update '+table_name+' set sync_status = done where tx_id = %s' % (last_id)
		c.execute(sql)
		conn.commit();

	conn.close();

	return 0

#conn = sqlite3.connect('timestamp.db')
#c = conn.cursor()

#c.execute()
#c.execute("CREATE TABLE mission_timestamp ()")

if (len(sys.argv) == 2):
	station = sys.argv[1]

line = raw_input()

create_table_if_not_exist()

while (line != 'exit'):

	if(line != previous_line):
		record_transaction( {
							'token_number' : line,
							'station' : station 
						} )
		previous_line = line

	line = raw_input()
