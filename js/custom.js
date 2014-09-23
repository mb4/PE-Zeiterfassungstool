/* * * * * * * * * * * * * * * * * * * * * *
 * 										   *
 * TimeTrackTool						   *
 * 										   *
 * 2014 (c) Marvin Botens, Stephan Giesau  *
 * 										   *
 * * * * * * * * * * * * * * * * * * * * * */

 
// load DB
// initialise. If the database doesn't exist, it is created
var db = new localStorageDB('timetracktool', localStorage);

// check if the database was just created. Then create all tables
if( db.isNew() ) {

    // create tables
    db.createTable('internship', ['unique_id', 'name', 'manager', 'lerner_id', 'start', 'end']);
    db.createTable('day', ['unique_id', 'timestamp', 'type']);
    db.createTable('working_period', ['unique_id', 'start', 'end', 'info']);

    // save tables to localStorage
    db.commit();
}

//TODO remove, console output of DB contents
console.debug( JSON.parse( db.serialize() ) );



/**
 * generate a unique id with given timestamp, salt and browser's user agent
 * @param timestamp timestamp of object
 * @param salt string used to salt the generated key
 * @return string containing a MD5 hash usable as ID
 */
function generateUniqueId(timestamp, salt) {
	
	return calcMD5( timestamp + salt + navigator.userAgent );
}



/**
 * create new internship in database
 * 
 * @return unique_id of new entry
 */
function createInternship(f_name, f_start, f_end, f_manager, f_lerner_id) {
	
	f_unique_id = generateUniqueId(f_start, f_name);

	db.insert('internship', {
			unique_id: f_unique_id,
			name: f_name,
			start: f_start,
			end: f_end,
			manager: f_manager,
			lerner_id: f_lerner_id
		});
	db.commit();
	
	return f_unique_id;
}