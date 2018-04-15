const sqlite3 = require('sqlite3').verbose();

module.exports = {
	test: 'test',
    testConnection: function() {
		var db = new sqlite3.Database('central_timestamp.db',  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
		  if (err) {
		    console.error(err.message);
		    return 1;
		  }
		});

		db.close();
	}, 
	createTables: function() {
		var db = new sqlite3.Database('central_timestamp.db',  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
		  if (err) {
		    console.error(err.message);
		    return 1;
		  }
		});

		// unmapped_tx
		db.run('CREATE TABLE IF NOT EXISTS `unmapped_tx` (' +
	    '`id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,' +
	    '`token` TEXT,' +
	    '`station` TEXT,' +
	    '`timestamp` TEXT);');

		// user_data
		db.run('CREATE TABLE IF NOT EXISTS `user_data` (' +
	    '`id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,' +
	    '`firstname` TEXT,' +
	    '`lastname` TEXT,' +
	    '`email` TEXT,' +
	    '`used_token` TEXT,' +
	    '`remarks` TEXT,' +
	    '`registration_timestamp` TEXT);');

		// mapped_tx
		db.run('CREATE TABLE IF NOT EXISTS `mapped_tx` (' +
	    '`id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,' +
	    '`user_id` INTEGER,' +
	    '`token` TEXT,' +
	    '`station` TEXT,' +
	    '`timestamp` TEXT);');

		// activity_result
		db.run('CREATE TABLE IF NOT EXISTS `activity_result` (' +
	    '`id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,' +
	    '`user_id` INTEGER,' +
	    '`station_1_time` TEXT,' +
	    '`station_2_time` TEXT,' +
	    '`station_3_time` TEXT,' +
	    '`total_time` TEXT,' +
	    '`complete_timestamp` TEXT)');


	    db.close();
	},
	insertUnmappedTimestamp: function(dataset) {
		var db = new sqlite3.Database('central_timestamp.db',  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
		  if (err) {
		    console.error(err.message);
		    return 1;
		  }

		});

		db.run('INSERT INTO `unmapped_tx` (token, station, timestamp) values (?, ?, ?)', [dataset.token, dataset.station, dataset.timestamp ], function(err) {
  		
	  		if (err) {
		      return console.log(err.message);
	    	}
		    // get the last insert id
		    console.log(`A row has been inserted with rowid ${this.lastID}`);
  		});
		
		db.close();
	},
	insertActivityResult: function(dataset) {
		var db = new sqlite3.Database('central_timestamp.db',  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
		  if (err) {
		    console.error(err.message);
		    return 1;
		  }

		});

		db.run('INSERT INTO `activity_result` (user_id, station_1_time, station_2_time, station_3_time, total_time, complete_timestamp) values (?, ?, ?, ?, ?, DATETIME("now"))',
				 [dataset.user_id, dataset.station_1_time, dataset.station_2_time, dataset.station_3_time, dataset.total_time], function(err) {
  		
	  		if (err) {
		      return console.log(err.message);
	    	}
		    // get the last insert id
		    console.log(`A row has been inserted with rowid ${this.lastID}`);
  		});
		
		db.close();
	},
	getActivityResult: function(dataset, callback) {
		var db = new sqlite3.Database('central_timestamp.db',  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
		  if (err) {
		    console.error(err.message);
		    return 1;
		  }

		});
		var sql = 'SELECT * FROM `activity_result` JOIN user_data ON user_data.id = activity_result.user_id';
		
		if(dataset.sort_by != null) 
			sql = sql+ ' ORDER BY '+dataset.sort_by+' ASC';

		db.all(sql ,[], function(err, rows) {
  		
	  		if (err) {
		      return console.log(err.message);
	    	}

	    	callback(rows);
		    return rows;

  		});
		
		db.close();
	},
	getMappedUsedTime: function(dataset, callback) {
		var db = new sqlite3.Database('central_timestamp.db',  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
		  if (err) {
		    console.error(err.message);
		    return 1;
		  }

		});

		db.all('SELECT station, timestamp FROM `mapped_tx` WHERE token = ? ORDER BY timestamp ASC', [dataset.token ], function(err, rows) {
  		
	  		if (err) {
		      return console.log(err.message);
	    	}

	    	callback(rows);

  		});
		
		db.close();
	},
	insertUserData: function(dataset, callback) {
		var db = new sqlite3.Database('central_timestamp.db',  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
		  if (err) {
		    console.error(err.message);
		    return 1;
		  }

		});

		db.run('INSERT INTO `user_data` (firstname, lastname, email, used_token, registration_timestamp) \
			values (?, ?, ?, ?, DATETIME("now"))', [dataset.firstname, dataset.lastname, dataset.email, dataset.used_token ], function(err) {
  		
	  		if (err) {
		      return console.log(err.message);
	    	}

		    // get the last insert id
		    //console.log(`A row has been inserted with rowid ${this.lastID}`);
		    callback(this.lastID);

  		});
		
		db.close();
	},	
	mapTransaction: function(dataset) {
		var db = new sqlite3.Database('central_timestamp.db',  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
		  if (err) {
		    console.error(err.message);
		    return 1;
		  }
		});

		// Join and insert map tx

		db.all('SELECT * FROM `unmapped_tx` INNER JOIN `user_data` ON user_data.used_token = unmapped_tx.token WHERE unmapped_tx.token = ? AND user_data.id = ?', [dataset.token, dataset.user_id], (err, rows) => {
			
			console.log(rows.length);
			
			var insertMap = function(db, dataset) {
				db.run('INSERT INTO `mapped_tx` (user_id, token, station, timestamp) values (?, ?, ?, ?)', [dataset.user_id, dataset.token, dataset.station, dataset.timestamp ], function(err) {
  		
			  		if (err) {
				      return console.log(err.message);
			    	}

		  		});
			};

			var removeUmmap = function(db, token) {
				db.run('DELETE FROM `unmapped_tx` WHERE token = ?', [token], function(err) {
  		
			  		if (err) {
				      return console.log(err.message);
			    	}

			    	console.log('unmapped removed');
		  		});
			};

			rows.forEach((row) => {
				console.log(row);
				insertMap(db, {
									user_id: row.id,
									token: row.token,
									station: row.station,
									timestamp: row.timestamp,

							});
				
			});


			// remove unmaped tx - skipped during test
			//removeUmmap(db, dataset.token);


		});

		
		db.close();
	},
};
