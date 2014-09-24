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
window.overviewDay = 0; // currently displayed day
window.overviewWeek = 0; // currently displayed week
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
    db.createTable('day', ['internship_id', 'timestamp', 'type', 'info']);
    db.createTable('working_period', ['unique_id', 'internship_id', 'day_timestamp', 'start', 'end', 'info']);
    
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
 * Create a date for output on UI from a given timestamp
 * 
 * @param {timestamp/int} timestamp
 * @returns {string} date in human-readable format
 */
function getHumanReadableDate(f_timestamp) {
	
	var date = new Date(f_timestamp);
	
	
	return '' + (((date.getDate()+'').length == 1) ? '0' : '') + date.getDate() + '.' +
				(((date.getMonth()+1+'').length == 1) ? '0' : '') + (date.getMonth()+1) + '.' +
				date.getFullYear();
}


/**
 * converts a period (start, end) into a list of days
 * 
 * @param {type} f_start
 * @param {type} f_end
 * @returns {Array} list of timestamp represented days in the specified period
 */
function convertPeriodToDayList(f_start, f_end) {
    
    //get midnight timestamp for start, end
    f_start = getMidnightTimestamp(f_start);
    f_end = getMidnightTimestamp(f_end);
    
    //create and populate array with days between start and end (inclusive)
    var days = new Array();
    for(var timestamp = f_start; timestamp <= f_end; timestamp+=1000*60*60*24)
    {
        days.push(timestamp);
    }
    return days;
}


/**
 * returns array with objects of type "Holiday" (day) and "Vacation" (period)
 * 
 * @param {string/uid} f_internship_id
 * @returns {array} free days and periods
 */
function getFreeDaysAndPeriods(f_internship_id)
{
    //query all day records belonging to specified internship
    var days_total = db.query("day", {internship_id: f_internship_id});
    var free_periods = new Array();
    
    for (x=0; x<days_total.length; x++)
    {
        if(days_total[x].type == "Holiday")
        {
            //push holidays directly to free_periods array
            free_periods.push({type:days_total[x].type, start:days_total[x].timestamp, info:days_total[x].info});
        }
        else if (days_total[x].type == "Vacation")
        {
            //change end of vacation object to current vacation day
            if(typeof(vacation) == "object")
            {
                vacation.end = days_total[x].timestamp;
                vacation.vacation_days+=1;
            }
            //create vacation object if it doesn't exist
            else
            {
                var vacation = {type:days_total[x].type, start:days_total[x].timestamp, end:days_total[x].timestamp, vacation_days:1};
            }
        }
        else if (days_total[x].type == "Working Day")
        {
            //if existing, push vacation object to free_periods array before destroying the former
            if(typeof(vacation) == "object")
            {
                free_periods.push(vacation);
                vacation = undefined;
            }
        }
    }
    
    //if internship ends with vacation, the last vacation object needs to be pushed to the free_periods array after above iteration
    if(typeof(vacation) == "object")
    {
        free_periods.push(vacation);
        vacation = undefined;
    }
    
    return free_periods;
}

/**
 * calculates for a given timestamp the midnight timestamp of the particular day
 * 
 * @param {timestamp/int} f_timestamp
 * @returns {timestamp/int} midnight timestamp
 */
function getMidnightTimestamp(f_timestamp) {
    
    var date = new Date(f_timestamp);
    date.setMilliseconds(0);
    date.setSeconds(0);
    date.setMinutes(0);
    date.setHours(0);
    return date.getTime();
}


/**
 * calculates for a given timestamp the midnight timestamp of the week's monday
 * 
 * @param {timestamp/int} f_timestamp
 * @returns {timestamp/int} midnight timestamp of week's monday
 */
function getWeekTimestamp(f_timestamp) {
    
    var date = new Date(f_timestamp);
    var dayOfWeek = date.getDay();
    
    if(dayOfWeek == 0) dayOfWeek = 7;
    
    // calculate monday (sunday = 0, monday = 1, ...)
    if(dayOfWeek != 1)
    	date.setDate( date.getDate() - (dayOfWeek-1) );
    
    return getMidnightTimestamp( date.getTime() );
}

	
/**
 * creates/updates a working period belonging to a day
 * 
 * @param {timestamp/int} f_start
 * @param {timestamp/int} f_end
 * @param {string} f_internship_id
 * @param {string} f_info optional
 * @param {timestamp/int} f_day_timestamp optional midnight timestamp of day
 * @param {string} f_unique_id optional unique ID of existing working period
 */
