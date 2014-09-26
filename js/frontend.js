/* * * * * * * * * * * * * * * * * * * * * *
 * 										   *
 * TimeTrackTool						   *
 * 										   *
 * 2014 (c) Marvin Botens, Stephan Giesau  *
 * 										   *
 * * * * * * * * * * * * * * * * * * * * * */



/////////////////////////////////////////////
// FRONTEND HELPER FUNCTIONS               //
/////////////////////////////////////////////

/**
 * Create a date for output on UI from a given timestamp
 * 
 * @param {timestamp/int} timestamp
 * @returns {string} date in human-readable format
 */
function getHumanReadableDate(f_timestamp) {
	
	var humanDate = new Date(f_timestamp);
	
	return '' + (((humanDate.getDate()+'').length == 1) ? '0' : '') + humanDate.getDate() + '.' +
				(((humanDate.getMonth()+1+'').length == 1) ? '0' : '') + (humanDate.getMonth()+1) + '.' +
				humanDate.getFullYear();
}


/**
 * Return timestamp from a given date in human-readable format
 * 
 * @param {string} date in human-readable format
 * @returns {timestamp/int} timestamp
 */
function getTimestampFromDate(f_date) {
	
	var sp = f_date.split('.');
	var date = new Date(sp[2], parseInt(sp[1])-1, sp[0], 0, 0, 0, 0);
	
	return date.getTime();
}


/**
 * Create a H:i hours representation of a decimal float
 * 
 * @param {float} hours in decimal format
 * @returns {string} hours in human-readable format
 */
function getHumanReadableHours(f_timestamp) {

	var humanDate = new Date(f_timestamp);
	
	return '' + (((humanDate.getHours()+'').length == 1) ? '0' : '') + humanDate.getHours() + ':' +
			(((humanDate.getMinutes()+'').length == 1) ? '0' : '') + humanDate.getMinutes();
}


/**
 * Create a H:i hours representation of a decimal float
 * 
 * @param {float} f_decimal hours in decimal format
 * @returns {string} hours in human-readable format
 */
function getHumanReadableHoursFromDecimal(f_decimal) {

	var humanHours = (''+f_decimal).split('.');
	
	var returnHours = humanHours[0];
	var returnMinutes = (parseFloat( '0.' + humanHours[1] ) * 60).toFixed();
	
	// if round error (60 minutes), adjust values
	if(returnMinutes == 60) {
		
		returnHours++;
		returnMinutes = 0;
	}
	
	return returnHours + ':' + (((''+returnMinutes).length == 1) ? '0'+returnMinutes : returnMinutes);
}


/**
 * Return timestamp from given hours in human-readable format and day-representing timestamp
 * 
 * @returns {timestamp/int} timestamp
 */
function getTimestampFromHours(f_timestamp, f_hours) {
	
	var sp = f_hours.split(':');
	var date = new Date( getMidnightTimestamp(f_timestamp) );
	date.setHours( parseInt(sp[0]) );
	date.setMinutes( parseInt(sp[1]) );
	
	return date.getTime();
}





/////////////////////////////////////////////
// FRONTEND FUNCTIONS                      //
/////////////////////////////////////////////

/**
 * Updates the internship view with data from given internship given by its unique_id
 *
 * @param {uid} f_internship_id unique ID of internship
 */
function refreshInternshipOverview(f_internship_id) {

	f_internship_id = f_internship_id || window.internship;
	
	var internship_data = db.query('internship', {unique_id: f_internship_id});
	
	if(internship_data.length != 0) {
		
		$('#overview-internship-name').text( internship_data[0].name );
		$('#overview-internship-start').text( getHumanReadableDate(internship_data[0].start) );
		$('#overview-internship-end').text( getHumanReadableDate(internship_data[0].end) );
		
		// fill table with free days
		$freedays = $('#overview-internship-freedays').empty();
		//TODO
		
		// fill statistics
		$('#overview-internship-stat-total').text( getHumanReadableHoursFromDecimal( getTotalWorkTime(window.internship) ) +' h' );
		$('#overview-internship-stat-worked').text( getHumanReadableHoursFromDecimal( getCompletedWorkTime(window.internship) ) +' h' );
		$('#overview-internship-stat-due').text( getHumanReadableHoursFromDecimal( getDueWorkTime(window.internship) ) +' h' );
	}
}


