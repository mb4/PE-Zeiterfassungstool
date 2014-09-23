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
    db.createTable('internship', ['unique_id', 'name', 'manager', 'lerner_id', 'start', 'end', 'daily_hours']);
    db.createTable('day', ['internship_id', 'timestamp', 'type']);
    db.createTable('working_period', ['unique_id', 'day_id', 'start', 'end', 'info']);

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
 * 
 * create or update a day belonging to an internship
 * 
 * @param {uid} f_internship_id
 * @param {timestamp/int} f_timestamp
 * @param {string} f_type
 */
function createOrUpdateDay(f_internship_id, f_timestamp, f_type)
{
    db.insertOrUpdate("day",
    {
        internship_id: f_internship_id, 
        timestamp: f_timestamp
    },
    {
        internship_id: f_internship_id, 
        timestamp: f_timestamp, 
        type: f_type
    });
    
    db.commit();
}

/**
 * create new internship in database
 * 
 * @return unique_id of new entry
 */
function createInternship(f_name, f_start, f_end, f_manager, f_lerner_id, f_daily_hours, f_unique_id) {
	
	f_unique_id = f_unique_id || generateUniqueId(f_start, f_name);
        
        //delete days outside new intership period
        db.deleteRows("day", function(row){
           if(row.internship_id == f_unique_id && (row.timestamp < f_start || row.timestamp > f_end))
               return true;
           else
               return false;
        });
        
        //insert/ update internship
	db.insertOrUpdate('internship',
            {
                unique_id: f_unique_id
            },
            {
		unique_id: f_unique_id,
		name: f_name,
		start: f_start,
		end: f_end,
		manager: f_manager,
		lerner_id: f_lerner_id,
                daily_hours: f_daily_hours
            });
            
         //determine daytypes and insert/update days
         //TODO
                
	db.commit();
	
	return f_unique_id;
}

//createOrUpdateDay(222, 2355, "Holiday");
//createInternship("test", 234, 445, "df", "fd", 2443, 222);