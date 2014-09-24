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