/**
 * updates the week overview based on the given timestamp 
 *
 * @param {timestamp/int} f_timestamp timestamp in a certain week
 */
function refreshWeekOverview(f_timestamp) {

	f_timestamp = getWeekTimestamp( parseInt(f_timestamp) ) || window.overviewWeek;
	window.overviewWeek = f_timestamp;

	// refresh displayed week time range
	$('#overview-week-timerange').text( getHumanReadableDate(f_timestamp) + ' - ' + getHumanReadableDate( f_timestamp + 1000*3600*24*6 ) );
	
	var currentDay, currentPeriods;
	
	for(i = 0; i <= 6; i++) {

		currentTimestamp = f_timestamp + i * 1000*3600*24;
		currentDay = getDays(window.internship, currentTimestamp);
		
		$('#overview-week tbody td.overview-week-'+i).empty();
		
		// check if data is available for this day
		if(currentDay.length != 0) {
		
			currentPeriods = getWorkingPeriods(window.internship, currentTimestamp);
			
			// set type of day
			$('#overview-week select.overview-week-' + i).removeAttr('disabled');
			$('#overview-week select.overview-week-'+i).val( currentDay[0].type );
			
			// save timestamp on select element and weekday table element for direct access
			$('#overview-week select.overview-week-'+i).attr('data-timestamp', currentDay[0].timestamp);
			$('#overview-week tbody td.overview-week-'+i).attr('data-timestamp', currentDay[0].timestamp);
			
			// overview week day type select handler
			$('#overview-week select.overview-week-'+i).on('change', function(e) {
				
				var dayClasses = 'day-bg-working-day day-bg-weekend day-bg-holiday day-bg-vacation';
				
				// get class of column to apply styling
				var columnClass = $(e.target).removeClass(dayClasses).attr('class');
				var colorClass = 'day-bg-' + ( $(e.target).val() ).replace(' ', '-').toLowerCase();
				
				// update in database
				db.update('day', {
						internship_id: window.internship,
						timestamp: $(e.target).attr('data-timestamp')
					},
					function(row) {
						row.type = $(e.target).val();
						return row;
					}); //TODO auslagern
				db.commit();
				
				$('#overview-week .' + columnClass).removeClass(dayClasses).addClass(columnClass + ' ' + colorClass);
			}).change();
			
			// clickable column to select day overview
			$('#overview-week tbody td.overview-week-'+i).on('click', function(e) {
			
				refreshDayOverview( $(e.delegateTarget).attr('data-timestamp') );
			});
			
			// output periods
			for(j = 0; j < currentPeriods.length; j++) {
				
				pStart = new Date( currentPeriods[j].start );
				pEnd = new Date( currentPeriods[j].end );
				pOffset = ((pStart.getHours()/24 + pStart.getMinutes()/(24*60) + pStart.getSeconds()/(24*3600) + pStart.getMilliseconds()/(24*3600*1000)) * 100).toFixed(2);
				pOffsetEnd = ((pEnd.getHours()/24 + pEnd.getMinutes()/(24*60) + pEnd.getSeconds()/(24*3600) + pEnd.getMilliseconds()/(24*3600*1000)) * 100).toFixed(2);
				pHeight = (pOffsetEnd - pOffset < 2) ? 2 : pOffsetEnd - pOffset;
				
				$('#overview-week tbody td.overview-week-'+i).append('<div class="working-period" style="top:' + pOffset + '%;height:' + pHeight + '%;">&nbsp;</div>');
			}

		// no data for current day
		} else {

			$('#overview-week select.overview-week-'+i).attr('disabled', 'disabled');
			
			$('#overview-week .overview-week-'+i).removeClass('day-bg-working-day day-bg-weekend day-bg-holiday day-bg-vacation');
		}
	}
	
	// week statistics
	$('#overview-week-stat-total').text( getHumanReadableHoursFromDecimal( getTotalWorkTime(window.internship, f_timestamp, f_timestamp + 1000*3600*24*6) ) +' h' );
	$('#overview-week-stat-worked').text( getHumanReadableHoursFromDecimal( getCompletedWorkTime(window.internship, f_timestamp, f_timestamp + 1000*3600*24*6) ) +' h' );
	$('#overview-week-stat-due').text( getHumanReadableHoursFromDecimal( getDueWorkTime(window.internship, f_timestamp, f_timestamp + 1000*3600*24*6) ) +' h' );
}


