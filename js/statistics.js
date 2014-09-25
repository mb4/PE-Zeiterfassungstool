/* * * * * * * * * * * * * * * * * * * * * *
 * 										   *
 * TimeTrackTool						   *
 * 										   *
 * 2014 (c) Marvin Botens, Stephan Giesau  *
 * 										   *
 * * * * * * * * * * * * * * * * * * * * * */


/////////////////////////////////////////////
// STATISTICS FUNCTIONS                    //
/////////////////////////////////////////////

/**
 * returns the total work time for a specified time frame
 * 
 * @param {uid/string} f_internship_id
 * @param {timestamp/int} f_start (optional)
 * @param {timestamp/int} f_end (optional)
 * @returns {int} total_work_time
 */
function getTotalWorkTime(f_internship_id, f_start, f_end)
{   
    var internship = getInternships(f_internship_id);
    
    //if no time frame is defined use internship time frame
    if (typeof(f_start) == "undefined" && typeof(f_end) == "undefined")
    {
        f_start = internship[0].start;
        f_end = internship[0].end;
    }
    //if only start is defined use start day as timeframe
    else if (typeof(f_end) == "undefined")
    {
        f_end = f_start;
    }
    
    //query days in specified time frame
    var days = getDays(f_internship_id, f_start, f_end, "Working Day");
            
    //calculate sum of total work time by working days * daily hours
    var total_work_time = days.length * internship[0].daily_hours;
    
    return total_work_time;
}


/**
 * calculates the completed work time for a specified time frame
 * 
 * @param {uid/string} f_internship_id
 * @param {timestamp/int} f_start (optional)
 * @param {timestamp/int} f_end (optional)
 * @returns {int} completed_work_time
 */
function getCompletedWorkTime(f_internship_id, f_start, f_end)
{   
    var internship = getInternships(f_internship_id);
    
    //if no time frame is defined use internship time frame
    if (typeof(f_start) == "undefined" && typeof(f_end) == "undefined")
    {
        f_start = internship[0].start;
        f_end = internship[0].end;
    }
    //if only start is defined use start day as timeframe
    else if (typeof(f_end) == "undefined")
    {
        f_end = f_start;
    }
    
    //query all working periods in specified time frame
    var working_periods = getWorkingPeriods(f_internship_id, f_start, f_end);
    
    //calculate sum of completed work hours
    var completed_work_time = 0;
    for(var x = 0; x < working_periods.length; x++)
    {
        completed_work_time += working_periods[x].end - working_periods[x].start;
    }
    
    return completed_work_time / (3600*1000);
}


/**
 * calculates the due work time for a specified time frame
 * 
 * @param {uid/string} f_internship_id
 * @param {timestamp/int} f_start (optional)
 * @param {timestamp/int} f_end (optional)
 * @returns {int} due_work_time
 */
function getDueWorkTime(f_internship_id, f_start, f_end)
{
    var due_work_time = getTotalWorkTime(f_internship_id, f_start, f_end) - getCompletedWorkTime(f_internship_id, f_start, f_end);
    
    return due_work_time;
}