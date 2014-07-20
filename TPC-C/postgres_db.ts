/// <reference path="../typings/pg/pg.d.ts" />

var pg = require('pg');

class Postgres implements TPCCDatabase {


	connString: string = uvp_postgres_connection_string;
	//connString: string = 'socket:/tmp/?db=tpcc_15w&user=postgres';	//Specifying user=XX doesn't work; set env. variable $PGUSER instead.
	logger: any;
	dummy_mode: boolean = false;

	setDummyMode(dummy_mode: boolean): void {
		this.dummy_mode = dummy_mode;
	}

	getName() { return 'Postgres' + (this.dummy_mode ? 'Dummy' : ''); }

	constructor(logger: any) {

		/* Set pool size */
		pg.defaults.poolSize = uvp_postgres_connection_pool_count;

		this.logger = logger;
	}

	doNewOrderTransaction(input: NewOrder, callback: (status: string, output: NewOrder) => void) {

		var self = this;

		/* Get a pooled connection */
		pg.connect(self.connString, function(err: any, client: any, done: any) {

			if (err) {
				self.logger.log('error','error fetching client from pool: ' + JSON.stringify(err));
				return;
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
			 * decision made earlier to not make Postgres do any extra work (see also
			 * README). I have chosen to violate that decision and use to_jsin() here
			 * because it made it easier for parsing the output from Postgres, and
			 * because in the ad-hoc runs I did not see a measurable difference in query
			 * run times.
			 */
			var query				= self.dummy_mode ? 'SELECT $1::int AS "New Order"' : 'select to_json(process_new_order($1::new_order_param)) as output';
			var bind_values = self.dummy_mode ? ['1'] : [serialized_new_order];

			client.query( {name: 'New Order', text: query, values: bind_values }, function(err: any, result: any) {

				// Release the client back to the pool
				done();

				if (err) {
					self.logger.log('error', JSON.stringify(err));
					callback('Error: ' + JSON.stringify(err), input);
					return;
				}

				if (self.dummy_mode) {
					callback('Success', input);
					return;
				}

				var output = result.rows[0].output;

				for (item_counter = 0; item_counter < 15; ++item_counter) {
					if (input.order_lines[item_counter].ol_i_id === -1) {
						break;
					}

					/*
					 * We require that the order of order-lines fed to the database be the
					 * same as the order of order-lines returned by the database.
					 *
					 * We have to perform this check because the SQL language does not
					 * guarantee any order unless explicitly asked for. The array_agg()
					 * function being used in New Order transaction depends on the order
					 * of the input. So the ordering of array elements in input and output
					 * is same as of now, and this check is to make sure that this
					 * behaviour doesn't change in the futurre.
					 */
					if (input.order_lines[item_counter].ol_i_id !== output.order_lines[item_counter].ol_i_id) {

						/*
						 * Note that these messages may be repeated in logs many times for
						 * one order; once for each item after the first mismatch.
						 */
						self.logger.log('error', 'Order line item-id mismatch; input and output objects follow.');
						self.logger.log('info', input);
						self.logger.log('info', output);

						callback('Exception: Order line item-id mismatch.', input);
						return;
					}

					input.order_lines[item_counter].i_price        = output.order_lines[item_counter].i_price;
					input.order_lines[item_counter].i_name         = output.order_lines[item_counter].i_name;
					input.order_lines[item_counter].i_data         = output.order_lines[item_counter].i_data;
					input.order_lines[item_counter].s_quantity     = output.order_lines[item_counter].s_quantity;
					input.order_lines[item_counter].brand_generic  = output.order_lines[item_counter].brand_generic;
					input.order_lines[item_counter].ol_amount      = output.order_lines[item_counter].ol_amount;
				}

				input.o_id          = output.o_id;
				input.o_entry_d			= new Date(Date.parse(output.o_entry_d));
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

	doPaymentTransaction(input: Payment, callback: (status: string, output: Payment) => void) {

		var self = this;

		/* Get a pooled connection */
		pg.connect(self.connString, function(err: any, client: any, done: any) {

			if (err) {
				self.logger.log('error','error fetching client from pool: ' + JSON.stringify(err));
				return;
			}

			var serialized_payment: string =
			'('
			+ input.w_id + ','
			+ input.d_id + ','
			+ input.c_w_id + ','
			+ input.c_d_id + ','
			+ input.c_id + ','
			+ input.c_last + ','
			+ input.h_amount + ',,,,,,,,,,,,,,,,,,,,,,,,,,,)';

			var query				= self.dummy_mode ? 'SELECT $1::int AS "Payment"' : 'select to_json(process_payment($1::payment_param)) as output';
			var bind_values = self.dummy_mode ? ['1'] : [serialized_payment];

			client.query( {name: 'Payment', text: query, values: bind_values }, function(err: any, result: any) {

				// Release the client back to the pool
				done();

				if (err) {
					self.logger.log('error', JSON.stringify(err));
					callback('Error: ' + JSON.stringify(err), input);
					return;
				}

				if (self.dummy_mode) {
					callback('Success', input);
					return;
				}

				var output = result.rows[0].output;

				input.c_id        = output.c_id;
				input.c_last      = output.c_last;
				input.w_name      = output.w_name;
				input.w_street_1  = output.w_street_1;
				input.w_street_2  = output.w_street_2;
				input.w_city      = output.w_city;
				input.w_state     = output.w_state;
				input.w_zip       = output.w_zip;
				input.d_name      = output.d_name;
				input.d_street_1  = output.d_street_1;
				input.d_street_2  = output.d_street_2;
				input.d_city      = output.d_city;
				input.d_state     = output.d_state;
				input.d_zip       = output.d_zip;
				input.c_first     = output.c_first;
				input.c_middle    = output.c_middle;
				input.c_street_1  = output.c_street_1;
				input.c_street_2  = output.c_street_2;
				input.c_city      = output.c_city;
				input.c_state     = output.c_state;
				input.c_zip       = output.c_zip;
				input.c_phone     = output.c_phone;
				input.c_since			= new Date(Date.parse(output.c_since));
				input.c_credit    = output.c_credit;
				input.c_credit_lim= output.c_credit_lim;
				input.c_discount  = output.c_discount;
				input.c_balance   = output.c_balance;
				input.c_data      = output.c_data;
				input.h_date			= new Date(Date.parse(output.h_date));

				callback('Success', input);
			});
		});
	}

	/*
	 * Since delivery transaction can be executed in asyncronous mode, and because
	 * it has very relaxed response-time requirements, we should gather multiple
	 * transactions here and execute them all in one go.
	 *
	 * TODO: Implement the above idea, and see if it yeilds better results.
	 */
	doDeliveryTransaction(input: Delivery, callback: (status: string, output: Delivery) => void) {

		var self = this;

		/* Get a pooled connection */
		pg.connect(self.connString, function(err: any, client: any, done: any) {

			if (err) {
				self.logger.log('error','error fetching client from pool: ' + JSON.stringify(err));
				return;
			}

			var serialized_delivery: string =
			'('
			+ input.w_id + ','
			+ input.carrier_id + ',)';

			var query				= self.dummy_mode ? 'SELECT $1::int AS "Delivery"' : 'select to_json(process_delivery($1::delivery_param)) as output';
			var bind_values = self.dummy_mode ? ['1'] : [serialized_delivery];

			client.query( {name: 'Delivery', text: query, values: bind_values }, function(err: any, result: any) {

				// Release the client back to the pool
				done();

				if (err) {
					/* TODO: In case of 'Serialization' error, retry the transaction. */
					self.logger.log('error', JSON.stringify(err));
					callback('Error: ' + JSON.stringify(err), input);
					return;
				}

				if (self.dummy_mode) {
					callback('Success', input);
					return;
				}

				var output = result.rows[0].output;

				input.delivered_orders = output.delivered_orders;

				callback('Success', input);
			});
		});
	}

	doOrderStatusTransaction(input: OrderStatus, callback: (status: string, output: OrderStatus) => void): void {
		var self = this;

		/* Get a pooled connection */
		pg.connect(self.connString, function(err: any, client: any, done: any) {

			if (err) {
				self.logger.log('error','error fetching client from pool: ' + JSON.stringify(err));
				return;
			}

			var serialized_order_status: string =
			'('
			+ input.w_id + ','
			+ input.d_id + ','
			+ input.c_id + ','
			+ input.c_last
			+ ',,,,,,,)';

			var query				= self.dummy_mode ? 'SELECT $1::int AS "Order Status"' : 'select to_json(process_order_status($1::order_status_param)) as output';
			var bind_values = self.dummy_mode ? ['1'] : [serialized_order_status];

			client.query( {name: 'Order Status', text: query, values: bind_values }, function(err: any, result: any) {

				// Release the client back to the pool
				done();

				if (err) {
					/* TODO: In case of 'Serialization' error, retry the transaction. */
					self.logger.log('error', JSON.stringify(err));
					callback('Error: ' + JSON.stringify(err), input);
					return;
				}

				if (self.dummy_mode) {
					callback('Success', input);
					return;
				}

				var output = result.rows[0].output;

				input.c_id			 = output.c_id;
				input.c_last       	 = output.c_last;
				input.c_middle       = output.c_middle;
				input.c_first        = output.c_first;
				input.c_balance      = output.c_balance;
				input.o_id           = output.o_id;
				input.o_entry_d      = new Date(Date.parse(output.o_entry_d));
				input.o_carrier_id   = output.o_carrier_id;

				var i: number;
				for (i = 0; i < 15; ++i) {
					if (! output.order_lines || ! output.order_lines[i] || output.order_lines[i].ol_i_id === -1) {
						break;
					}

					var ol_dd = output.order_lines[i].ol_delivery_d;

					input.order_lines[i].ol_i_id			    = output.order_lines[i].ol_i_id;
					input.order_lines[i].ol_supply_w_id  	= output.order_lines[i].ol_supply_w_id;
					input.order_lines[i].ol_quantity		  = output.order_lines[i].ol_quantity;
					input.order_lines[i].ol_amount		    = output.order_lines[i].ol_amount;
					input.order_lines[i].ol_delivery_d	  = ol_dd === null ? new Date(0) : new Date(Date.parse(ol_dd));
				}

				callback('Success', input);
			});
		});
	}

	doStockLevelTransaction(input: StockLevel, callback: (status: string, output: StockLevel) => void): void {
		var self = this;

		/* Get a pooled connection */
		pg.connect(self.connString, function(err: any, client: any, done: any) {

			if (err) {
				self.logger.log('error','error fetching client from pool: ' + JSON.stringify(err));
				return;
			}

			var query				= self.dummy_mode ? 'SELECT $1::int AS "Stock Level"' : 'select process_stock_level($1,$2,$3) as low_stock';
			var bind_values: any = self.dummy_mode ? ['1'] : [input.w_id, input.d_id, input.threshold];

			client.query( {name: 'Stock Level', text: query, values: bind_values }, function(err: any, result: any) {

				// Release the client back to the pool
				done();

				if (err) {
					self.logger.log('error', JSON.stringify(err));
					callback('Error: ' + JSON.stringify(err), input);
					return;
				}

				if (self.dummy_mode) {
					callback('Success', input);
					return;
				}

				input.low_stock = result.rows[0].low_stock;

				callback('Success', input);
			});
		});
	}
}

class PostgresDummy extends Postgres {
	constructor(logger: any) {
		super(logger);
		super.setDummyMode(true);
	}
}