/**
 * add a working period block to day overview
 *
 * @param {string} id unique_id of displayed entry. If new period, set null / don't set
 * @param {int} i counter for element ids
 * @param {timestamp} start starttime of period
 * @param {timestamp} end endtime of period
 *
 * @returns {int} i element counter of current working period block
 */
function addWorkingPeriodBlock(id, i, start, end) {

	id = id || null;
	i = i || $('#overview-day-periods tr').length;
	start = start || getHumanReadableHours( window.overviewDay );
	end = end || getHumanReadableHours( window.overviewDay + 3600*1000 );
	
	// create a new entry
	if(id == null) {
		id = createOrUpdateWorkingPeriod( getTimestampFromHours(window.overviewDay, start), getTimestampFromHours(window.overviewDay, end), window.internship);
		console.log(id);
	}

	$('#overview-day-periods').append(
				'<tr id="overview-day-' + i + '">' +
					'<td class="form-inline">' +
						'<strong>From</strong>&nbsp; ' +
						'<input class="form-control" id="overview-day-start-' + i + '" placeholder="hh:mm" value="' + start + '" type="text" disabled>' +
					'</td>' +
					'<td class="form-inline">' +
						'<strong>to</strong>&nbsp; ' +
						'<input class="form-control" id="overview-day-end-' + i + '" placeholder="hh:mm" value="' + end + '" type="text" disabled>' +
					'</td>' +
					'<td class="text-right">' +
						'<a href="#" id="overview-day-edit-' + i + '" data-index="' + i + '"><span class="glyphicon glyphicon-pencil"></span></a> ' +
						'<a href="#" id="overview-day-save-' + i + '" data-index="' + i + '" data-uniqueid="' + id + '" class="text-success" style="display:none"><span class="glyphicon glyphicon-ok"></span></a> ' +
						'<a href="#" id="overview-day-delete-' + i + '" data-index="' + i + '" data-uniqueid="' + id + '" class="text-danger" style="display:none"><span class="glyphicon glyphicon-remove"></span></a>' +
					'</td>' +
				'</tr>'
			);
			
	$('#overview-day-edit-'+i).on('click', function(e) {
	
		var x = $(e.delegateTarget).attr('data-index');
		
		// show/hide buttons
		$('#overview-day-edit-'+x).hide();
		$('#overview-day-save-'+x).show();
		$('#overview-day-delete-'+x).show();
	
		// enable input fields
		$('#overview-day-start-'+x).removeAttr('disabled');
		$('#overview-day-end-'+x).removeAttr('disabled');
	});
	
	$('#overview-day-save-'+i).on('click', function(e) {
	
		var x = $(e.delegateTarget).attr('data-index');
		var id = $(e.delegateTarget).attr('data-uniqueid');
		
		// save item
		var wStart = getTimestampFromHours( window.overviewDay , $('#overview-day-start-'+x).val() );
		var wEnd = getTimestampFromHours( window.overviewDay , $('#overview-day-end-'+x).val() );
		
		createOrUpdateWorkingPeriod(wStart, wEnd, window.internship, null, window.overviewDay, id);
		
		// update week overview, if current day is displayed
		if( getWeekTimestamp(window.overviewDay) == window.overviewWeek)
			refreshWeekOverview();
		
		// show/hide buttons
		$('#overview-day-edit-'+x).show();
		$('#overview-day-save-'+x).hide();
		$('#overview-day-delete-'+x).hide();
		
		// disable input fields
		$('#overview-day-start-'+x).attr('disabled','disabled');
		$('#overview-day-end-'+x).attr('disabled','disabled');
	});
	
	$('#overview-day-delete-'+i).on('click', function(e) {
	
		var x = $(e.delegateTarget).attr('data-index');
		var id = $(e.delegateTarget).attr('data-uniqueid');
		
		// delete item
		deleteWorkingPeriod(id);
		
		// do not completely remove from list so id count is still correct, just hide from user
		$('#overview-day-'+x).hide();
		
		// update week overview, if current day is displayed
		if( getWeekTimestamp(window.overviewDay) == window.overviewWeek)
			refreshWeekOverview();
		
		// show/hide buttons
		$('#overview-day-edit-'+x).show();
		$('#overview-day-save-'+x).hide();
		$('#overview-day-delete-'+x).hide();
		
		// disable input fields
		$('#overview-day-start-'+x).attr('disabled','disabled');
		$('#overview-day-end-'+x).attr('disabled','disabled');
	});
	
	return i;
}


