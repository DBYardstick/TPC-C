/// <reference path="../typings/pg/pg.d.ts" />

var pg = require('pg');

var winston = require('winston');
var logger = new (winston.Logger)({ exitOnError: false })
//logger.handleExceptions(new winston.transports.File({ filename: '/tmp/tpcc_exceptions.log' }))
logger.add(winston.transports.File, { filename: '/tmp/postgres_db.log' });
//winston.remove(winston.transports.Console);

class Postgres implements TPCCDatabase {

	connString: string = 'postgres://postgres:password@localhost/postgres';

	dummy_mode: boolean = false;

	getName() { return 'Postgres' + (this.dummy_mode ? 'Dummy' : ''); }

	constructor() {

		/* Set pool size */
		pg.defaults.poolSize = 1;

	}

	doNewOrderTransaction(input: NewOrder, callback: (status: string, output: NewOrder) => void) {

		var self = this;

		/* Get a pooled connection */
		pg.connect(self.connString, function(err, client, done) {

			if(err) {
				return console.error('error fetching client from pool', err);
			}

			var item_counter: number;
			var serialized_new_order: string = '(';

			serialized_new_order += input.w_id + ',';
			serialized_new_order += input.d_id + ',';
			serialized_new_order += input.c_id + ',"{';

			for (item_counter = 0; item_counter < 15; ++item_counter) {

				if (input.order_lines[item_counter].ol_i_id === -1) {
					break;
				} else if (item_counter > 0) {
					serialized_new_order += ',';
				}

				serialized_new_order += '""(' + input.order_lines[item_counter].ol_i_id + ',';
				serialized_new_order += input.order_lines[item_counter].ol_supply_w_id + ',';
				serialized_new_order += input.order_lines[item_counter].ol_quantity + ',,,,,,)""';
			}

			serialized_new_order += '}",,,,,,,,,,)';

			/*
			 * TODO: Remove the use of to_json() below. This usage is against the
			 * decision made earlier to no make Postgres do any extra work (see also
			 * README). I have chosen to violate that decision and use to_jsin() here
			 * because it made it easier for parsing the output from Postgres, and
			 * because in the ad-hoc runs I did not see much of a difference in query
			 * run times.
			 */
			var query				= self.dummy_mode ? 'SELECT $1::int AS number' : 'select to_json(process_new_order($1::new_order_param)) as output';
			var bind_values = self.dummy_mode ? ['1'] : [serialized_new_order];

			client.query( {name: 'New Order', text: query, values: bind_values }, function(err, result) {

				// Release the client back to the pool
				done();

				if(err) {
					callback('Error: ' + err, input);
					return;
				}

				var output = result.rows[0].output;

				for (item_counter = 0; item_counter < 15; ++item_counter) {
					if (input.order_lines[item_counter].ol_i_id === -1) {
						break;
					}

					input.order_lines[item_counter].i_price        = output.order_lines[item_counter].i_price;
					input.order_lines[item_counter].i_name         = output.order_lines[item_counter].i_name;
					input.order_lines[item_counter].i_data         = output.order_lines[item_counter].i_data;
					input.order_lines[item_counter].s_quantity     = output.order_lines[item_counter].s_quantity;
					input.order_lines[item_counter].brand_generic  = output.order_lines[item_counter].brand_generic;
					input.order_lines[item_counter].ol_amount      = output.order_lines[item_counter].ol_amount;
				}

				input.o_id          = output.o_id;
				input.o_entry_d.setTime(Date.parse(output.o_entry_d));
				input.w_tax         = output.w_tax;
				input.d_tax         = output.d_tax;
				input.d_next_o_id   = output.d_next_o_id;
				input.c_last        = output.c_last;
				input.c_credit      = output.c_credit;
				input.c_discount    = output.c_discount;
				input.o_ol_cnt      = output.o_ol_cnt;
				input.total_amount  = output.total_amount;

				callback('Success', input);
			});
		});
	}
}