function createOrUpdateWorkingPeriod(f_start, f_end, f_internship_id, f_info, f_day_timestamp, f_unique_id) {

	f_info = f_info || null;
	f_day_timestamp = f_day_timestamp || getMidnightTimestamp(f_start);
    f_unique_id = f_unique_id || generateUniqueId(f_start, f_internship_id + f_day_timestamp);

    
    db.insertOrUpdate('working_period',
    {
    	unique_id: f_unique_id,
        internship_id: f_internship_id, 
        day_timestamp: f_day_timestamp
    },
    {
    	unique_id: f_unique_id,
        internship_id: f_internship_id, 
        day_timestamp: f_day_timestamp, 
        start: f_start,
        end: f_end,
        info: f_info
    });
    
    db.commit();
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
//createOrUpdateInternship("test", 1411549941668, 1412759541668, 2443, [1411768800000,1411682400005], convertPeriodToDayList(1411549941668, 1412759541668), 222);
//console.log(getFreeDaysAndPeriods(222));


/**
 * Updates the internship view with data from given internship given by its unique_id
 *
 * @param {uid} f_internship_id unique ID of internship
 */
function refreshInternshipOverview(f_internship_id) {
	
	var internship_data = db.query('internship', {unique_id: f_internship_id});
	
	if(internship_data.length != 0) {
		
		$('#overview-day-name').text( internship_data[0].name );
		$('#overview-day-start').text( getHumanReadableDate(internship_data[0].start) );
		$('#overview-day-end').text( getHumanReadableDate(internship_data[0].end) );
		
		// fill table with free days
		$freedays = $('#overview-internship-freedays').empty();
		
		internship_freedays = db.query('day',
					function(row) {
						if(row.internship_id == f_internship_id && ( row.type == 'Vacation' || row.type == 'Holiday' ))
							return true;
						return false;
					});
		
		if(internship_freedays.length != 0) {

			for(i = 0; i < internship_freedays.length; i++) {
				
				$freedays.append('<tr><td>' + internship_freedays[i].type + '</td><td>' + getHumanReadableDate(internship_freedays[i].start) + '</td><td>' + getHumanReadableDate(internship_freedays[i].end) + '</td></tr>');
			}
		} else {
			$freedays.append('<tr><td>No free days added for this internship.</td></tr>');
		}
	}
}


/**
 * updates the week overview based on the given timestamp 
 *
 * @param {timestamp/int} f_timestamp timestamp in a certain week
 */
function refreshWeekOverview(f_timestamp) {

	f_timestamp = getWeekTimestamp(f_timestamp) || window.overviewWeek;
	//TODO
}


/**
 * updates the day overview based on the given timestamp 
 *
 * @param {timestamp/int} f_timestamp timestamp in a certain week
 */
function refreshDayOverview(f_timestamp) {

	f_timestamp = getMidnightTimestamp(f_timestamp) || window.overviewDay;

	$('#overview-day-date').text( getHumanReadableDate(f_timestamp) );
	//TODO
}





/////////////////////////////////////////////
// APPLICATION STARTUP                     //
/////////////////////////////////////////////

// set initial internship id to newest internship
newestInternship = db.queryAll('internship', {
						sort: [['timestamp', 'DESC']],
						limit: 1
					});

if(newestInternship.length != 0) {

	window.internship = newestInternship[0].unique_id;
	
	window.overviewDay = getMidnightTimestamp( Date.now() );
	window.overviewWeek = getWeekTimestamp( Date.now() );
	
	refreshInternshipOverview();
	refreshWeekOverview();
	refreshDayOverview();

// no internship available, show welcome modal
} else {

	$('#welcome').modal({
		backdrop: 'static',
		keyboard: false
	});
	
	// button handler for closing welcome and opening internship form
	$('#welcome-button-close').on('click', function() {

		$('#welcome').modal('hide');
		
		$('#form-internship-close').hide();
		$('#form-internship-cancel').hide();
		$('#form-internship').modal({
			backdrop: 'static',
			keyboard: false
		});
	});
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
	
	var internship_data = db.query('internship', {unique_id: window.internship});
	
	if(internship_data.length != 0) {
		
		$('#form-internship-name').val( internship_data[0].name );
		$('#form-internship-start').val( getHumanReadableDate(internship_data[0].start) ).attr('data-date', getHumanReadableDate(internship_data[0].start) );
		$('#form-internship-end').val( getHumanReadableDate(internship_data[0].end) ).attr('data-date', getHumanReadableDate(internship_data[0].end) );
		
		$('#form-internship-cancel').show();
		$('#form-internship-close').show();
		
		// open modal with form
		$('#form-internship').modal();
	} else {

		alert('No entry found for editing with given ID.');//TODO change visualization?
	}
	
	// TODO load data into form elements (input via element ID)
	// TODO set values of data-date attribute for datepickers

});

//create internship button handlers
$('#create-internship-button').on('click', function() {
	
	$('#form-internship-cancel').show();
	$('#form-internship-close').show();
	
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
		$('#tracking-time').runner('stop');

		// save to working_period
		createOrUpdateWorkingPeriod(window.trackingStart, Date.now(), window.internship);

		// add working period to day overview (if displayed day there is current day)
		if( getMidnightTimestamp( Date.now() ) == window.overviewDay) {

			//TODO add to day overview
		}		
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