/**
 * updates the day overview based on the given timestamp 
 *
 * @param {timestamp/int} f_timestamp timestamp in a certain week
 */
function refreshDayOverview(f_timestamp) {

	//TODO add button for creating new working periods
	//TODO add day statistics

	f_timestamp = getMidnightTimestamp( parseInt(f_timestamp) ) || window.overviewDay;
	window.overviewDay = f_timestamp;

	$('#overview-day-date').text( getHumanReadableDate(f_timestamp) );
	$('#overview-day-periods').empty();

	var day = getDays(window.internship, f_timestamp);

	// fill day info
	$('#overview-day-info').text(day[0].info);

	var periods = getWorkingPeriods(window.internship, f_timestamp);
	var pStart, pEnd;

	if(periods.length != 0) {

		for(i = 0; i < periods.length; i++) {

			 pStart = getHumanReadableHours(periods[i].start);
			 pEnd = getHumanReadableHours(periods[i].end);

			// add work period block to day overview list
			addWorkingPeriodBlock(periods[i].unique_id, i, pStart, pEnd);
		}

	// no working periods on this day
	} else {

		//$('#overview-day-periods').append('<tr><td>No work tracked for this day. Yeah!</td></tr>');//TODO remove
	}
}

/**
 * returns a dynamic block (dynblock) displaying a vacation period or holiday
 * 
 * @param {string} f_type
 * @param {string} f_info
 * @param {timestamp} f_start
 * @param {timestamp} f_end
 * @returns {Number} id (DOM)
 */
