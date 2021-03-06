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
var db = new localStorageDB('timetracktool', window.localStorage);

// check if the database was just created. Then create all tables
if( db.isNew() ) {

    // create tables
    db.createTable('internship', ['unique_id', 'name', 'start', 'end', 'daily_hours']);
    db.createTable('day', ['internship_id', 'timestamp', 'type', 'info']);
    db.createTable('working_period', ['unique_id', 'internship_id', 'day_timestamp', 'start', 'end', 'info']);
    db.createTable('user_preferences', ['key', 'value']);
    
    // save tables to localStorage
    db.commit();
}

//TODO remove, console output of DB contents
console.debug( JSON.parse( db.serialize() ) );





/////////////////////////////////////////////
// BACKEND FUNCTIONS                       //
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
 * return index of the object in an array whose specified attribute has the specified value
 * 
 * @param {array of objects} f_array
 * @param {string} f_attr_name
 * @param {any} f_attr_value
 * @returns {Number}
 */
function indexOfObjectAttributeValueInObjectArray(f_array, f_attr_name, f_attr_value)
{
    for (var x=0; x<f_array.length; x++)
    {
        if (f_array[x][f_attr_name] == f_attr_value) return x;
    }
    return -1;
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
function getHolidaysAndVacationPeriods(f_internship_id)
{
    //query all day records belonging to specified internship
    var days_total = db.query("day", {internship_id: f_internship_id});
    var days_and_periods = new Array();
    
    for (x=0; x<days_total.length; x++)
    {
        if(days_total[x].type == "Holiday")
        {
            //push holidays directly to days_and_periods array
            days_and_periods.push({type:days_total[x].type, start:days_total[x].timestamp, end:days_total[x].timestamp, info:days_total[x].info, days:1});
        }
        else if (days_total[x].type == "Vacation")
        {
            //change end of vacation object to current vacation day
            if(typeof(vacation) == "object")
            {
                vacation.end = days_total[x].timestamp;
                vacation.days+=1;
            }
            //create vacation object if it doesn't exist
            else
            {
                var vacation = {type:days_total[x].type, start:days_total[x].timestamp, end:days_total[x].timestamp, info:"", days:1};
            }
        }
        else if (days_total[x].type == "Working Day")
        {
            //if existing, push vacation object to days_and_periods array before destroying the former
            if(typeof(vacation) == "object")
            {
                days_and_periods.push(vacation);
                vacation = undefined;
            }
        }
    }
    
    //if internship ends with vacation, the last vacation object needs to be pushed to the days_and_periods array after above iteration
    if(typeof(vacation) == "object")
    {
        days_and_periods.push(vacation);
        vacation = undefined;
    }
    
    return days_and_periods;
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
    
    var wdate = new Date( getMidnightTimestamp(f_timestamp) );
    var dayOfWeek = wdate.getDay();
    
    if(dayOfWeek == 0) dayOfWeek = 7;
    
    // calculate monday (sunday = 0, monday = 1, ...)
    if(dayOfWeek != 1)
    	wdate.setDate( wdate.getDate() - (dayOfWeek-1) );
    	
    var retval = wdate.getTime();
    
    return wdate.getTime();
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
    
    return f_unique_id;
}

	
/**
 * creates/updates a day belonging to an internship
 * 
 * @param {uid} f_internship_id
 * @param {timestamp/int} f_timestamp
 * @param {string} f_type
 */
function createOrUpdateDay(f_internship_id, f_timestamp, f_type, f_info)
{    
    //get midnight timestamp for day
    f_timestamp = getMidnightTimestamp(f_timestamp);
    
    var data =     {
        internship_id: f_internship_id, 
        timestamp: f_timestamp, 
        type: f_type,
    };
    
    if (typeof(f_info) == "string") data.info = f_info;
    
    db.insertOrUpdate("day",
    {
        internship_id: f_internship_id, 
        timestamp: f_timestamp
    },
    data
    );
    
    db.commit();
}


/**
 * creates/updates an internship
 * deletes days previously assigned to the internship, that are now outside the new internship period
 * creates/updates days in the internship period taking into account holidays and vacation days
 * 
 * @param {string} f_name
 * @param {timestamp/int} f_start
 * @param {timestamp/int} f_end
 * @param {int} f_daily_hours
 * @param {array of timestamps/int} f_holidays
 * @param {type of timestamp/int} f_vacation_days
 * @param {uid/string} f_unique_id
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
         f_holidays[x].timestamp = getMidnightTimestamp(f_holidays[x].timestamp);
     }
     for (var x=0; x < f_vacation_days.length; x++)
     {
         f_vacation_days[x] = getMidnightTimestamp(f_vacation_days[x]);
     }
     
     //delete working periods outside new internship period
     db.deleteRows("working_period", function(row){
        if(row.internship_id == f_unique_id && (row.day_timestamp < f_start || row.day_timestamp > f_end))
            return true;
        else
            return false;
     });
    
    //delete days outside new internship period
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
        var holiday_index = indexOfObjectAttributeValueInObjectArray(f_holidays, "timestamp", date.getTime());
        var type = undefined;
        var info = undefined;

        //if (f_holidays.indexOf(date.getTime()) >= 0) //ToDo: remove
        if (holiday_index >= 0)
        {
            type = "Holiday";
            info = f_holidays[holiday_index].info;
        }
        else if (date.getDay() == 0 || date.getDay() == 6)
            type = "Weekend";
        else if (f_vacation_days.indexOf(date.getTime()) >= 0)
            type = "Vacation";
        else 
            type = "Working Day";
        
        createOrUpdateDay(f_unique_id, timestamp, type, info);
     }
                
	db.commit();
	
	return f_unique_id;
}


/**
 * deletes an internship + all corresponding days and working periods
 * 
 * @param {uid/string} f_internship_id
  */
function deleteInternship(f_internship_id)
{
    db.deleteRows("working_period", {internship_id:f_internship_id});
    db.deleteRows("day", {internship_id:f_internship_id});
    db.deleteRows("internship", {unique_id:f_internship_id});
    
    db.commit();
}


/**
 * deletes the specified working period
 * 
 * @param {uid/string} f_unique_id
 */
function deleteWorkingPeriod(f_unique_id)
{
    db.deleteRows("working_period", {unique_id:f_unique_id});
    db.commit();
}

/**
 * returns all working periods for a specified internship and time frame
 * 
 * @param {uid/string} f_internship_id
 * @param {timestamp/int} f_start
 * @param {timestamp/int} f_end (optional)
 * @returns {array consisting of objects} working_periods
 */
function getWorkingPeriods(f_internship_id, f_start, f_end)
{
    //if end is not specified working periods for the start day will be returned
    f_end = f_end || f_start;
    
    //get midnight timestamp for start + end day
    f_start = getMidnightTimestamp(f_start);
    f_end = getMidnightTimestamp(f_end);
    
    //query all working periods in specified time frame
    var working_periods = db.queryAll('working_period', {
    	query: function(row){
        	return (row.internship_id == f_internship_id && (f_start <= row.day_timestamp && row.day_timestamp <= f_end)) ? true : false
    		},
    	sort: [['start', 'ASC']]
    });
    
    return working_periods;
}

/**
 * returns all days for a specified internship and time frame
 * 
 * @param {uid/string} f_internship_id
 * @param {timestamp/int} f_start
 * @param {timestamp/int} f_end (optional)
 * @param {array} f_types (optional)
 * @returns {array of objects} days
 */
function getDays(f_internship_id, f_start, f_end, f_types)
{
    //if end is not specified only the start day will be returned
    f_end = f_end || f_start;
    
    //if types are not specified days for all types are returned
    f_types = f_types || ["Working Day","Weekend","Holiday","Vacation"];
    
    //get midnight timestamp for start + end day
    f_start = getMidnightTimestamp(f_start);
    f_end = getMidnightTimestamp(f_end);
    
    //query all days in specified time frame
    var days = db.query("day", function(row){
      return (row.internship_id == f_internship_id && f_types.indexOf(row.type) >= 0 && (f_start <= row.timestamp && row.timestamp <= f_end)) ? true : false
    });
    
    return days;
}

/**
 * returns the specified/ all internships
 * 
 * @param {uid/string} f_internship_id (optional)
 * @returns {array with objects} internship
 */
function getInternships(f_internship_id)
{
    return typeof(f_internship_id) == "string" ? db.query("internship", {unique_id:f_internship_id}) : db.query("internship");
}
