/* * * * * * * * * * * * * * * * * * * * * *
 * 										   *
 * TimeTrackTool						   *
 * 										   *
 * 2014 (c) Marvin Botens, Stephan Giesau  *
 * 										   *
 * * * * * * * * * * * * * * * * * * * * * */

 

/////////////////////////////////////////////
// GLOBAL VARIABLES                        //
/////////////////////////////////////////////

window.internship = 0; // currently selected and displayed internship
window.trackingStart = 0; // timestamp saved at start of current tracking




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
 * @param {timestamp} timestamp timestamp of object
 * @param {string} salt string used to salt the generated key
 * @return {string} string containing a MD5 hash usable as ID
 */
function generateUniqueId(timestamp, salt) {
	
	return calcMD5( timestamp + salt + navigator.userAgent );
}

/**
 * calculates for a given timestamp the midnight timestamp of the particular day
 * 
 * @param {timestamp/int} f_timestamp
 * @returns {timestamp/int} midnight timestamp
 */
function getMidnightTimestamp(f_timestamp){
    
    var date = new Date(f_timestamp);
    date.setMilliseconds(0);
    date.setSeconds(0);
    date.setMinutes(0);
    date.setHours(0);
    return date.getTime();
}

/**
 * creates/updates a day belonging to an internship
 * 
 * @param {uid} f_internship_id
 * @param {timestamp/int} f_timestamp
 * @param {string} f_type
 */
function createOrUpdateDay(f_internship_id, f_timestamp, f_type)
{
    //get midnight timestamp for day
    f_timestamp = getMidnightTimestamp(f_timestamp);
    
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
 * creates/updates an internship
 * deletes days previously assigned to the internship, that are now outside the new internship period
 * creates/updates days in the internship period taking into account holidays and vacation days
 * 
 * @param {type} f_name
 * @param {type} f_start
 * @param {type} f_end
 * @param {type} f_manager
 * @param {type} f_lerner_id
 * @param {type} f_daily_hours
 * @param {type} f_holidays
 * @param {type} f_vacation_days
 * @param {type} f_unique_id
 * @returns {@var;f_unique_id}
 */
function createOrUpdateInternship(f_name, f_start, f_end, f_daily_hours, f_holidays, f_vacation_days, f_unique_id) {
	
        //assign unique_id if internship is new
	f_unique_id = f_unique_id || generateUniqueId(f_start, f_name);
        
         //get midnight timestamps
         f_start = getMidnightTimestamp(f_start);
         f_end = getMidnightTimestamp(f_end);
         for (var x=0; x < f_holidays.length; x++)
         {
             f_holidays[x] = getMidnightTimestamp(f_holidays[x]);
         }
         for (var x=0; x < f_vacation_days.length; x++)
         {
             f_vacation_days[x] = getMidnightTimestamp(f_vacation_days[x]);
         }
        
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
                daily_hours: f_daily_hours
            });
            
         //determine daytypes and insert/update days
         for(var timestamp = f_start; timestamp <= f_end; timestamp+=1000*60*60*24)
         {
            var date = new Date(timestamp);
            var type;
            if (f_holidays.indexOf(date.getTime()) >= 0)
                type = "Holiday";
            else if (date.getDay() == 0 || date.getDay() == 6)
                type = "Weekend";
            else if (f_vacation_days.indexOf(date.getTime()) >= 0)
                type = "Vacation";
            else 
                type = "Working Day";
            
            createOrUpdateDay(f_unique_id, timestamp, type);
         }
                
	db.commit();
	
	return f_unique_id;
}

//ToDO: remove
//createOrUpdateDay(333, 2411568691988, "Holiday");
//createOrUpdateInternship("test", 1411549941668, 1412759541668, 2443, [1411768800000,1411682400005], [1412460000000,1412546400005], 222);



/**
 * Updates the internship view with data from given internship given by its unique_id
 * @param {uid} f_internship_id unique ID of internship
 */
function refreshInternshipOverview(f_internship_id) {
	
	var internship_data = db.query('internship', {unique_id: f_internship_id});
	
	if(internship_data.length != 0) {
		
		$('#overview-day-name').text( internship_data[0].name );
		$('#overview-day-start').text( internship_data[0].start );
		$('#overview-day-start').text( internship_data[0].end );
	}
} 






/////////////////////////////////////////////
// APPLICATION STARTUP                     //
/////////////////////////////////////////////

// set initial inernship id to newest internship
newestInternship = db.queryAll('internship', {
						sort: [['timestamp', 'DESC']],
						limit: 1
					});

if(newestInternship.length != 0) {
	window.internship = newestInternship[0].unique_id;
}

// add datepickers to internship form
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
	
	var button = $('#tracking-button');

	// start tracking
	if(button.hasClass('btn-success')) {

		// change text and color of button
		button.addClass('btn-danger').removeClass('btn-success').find('strong').text('Stop tracking');

		// start timer for tracking
		$('#tracking-time').runner({
			countdown: false,
			autostart: true,
			startAt: 0,
			milliseconds: false,
			interval: 1000
			});

		// save tracking starting timestamp
		window.trackingStart = Date.now();

	// stop tracking
	} else {
		
		// change text and color of button
		button.addClass('btn-success').removeClass('btn-danger').find('strong').text('Start tracking');
		
		// stop timer for tracking
		// TODO
		$('#tracking-time').runner('stop');
		
		// save to working_period
		// TODO
		
		// add working period to day overview (if displayed day there is current day)
		// TODO
		
	}
});


// overview week handlers
$('#overview-week select').on('change', function(e) {
	
	var dayClasses = 'day-bg-working-day day-bg-weekend day-bg-holiday day-bg-vacation';
	
	// get class of column to apply styling
	var columnClass = $(e.target).removeClass(dayClasses).attr('class');
	var colorClass = 'day-bg-' + ( $(e.target).val() ).replace(' ', '-').toLowerCase();
	
	$('#overview-week .' + columnClass).removeClass(dayClasses).addClass(columnClass + ' ' + colorClass);
	
});


// END TODO remove after finishing work