function addDynblock(f_type, f_info, f_start, f_end)
{
    //handle input data
    f_info = f_info || "";
    typeof(f_start) == "number" ? f_start=getHumanReadableDate(f_start) : f_start = "";
    typeof(f_end) == "number" ? f_end=getHumanReadableDate(f_end) : f_end = "";
    
    //retrieve and increment id counter
    var id = Number($('#dynblock-wrapper').attr("data-counter"));
    $('#dynblock-wrapper').attr("data-counter", String(id+1));
    
    //define first column depending on dynblock type
    var column1_description = f_type == "Vacation" ? "Start date" : "Date";
    
    //define second column depending on dynblock type
    var column2_description = f_type == "Vacation" ? "End date" : "Info";

    
    var column2 = f_type == "Vacation" ?
    	'<div class="input-group">'
			+'<input type="text" id="form-internship-dynblock-col2-'+id+'" class="form-control input-sm" data-date="'+f_end+'" data-date-format="dd.mm.yyyy" value="'+f_end+'" placeholder="DD.MM.YYYY">'
			+'<span class="input-group-addon"><i class="glyphicon glyphicon-calendar"></i></span>'
		+'</div>'
		:
		'<input type="text" id="form-internship-dynblock-col2-'+id+'" class="form-control input-sm" value="'+f_info+'" placeholder="e.g. Christmas">';
    
    var dynblock = '<div id="form-internship-dynblock-'+id+'" data-id="'+id+'" class="row">'
    			+'<div class="col-xs-6 col-md-3">'
                    +'<a class="btn btn-danger btn-xs" id="form-internship-dynblock-delete-'+id+'">&times;</a>&nbsp;'
                    +'<strong id="form-internship-dynblock-type-'+id+'">'+f_type+'</strong>'
                +'</div>'
                +'<div class="col-xs-12 col-md-4">'
                    +'<div class="form-group">'
                        +'<label class="small for="form-internship-dynblock-col1-'+id+'">' + column1_description + '</label>'
                        +'<div class="input-group">'
                            +'<input type="text" id="form-internship-dynblock-col1-'+id+'" class="form-control input-sm" data-date="" data-date-format="dd.mm.yyyy" value="'+f_start+'" placeholder="DD.MM.YYYY">\n'
                            +'<span class="input-group-addon"><i class="glyphicon glyphicon-calendar"></i></span>\n'
                        +'</div>\n'
                    +'</div>\n'
                +'</div>\n'
                +'<div class="col-xs-12 col-md-5">\n'
                    +'<div class="form-group">\n'
                    +'<label class="small" for="form-internship-dynblock-col2-'+id+'">'+column2_description+'</label>\n'
                        + column2
                    +'</div>\n'
                +'</div>\n'
            +'</div>\n'
    
    $("#dynblock-wrapper").prepend(dynblock);
    $('#form-internship-dynblock-col1-'+id).datepicker();
    if (f_type == "Vacation") $('#form-internship-dynblock-col2-'+id).datepicker();
    
    // eventhandler dynblock delete (deletes vacation period or holiday from internship form)
    $('#form-internship-dynblock-delete-'+id).on('click', function(e) {
        $('#form-internship-dynblock-'+id).remove();
    });
    
    return id;
}


/////////////////////////////////////////////
// APPLICATION STARTUP                     //
/////////////////////////////////////////////


function init() {

	window.overviewDay = getMidnightTimestamp( Date.now() );
	window.overviewWeek = getWeekTimestamp( Date.now() );

	// set initial internship id to newest internship
	newestInternship = db.queryAll('internship', {
							sort: [['start', 'DESC']],
							limit: 1
						});
	
	// if an internship is found, init the UI with this internship
	if(newestInternship.length != 0) {
	
		window.internship = newestInternship[0].unique_id;
		refreshInternshipOverview();
		refreshWeekOverview();
		refreshDayOverview();
	
	// no internship available, show welcome modal
	} else {
	
		$('#modal-welcome').modal({
			backdrop: 'static',
			keyboard: false
		});
		
		// button handler for closing welcome and opening internship form
		$('#welcome-button-close').on('click', function() {
	
			$('#modal-welcome').modal('hide');
					
			$('#form-internship-cancel').hide();
			$('#form-internship-delete').hide();
			$('#form-internship-close').hide();
			
			$('#form-internship-id').val('');
			
			$('#form-internship').modal({
				backdrop: 'static',
				keyboard: false
			});
		});
	}
}

init();

// add datepickers to internship form
$('#form-internship-start').datepicker();
$('#form-internship-end').datepicker();





/////////////////////////////////////////////
// EVENT HANDLERS                          //
/////////////////////////////////////////////

// handler before closing browser tab or window
$(window).bind('beforeunload', function (e) {

	// if tracking is running
	if(window.trackingStart != 0) {
	
		$('#tracking-button').click();
	}
});


