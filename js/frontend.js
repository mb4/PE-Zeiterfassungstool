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
	var returnMinutes = (parseFloat( '0.' + humanHours[1] ) * 60).toFixed() + '';
	
	return returnHours + ':' + ((returnMinutes.length == 1) ? '0'+returnMinutes : returnMinutes);
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
		$('#overview-internship-stat-total').text( getHumanReadableHoursFromDecimal( getTotalWorkTime(window.internship) ) );
		$('#overview-internship-stat-worked').text( getHumanReadableHoursFromDecimal( getCompletedWorkTime(window.internship) ) );
		$('#overview-internship-stat-due').text( getHumanReadableHoursFromDecimal( getDueWorkTime(window.internship) ) );
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
			$('#overview-week select.overview-week-' + i).removeAttr('disabled');//.find('option').removeAttr('selected');
			//$('#overview-week select.overview-week-'+i).find('option[value="' + currentDay[0].type + '"]').attr('selected','selected');//TODO
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
			
				console.log( $(e.target).attr('class'), $(e.target).attr('data-timestamp') );
				refreshDayOverview( $(e.target).attr('data-timestamp') );
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
	$('#overview-week-stat-total').text( getHumanReadableHoursFromDecimal( getTotalWorkTime(window.internship, f_timestamp, f_timestamp + 1000*3600*24*6) ) );
	$('#overview-week-stat-worked').text( getHumanReadableHoursFromDecimal( getCompletedWorkTime(window.internship, f_timestamp, f_timestamp + 1000*3600*24*6) ) );
	$('#overview-week-stat-due').text( getHumanReadableHoursFromDecimal( getDueWorkTime(window.internship, f_timestamp, f_timestamp + 1000*3600*24*6) ) );
}


/**
 * updates the day overview based on the given timestamp 
 *
 * @param {timestamp/int} f_timestamp timestamp in a certain week
 */
function refreshDayOverview(f_timestamp) {

	f_timestamp = getMidnightTimestamp( parseInt(f_timestamp) ) || window.overviewDay;
	window.overviewDay = f_timestamp;

	$('#overview-day-date').text( getHumanReadableDate(f_timestamp) );
	$('#overview-day-periods').empty();
	
	var periods = getWorkingPeriods(window.internship, f_timestamp);
	var pStart, pEnd;
	
	if(periods.length != 0) {
	
		for(i = 0; i < periods.length; i++) {
		
			 pStart = getHumanReadableHours(periods[i].start);
			 pEnd = getHumanReadableHours(periods[i].end);
		
			$('#overview-day-periods').append('<tr><td>' + pStart + '</td><td>' + pEnd + '</td><td class="text-right"><a href="#" id="overview-day-edit-' + periods + '"><span class="glyphicon glyphicon-pencil"></span></a></td></tr>');
			//TODO edit handler
		}
	
	// no working periods on this day
	} else {
	
		$('#overview-day-periods').append('<tr><td>No work tracked for this day. Yeah!</td></tr>');
	}
}

/**
 * returns a dynamic block (dynblock) displaying a vacation period or holiday
 * 
 * @param {int} f_id (DOM id)
 * @param {string} f_type
 * @param {string} f_info
 * @param {timestamp} f_start
 * @param {timestamp} f_end
 * @returns {html} dynblock
 */
function getDynblock(f_id, f_type, f_info, f_start, f_end)
{
    //handle input data
    f_info = f_info || "";
    typeof(f_start) == "number" ? f_start=getHumanReadableDate(f_start) : f_start = "";
    typeof(f_end) == "number" ? f_start=getHumanReadableDate(f_end) : f_end = "";
    
    //define first column depending on dynblock type
    var column1_description = f_type == "Vacation" ? "Start date" : "Date";
    
    //define second column depending on dynblock type
    var column2_description = f_type == "Vacation" ? "End date" : "Info";

    
    var column2 = f_type == "Vacation" ?
    	'<div class="input-group">'
			+'<input type="text" id="form-internship-dynblock-col2-'+f_id+'" class="form-control input-sm" data-date="'+f_end+'" data-date-format="dd.mm.yyyy" value="'+f_end+'" placeholder="DD.MM.YYYY">'
			+'<span class="input-group-addon"><i class="glyphicon glyphicon-calendar"></i></span>'
		+'</div>'
		:
		'<input type="text" id="form-internship-dynblock-col2-'+f_id+'" class="form-control input-sm" value="'+f_info+'" placeholder="e.g. Christmas">';
    
    return '<div id="form-internship-dynblock-'+f_id+'" class="row">'
    			+'<div class="col-xs-6 col-md-3">'
                    +'<a class="btn btn-danger btn-xs" id="form-internship-dynblock-delete-'+f_id+'">&times;</a>&nbsp;'
                    +'<strong id="form-internship-dynblock-type-'+f_id+'">'+f_type+'</strong>'
                +'</div>'
                +'<div class="col-xs-12 col-md-4">'
                    +'<div class="form-group">'
                        +'<label class="small for="form-internship-dynblock-col1-'+f_id+'">' + column1_description + '</label>'
                        +'<div class="input-group">'
                            +'<input type="text" id="form-internship-dynblock-col1-'+f_id+'" class="form-control input-sm" data-date="" data-date-format="dd.mm.yyyy" value="'+f_start+'" placeholder="DD.MM.YYYY">\n'
                            +'<span class="input-group-addon"><i class="glyphicon glyphicon-calendar"></i></span>\n'
                        +'</div>\n'
                    +'</div>\n'
                +'</div>\n'
                +'<div class="col-xs-12 col-md-5">\n'
                    +'<div class="form-group">\n'
                    +'<label class="small" for="form-internship-dynblock-col2-'+f_id+'">'+column2_description+'</label>\n'
                        + column2
                    +'</div>\n'
                +'</div>\n'
            +'</div>\n'
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
	
	//var internship_data = db.query('internship', {unique_id: window.internship}); //ToDo: remove!!!
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
                    //add dynblock and initialize datepickers
                    $("#dynblock-wrapper").append(getDynblock(x, periods[x].type, periods[x].info, periods[x].start, periods[x].end));
                    $('#form-internship-dynblock-col1-'+x).datepicker();
                    if (periods[x].type == "Vacation") $('#form-internship-dynblock-col2-'+x).datepicker();
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
	
	$('#form-internship-cancel').show();
	$('#form-internship-delete').hide();
	$('#form-internship-close').show();
	
	$('#form-internship-id').val('');
	
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

				createOrUpdateInternship(i_name, startDate, endDate, 7.8, [], [], i_id);
				
				// if the edited internship is currently displayed, update view
				if(i_id == window.internship) {
					refreshInternshipOverview();
					refreshWeekOverview();
					refreshDayOverview();
				}

			// create new entry
			} else {
			
				var update_id = createOrUpdateInternship(i_name, startDate, endDate, 7.8, [], []);
				
				refreshInternshipOverview(update_id);
				window.internship = update_id;
				refreshWeekOverview();
				refreshDayOverview();
			}
			
			$('#form-internship').modal('hide');
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
   var id = $("#dynblock-wrapper > div").length;
   
   $("#dynblock-wrapper").prepend(getDynblock(id, type));
   $('#form-internship-dynblock-col1-'+id).datepicker();
   if (type == "Vacation") $('#form-internship-dynblock-col2-'+id).datepicker();
   
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


