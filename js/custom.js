/* * * * * * * * * * * * * * * * * * * * * *
 * 										   *
 * TimeTrackTool						   *
 * 										   *
 * 2014 (c) Marvin Botens, Stephan Giesau  *
 * 										   *
 * * * * * * * * * * * * * * * * * * * * * */



/////////////////////////////////////////////
// DATABASE INITIALIZATION                 //
/////////////////////////////////////////////

// initialise DB. If the database doesn't exist, it is created
var db = new localStorageDB('timetracktool', localStorage);

// check if the database was just created. Then create all tables
if( db.isNew() ) {

    // create tables
    db.createTable('internship', ['unique_id', 'name', 'start', 'end', 'daily_hours']);
    db.createTable('day', ['internship_id', 'timestamp', 'type']);
    db.createTable('working_period', ['unique_id', 'day_id', 'start', 'end', 'info']);

    // save tables to localStorage
    db.commit();
}

//TODO remove, console output of DB contents
console.debug( JSON.parse( db.serialize() ) );





/////////////////////////////////////////////
// BASIC FUNCTIONS                         //
/////////////////////////////////////////////

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





/////////////////////////////////////////////
// APPLICATION STARTUP                     //
/////////////////////////////////////////////

//add datepickers to form
$('#form-internship-start').datepicker();
$('#form-internship-end').datepicker();





/////////////////////////////////////////////
// EVENT HANDLERS                          //
/////////////////////////////////////////////

//edit internship button handlers
$('#edit-internship-button').on('click', function() {

	// fill form with internship data
	// TODO
	// TODO get uniqueId of currently opened internship
	// TODO load data into form elements (input via element ID)
	// TODO set values of data-date attribute for datepickers

	// open modal with form
	$('#form-internship').modal();
});

//create internship button handlers
$('#create-internship-button').on('click', function() {
	
	// open modal with form
	$('#form-internship').modal();
});


//handler for tracking start/stop
$('#tracking-button').on('click', function(e) {
	
	button = $('#tracking-button');

	// start tracking
	if(button.hasClass('btn-success')) {

		// change text and color of button
		button.addClass('btn-danger').removeClass('btn-success').find('strong').text('Stop tracking');
		
		// start timer for tracking 
		// TODO
		$('#tracking-time').text('Start');
	
	// stop tracking
	} else {
		
		// change text and color of button
		button.addClass('btn-success').removeClass('btn-danger').find('strong').text('Start tracking');
		
		// stop timer for tracking
		// TODO
		$('#tracking-time').text('Stop');
		
		// save to working_period
		// TODO
		
		// add working period to day overview (if displayed day there is current day)
		// TODO
		
	}
});




// END TODO remove after finishing work