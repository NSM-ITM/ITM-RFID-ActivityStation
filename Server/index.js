var express = require('express');
var bodyParser = require('body-parser');
var database = require('./functions/database.js');

var app = express();
var station_names = ['start', 'station_1', 'station_2', 'station_3'];

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/public/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());



app.get('/', function(req, res){
	// landing page with activity result table
	var callback = function(rows) {
		res.render('index.html', {rows: rows});	
	}

    if(req.query.sort_by != null) {
    	var sort_by = req.query.sort_by;
    	database.getActivityResult({sort_by: sort_by}, callback);
    } else {
        database.getActivityResult({}, callback);
    }
});

app.get('/registration', function(req, res){

    res.render('register.html');
});

app.post('/registration', function(req, res) {

	//field validating
	if(true) {

		var callback_1 = function(rows) {
			console.log(rows);
			// calculate station time

			/*
				[ { station: 'start', timestamp: '2018-04-12 10:00:00' },
				  { station: 'station 2', timestamp: '2018-04-12 10:20:10' },
				  { station: 'station 1', timestamp: '2018-04-12 10:47:10' },
				  { station: 'station 3', timestamp: '2018-04-12 11:10:28' } ]

			*/

			if(rows.length > 1) {
				var activity_result = {
										station_1_time : 0,
										station_2_time : 0,
										station_3_time : 0
									};

				var arr = rows[0].timestamp.split(/-|\s|:/);				// first station must be 'start'
				var start_time = new Date(arr[0], arr[1] -1, arr[2], arr[3], arr[4], arr[5]);

				for(var i = 1;i<rows.length;i++) {
					var arr = rows[i].timestamp.split(/-|\s|:/);
					var station_time = new Date(arr[0], arr[1] -1, arr[2], arr[3], arr[4], arr[5]);

					var station_used_time = station_time - start_time;
					var station_name = rows[i].station;
					// console.log(station_name,' ',station_used_time)

					if(station_name == 'station_1') {
						activity_result.station_1_time = station_used_time;
					} else if(station_name == 'station_2') {
						activity_result.station_2_time = station_used_time;
					} else if(station_name == 'station_3') {
						activity_result.station_3_time = station_used_time;
					}

					start_time = station_time;
				}

				//console.log(activity_result);

				var callback_2 = function(user_id) {
					// insert station time and user to activity result
					function millisToMinutesAndSeconds(millis) {
																	var minutes = Math.floor(millis / 60000);
																	var seconds = ((millis % 60000) / 1000).toFixed(0);
																	return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
																}

					database.insertActivityResult({
														user_id: user_id,
														station_1_time: millisToMinutesAndSeconds(activity_result.station_1_time),
														station_2_time: millisToMinutesAndSeconds(activity_result.station_2_time),
														station_3_time: millisToMinutesAndSeconds(activity_result.station_3_time),
														total_time: millisToMinutesAndSeconds(activity_result.station_1_time + activity_result.station_2_time + activity_result.station_3_time),
												});

					res.redirect('/map?token='+req.body.token+'&user_id='+user_id);
					
				}


				database.insertUserData( {
										firstname: req.body.firstname,
										lastname: req.body.lastname,
										email: req.body.email,
										telephone: req.body.telephone,
										used_token: req.body.token
									}, callback_2 );

			}


			
			

		}

		// marked finish station
		database.insertUnmappedTimestamp( {
										token: req.body.token,
										station: 'finish',
										timestamp: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
									} );

		database.getUnmappedUsedTime({token : req.body.token}, callback_1);

		

		//res.send('mapping error')

		
	} else {
		// otherwise reload with error
	    res.render('register.html');
	}

});

app.get('/player', function(req, res) {
	
	var callback = function(rows) {
		res.render('player.html', {rows: rows});	
	}

	try {
		database.getStartUnfinishToken(callback);

	} catch (err) {
	    // handle the error safely
	    console.log(err)
	}
});

app.get('/map', function(req, res) {
	// try mapping token with user id
	try {
		database.mapTransaction( {
									token: req.query.token,
									user_id: req.query.user_id
								} );


	} catch (err) {
	    // handle the error safely
	    console.log(err)
	}
	//res.send('ok');
	res.redirect('/');
});

app.get('/sync-table', function(req, res){

	database.insertUnmappedTimestamp( {
										token: req.query.token,
										station: req.query.station,
										timestamp: req.query.timestamp,
									} );

	res.send('synced')
});

app.get('/init-table', function(req, res){

	console.log(database.test);
	
	database.testConnection();
	database.createTables();

	res.send('done');
	
});

app.get('/test-db-function', function(req, res) {

	var callback_1 = function(rows) {
			//console.log(rows);

			var callback_2 = function(user_id) {
				console.log('/map?token='+req.query.token+'&user_id='+user_id)
				//res.redirect('/map?token='+req.query.token+'&user_id='+user_id);
			}

			database.insertUserData( {
										firstname: 'firstname',
										lastname: 'lastname',
										email: 'email@email.com',
										used_token: '02154879630'
									}, callback_2 );


		}

		database.getMappedUsedTime({token : req.query.token}, callback_1);

	res.send('done');
});

console.log('please make sure this machine is assigned IP address 192.168.1.100')

app.listen(3000, () => console.log('Example app listening on port 3000!'))