// edit internship button handler
$('#edit-internship-button').on('click', function() {

	// fill form with internship data
	
    var internship_data = getInternships(window.internship);
	
	if(internship_data.length != 0) {
		
                $('#form-internship-title').text('Edit internship');
                
                //internship details
		$('#form-internship-name').val( internship_data[0].name );
		$('#form-internship-start').val( getHumanReadableDate(internship_data[0].start) ).attr('data-date', getHumanReadableDate(internship_data[0].start) );
		$('#form-internship-end').val( getHumanReadableDate(internship_data[0].end) ).attr('data-date', getHumanReadableDate(internship_data[0].end) );
		$('#form-internship-id').val( window.internship );
                
		//vacation and holiday details
                $("#dynblock-wrapper").html("");
                var periods = getHolidaysAndVacationPeriods(window.internship);
                for (var x=0; x<periods.length; x++)
                {
                    addDynblock(periods[x].type, periods[x].info, periods[x].start, periods[x].end);
                }
		
		$('#form-internship-cancel').show();
		$('#form-internship-delete').show();
		$('#form-internship-close').show();
		
		// open modal with form
		$('#form-internship').modal();
	} else {
		alert('No entry found for editing with given ID.');//TODO change visualization?
	}
});


// create internship button handler
$('#create-internship-button').on('click', function() {

	$('#form-internship-title').text('Create new internship');
	
        //emtpy internship details
        $('#form-internship-name').val("");
        $('#form-internship-start').val("");
        $('#form-internship-end').val("");
        $('#form-internship-id').val("");
        
	$('#form-internship-cancel').show();
	$('#form-internship-delete').hide();
	$('#form-internship-close').show();
	
	$('#form-internship-id').val('');
        
        //empty vacation and holiday details
        $("#dynblock-wrapper").html("");
	
	// open modal with form
	$('#form-internship').modal();
});


// change displayed internship button handler
$('#change-internship-button').on('click', function() {

	$('#modal-internships-table').empty();
	
	var all = getInternships();
	
	for(i = 0; i < all.length; i++) {
	
		$('#modal-internships-table').append(
			'<tr><td>' + all[i].name + '</td>' +
				'<td>' + getHumanReadableDate( all[i].start ) + '</td>' +
				'<td>' + getHumanReadableDate( all[i].end ) + '</td>' +
				'<td class="text-right"><button id="modal-internships-table-' + i + '" data-uniqueid="' + all[i].unique_id + '" class="btn btn-default btn-xs">select</button></td>' +
			'</tr>');
			
		// event handler for select button
		$('#modal-internships-table-'+i).on('click', function(e) {
		
			// save current tracking to formerly selected internship before switching
			if(window.trackingStart != 0) {
			
				$('#tracking-button').click();
			}
		
			window.internship = $(e.target).attr('data-uniqueid');
			
			refreshInternshipOverview();
			refreshWeekOverview();
			refreshDayOverview();
			
			$('#modal-internships').modal('hide');
		});
	}

	$('#modal-internships').modal();
});


