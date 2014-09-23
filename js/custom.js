// load DB
// initialise. If the database doesn't exist, it is created
var db = new localStorageDB('timetracktool', localStorage);

// check if the database was just created. Then create all tables
if( db.isNew() ) {

    // create tables
    db.createTable('internship', ['unique_id', 'name', 'manager', 'lerner_id', 'start', 'end']);
    db.createTable('day', ['unique_id', 'timestamp', 'type']);
    db.createTable('working_period', ['unique_id', 'start', 'end', 'info']);

    // save tables to localStorage
    db.commit();
}

//TODO remove, console output of DB contents
console.debug( JSON.parse( db.serialize() ) );