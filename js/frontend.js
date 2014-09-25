/* * * * * * * * * * * * * * * * * * * * * *
 * 										   *
 * TimeTrackTool						   *
 * 										   *
 * 2014 (c) Marvin Botens, Stephan Giesau  *
 * 										   *
 * * * * * * * * * * * * * * * * * * * * * */
 


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
	}
}


/**
 * updates the week overview based on the given timestamp 
 *
 * @param {timestamp/int} f_timestamp timestamp in a certain week
 */
function refreshWeekOverview(f_timestamp) {

	f_timestamp = parseInt(getWeekTimestamp(f_timestamp)) || parseInt(window.overviewWeek);

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
			
			// save timestamp on select element for direct access
			$('#overview-week select.overview-week-'+i).attr('data-timestamp', currentDay[0].timestamp);
			
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
			
			// TODO clickable column to select day
			
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
	$('#overview-week-stat-total').text('Test');
	$('#overview-week-stat-worked').text('Test');
	$('#overview-week-stat-due').text('Test');
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

// edit internship button handler
$('#edit-internship-button').on('click', function() {

	// fill form with internship data
	
	var internship_data = db.query('internship', {unique_id: window.internship});
	
	if(internship_data.length != 0) {
		
		$('#form-internship-name').val( internship_data[0].name );
		$('#form-internship-start').val( getHumanReadableDate(internship_data[0].start) ).attr('data-date', getHumanReadableDate(internship_data[0].start) );
		$('#form-internship-end').val( getHumanReadableDate(internship_data[0].end) ).attr('data-date', getHumanReadableDate(internship_data[0].end) );
		$('#form-internship-id').val( window.internship );
		
		$('#form-internship-title').text('Edit internship');
		
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

			alert('The end date must be later than the start date.');//TODO better alert?

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

	window.overviewWeek = window.overviewWeek - (1000*3600*24*7);
	refreshWeekOverview();
});


// previous week button handler
$('#overview-week-button-next').on('click', function(e) {

	window.overviewWeek = window.overviewWeek + (1000*3600*24*7);
	refreshWeekOverview();
});