// save internship handler
$('#form-internship-save').on('click', function() {

	// get form values
	var i_name = $('#form-internship-name').val();
	var i_start = $('#form-internship-start').val();
	var i_end = $('#form-internship-end').val();
	var i_id = $('#form-internship-id').val();
        
        // get holidays and vacation periods
        var holidays = [];
        var vacation_days = [];
        $('#dynblock-wrapper > div').each(function(){
            var p_id = $(this).attr("data-id");
            switch($('#form-internship-dynblock-type-'+p_id).text())
            {
                case "Vacation":
                    var p_start = getTimestampFromDate($('#form-internship-dynblock-col1-'+p_id).val());
                    var p_end = getTimestampFromDate($('#form-internship-dynblock-col2-'+p_id).val());
                    vacation_days = vacation_days.concat(convertPeriodToDayList(p_start, p_end));
                    break;
                case "Holiday":
                    var p_start = getTimestampFromDate($('#form-internship-dynblock-col1-'+p_id).val());
                    var p_info = $('#form-internship-dynblock-col2-'+p_id).val();
                    holidays.push({timestamp:p_start,info:p_info});
                    break;
            }
        });
	
	// validation check
	if(i_name.length == 0) {
		$('#form-internship-name').focus().parent().addClass('has-error');
	} else if(i_start.length == 0) {
		$('#form-internship-start').focus().parent().addClass('has-error');
	} else if(i_end.length == 0) {
		$('#form-internship-end').focus().parent().addClass('has-error');
			
	// no errors, save data
	} else {

		var startDate = getTimestampFromDate(i_start);
		var endDate = getTimestampFromDate(i_end);
	
		// check if endDate comes after startDate
		if( startDate > endDate ) {

			alert('The end date must be set after the start date.');//TODO better alert?

		// no errors, save data
		} else {
		
			// save updated entry
			if(i_id.length != 0) {

				createOrUpdateInternship(i_name, startDate, endDate, 7.8, holidays, vacation_days, i_id);
				
				// if the edited internship is currently displayed, update view
				if(i_id == window.internship) {
					refreshInternshipOverview();
					refreshWeekOverview();
					refreshDayOverview();
				}

			// create new entry
			} else {
			
				var update_id = createOrUpdateInternship(i_name, startDate, endDate, 7.8, holidays, vacation_days);
				
				refreshInternshipOverview(update_id);
				window.internship = update_id;
				refreshWeekOverview();
				refreshDayOverview();
			}
			
			$('#form-internship').modal('hide');
			
			//TODO save current tracking if view changes because of new entry
		}
	}
});


// delete internship handler
$('#form-internship-delete').on('click', function() {

	if( ($('#form-internship-id').val()).length != 0 ) {
	
		var deleteConfirm = confirm('Do you really want to delete this internship? All data including tracked vacation days and holidays, and tracked working periods will be deleted irrevocable and immediately.');

		if(deleteConfirm) {
		
			deleteInternship( $('#form-internship-id').val() );
			
			$('#form-internship').modal('hide');
			
			// update week and day list
			refreshWeekOverview();
			refreshDayOverview();
			
			// check for most current internship - used in app init function
			init();
		}
	}
});

// btn-add-dynblock handler (adds vacation period or holiday to internship form)
$('.btn-add-dynblock').on('click', function(e) {
   
   var type = $(this).attr("data-type");
   //var id = $("#dynblock-wrapper > div").length; //ToDo: remove
   
   addDynblock(type);
   
   /*$("#dynblock-wrapper").prepend(getDynblock(id, type));
   $('#form-internship-dynblock-col1-'+id).datepicker();
   if (type == "Vacation") $('#form-internship-dynblock-col2-'+id).datepicker();
   */
});


// tracking start/stop handler
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
		var dateNow = Date.now();
		createOrUpdateWorkingPeriod(window.trackingStart, dateNow, window.internship);

		// add working period to day overview (if displayed day there is current day)
		if( getMidnightTimestamp( Date.now() ) == window.overviewDay) {

			refreshDayOverview();
		}
		
		// refresh week overview if current day is displayed
		if( getWeekTimestamp( Date.now() ) == window.overviewWeek ) {
		
			refreshWeekOverview();
		}
		
		// reset trackingStart
		window.trackingStart = 0;
	}
});


// previous week button handler
$('#overview-week-button-prev').on('click', function(e) {

	refreshWeekOverview( window.overviewWeek - (1000*3600*24*7) );
});


// previous week button handler
$('#overview-week-button-next').on('click', function(e) {

	refreshWeekOverview( window.overviewWeek + (1000*3600*24*7) );
});


// add new period to day overview button handler
$('#overview-day-button-addperiod').on('click', function() {

	var uid = addWorkingPeriodBlock();
	
	console.log(uid);
	
	$('#overview-day-edit-'+uid).click();
});

