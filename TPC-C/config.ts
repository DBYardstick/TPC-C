
/*
 * Parse configuration for the rest of the TPC-C test application.
 *
 * This should be the only place to declare user-visible global variables, and
 * these variables should be configurable by the user without having to modify
 * the code.
 *
 * 'uvp' prefix stands for 'User-Visible-Parameter'
 */

/* number of active warehouses; warehouse numbers start from 1 */
var uvp_active_warehouses: number = 1;

/* If true, hammer the database */
var uvp_hammer: boolean = false;  /* Hammer mode currently doesn't work reliably and consistently */

/* Where to send the logs */
var uvp_log_file: string = '/tmp/tpcc.' + process.pid + '.log';

/* Interval, in seconds, between TPC-C Admin screen's stats calculations and refresh */
var uvp_stats_interval: number = 1;

/* Database to test */
var uvp_database_type = 'NullDB';

/*
 * As a convention, sub-module specific UVPs should use variable names of the
 * form: uvp_<subModuleName>_... See Postgres-DB-interface specific variable
 * names below, for example.
 */

/* Number of connections in Postgres connection-pool */
var uvp_postgres_connection_pool_count: number = 1;

/* Postgres connection string */
var uvp_postgres_connection_string: string = 'postgres://tpcc:password@localhost/postgres';

/*
 * TODO: The NURand() implemetation in the application requires that C-Load
 *value be fed to it according to Clause 2.1.6.1. Either requires the use to
 * pass that value as a UVP, or require the DDL to populate that in the database
 * somewhere and have DB-Interface in the appllication extract it.
 */

/*
 * The user provides a JSON object containing the UVPs, as an environment
 * variable. We parse that object here.
 *
 * XXX: Use nconf some day. It currently doesn't show a great lot of examples
 * of all the sources it supports.
 */

/* If $TPCC environment variable is defined, pick defaults from there. */
if (typeof process.env.TPCC !== "undefined") {

  var config: any;

  try {
    config = JSON.parse(process.env.TPCC);
  } catch (err) {
    console.log('There has been an error parsing the JSON data.')
    console.log(err);
    process.exit(1);
  }

  if (typeof config.active_warehouses !== "undefined") {
    uvp_active_warehouses = ~~config.active_warehouses;
    if (uvp_active_warehouses < 1) {
      console.log('Active warehouse count cannot be less than 1.')
      process.exit(1);
    }
  }

  if (typeof config.hammer !== "undefined") {
    if (config.hammer === true
        || config.hammer === 'true'
        || config.hammer === 't') {

          uvp_hammer = true;
    } else
    if (config.hammer === false
        || config.hammer === 'false'
        || config.hammer === 'f') {

          uvp_hammer = false;
    } else {
      console.log('Parameter "hammer" must be either true or false.')
      process.exit(1);
    }
  }

  if (typeof config.log_file !== "undefined") {
    uvp_log_file = config.log_file;
  }

  if (typeof config.stats_interval !== "undefined") {
    uvp_stats_interval = ~~config.stats_interval;
    if (uvp_stats_interval < 1) {
      console.log('Stats update interval cannot be less than 1.')
      process.exit(1);
    }
  }

  if (typeof config.postgres_connection_pool_count !== "undefined") {
    uvp_postgres_connection_pool_count = ~~config.postgres_connection_pool_count;
    if (uvp_postgres_connection_pool_count < 1) {
      console.log('Postgres connection-pool count cannot be less than 1.')
      process.exit(1);
    }
  }

  if (typeof config.postgres_connection_string !== "undefined") {
    uvp_postgres_connection_string = config.postgres_connection_string;

    /*
     * XXX: Maybe have the DB-interface connect and validate the connection string
     * before proceeding.
     */
  }

  if (typeof config.database_type !== "undefined") {
    uvp_database_type = config.database_type;

    if (uvp_database_type === "Postgres"
       || uvp_database_type === "NullDB"
       || uvp_database_type === "PostgresDummy") {
      ;
    } else {
      console.log('Unknown database: ' + uvp_database_type + '. Supported databases are: NullDB, Postgres, PostgresDummy.')
      process.exit(1);
    }
  }
}
