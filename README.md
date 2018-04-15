<h1>NSM-ITM-Activity Station</h1>

<h2>Client</h2>
<p>Script that creates a local database for user to check-in (expecedly with USB RFID tag reader). Once checked-in, it automatically syncs with a web server in the same circle of network.</p>
<p>Designed for RPI, so the libraries required in the script are basically compatible with Raspbian (Python 2). To run the script:</p>
<blockquote>python timestamp.py [station_name]</blockquote>
<p>PS. Don't forget to edit server endpoint within the code.<br> Having the script run at startup, headless, with network connection is more preferable.</p>

<h2>Server</h2>
<p>Simple NodeJS application receiving calls from clients and recording data to local database. The front-end server can be changed according to activity's requirements (in this case, the RFID token is required again at the last station, where the server is).</p>
<p>No security functions (all most) at all</p>
<blockquote>nodejs index.js</blockquote>
<p>PS. Check for application dependency before running.</p>
