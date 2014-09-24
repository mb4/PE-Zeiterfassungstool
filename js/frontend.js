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
						sort: [['start', 'DESC']],
						limit: 1
					});

// if an internship is found, init the UI with this internship
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
		$('#form-internship-close').show();
		
		// open modal with form
		$('#form-internship').modal();
	} else {

		alert('No entry found for editing with given ID.');//TODO change visualization?
	}
	
	// TODO load data into form elements (input via element ID)
	// TODO set values of data-date attribute for datepickers

});

// create internship button handler
$('#create-internship-button').on('click', function() {

	$('#form-internship-title').text('Create new internship');
	
	$('#form-internship-cancel').show();
	$('#form-internship-close').show();
	
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

			alert('The end date must be later than the start date.');

		// no errors, save data
		} else {
		
			// save updated entry
			if(i_id.length != 0) {

				createOrUpdateInternship(i_name, startDate, endDate, 7.8, [], [], i_id);
				
				// if the edited internship is currently displayed, update view
				if(i_id == window.internship) {
					refreshInternshipOverview();
				}

			// create new entry
			} else {
			
				createOrUpdateInternship(i_name, startDate, endDate, 7.8, [], []);
			}
			
			$('#form-internship').modal('hide');
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


