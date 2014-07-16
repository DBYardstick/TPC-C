var DummyDB = (function () {
    function DummyDB(logger) {
        this.nullDBResponseTime = 0 * 1000;
    }
    DummyDB.prototype.getName = function () {
        return 'DummyDB';
    };

    DummyDB.prototype.doNewOrderTransaction = function (input, callback) {
        var response = function () {
            /* Populate the output fields of the order with dummy data */
            input.o_id = 9999;
            input.o_entry_d = new Date();
            input.w_tax = 0.10;
            input.d_tax = 0.15;
            input.d_next_o_id = 2009;
            input.c_last = 'Singh';
            input.c_credit = 'GC';
            input.c_discount = 0.40;
            input.total_amount = 800;

            var i;
            input.o_ol_cnt = 0;

            for (i = 0; i < 15; ++i) {
                if (input.order_lines[i].ol_i_id !== -1) {
                    ++input.o_ol_cnt;

                    input.order_lines[i].i_price = 9;
                    input.order_lines[i].i_name = 'Item X';
                    input.order_lines[i].i_data = 'Item Data';
                    input.order_lines[i].s_quantity = 99999;
                    input.order_lines[i].brand_generic = 'B';
                    input.order_lines[i].ol_amount = 99;
                }
            }

            if (Math.random() < 0.01) {
                callback('Item number is not valid', input);
            } else {
                callback('Success', input);
            }
        };

        if (nullDBResponseTime > 0) {
            setTimeout(response, nullDBResponseTime);
        } else {
            response();
        }
    };

    /* TODO: Implement the "Dummy" Payment transaction here */
    DummyDB.prototype.doPaymentTransaction = function (input, callback) {
        if (nullDBResponseTime > 0) {
            setTimeout(function () {
                callback('Success', input);
            }, nullDBResponseTime);
        } else {
            callback('Success', input);
        }
    };

    /* TODO: Implement the "Dummy" Delivery transaction here */
    DummyDB.prototype.doDeliveryTransaction = function (input, callback) {
        if (nullDBResponseTime > 0) {
            setTimeout(function () {
                callback('Success', input);
            }, nullDBResponseTime);
        } else {
            callback('Success', input);
        }
    };

    /* TODO: Implement the "Dummy" OrderStatus transaction here */
    DummyDB.prototype.doOrderStatusTransaction = function (input, callback) {
        if (nullDBResponseTime > 0) {
            setTimeout(function () {
                callback('Success', input);
            }, nullDBResponseTime);
        } else {
            callback('Success', input);
        }
    };
    return DummyDB;
})();

var NullDB = (function () {
    function NullDB(logger) {
    }
    NullDB.prototype.getName = function () {
        return 'NullDB';
    };

    NullDB.prototype.doNewOrderTransaction = function (input, callback) {
        callback('Success', input);
    };

    NullDB.prototype.doPaymentTransaction = function (input, callback) {
        callback('Success', input);
    };

    NullDB.prototype.doDeliveryTransaction = function (input, callback) {
        callback('Success', input);
    };

    NullDB.prototype.doOrderStatusTransaction = function (input, callback) {
        callback('Success', input);
    };
    return NullDB;
})();
var NewOrderLine = (function () {
    function NewOrderLine(ol_i_id, ol_supply_w_id, ol_quantity, i_price, i_name, i_data, s_quantity, brand_generic, ol_amount) {
        this.ol_i_id = ol_i_id;
        this.ol_supply_w_id = ol_supply_w_id;
        this.ol_quantity = ol_quantity;
        this.i_price = i_price;
        this.i_name = i_name;
        this.i_data = i_data;
        this.s_quantity = s_quantity;
        this.brand_generic = brand_generic;
        this.ol_amount = ol_amount;
    }
    return NewOrderLine;
})();

/* New Order I/O, per Clause 2.4.3 */
var NewOrder = (function () {
    function NewOrder() {
        this.order_lines = [];

        var i;
        for (i = 0; i < 15; ++i) {
            this.order_lines[i] = new NewOrderLine(0, 0, 0, 0, '', '', 0, '', 0);
        }
    }
    return NewOrder;
})();

var Payment = (function () {
    function Payment() {
    }
    return Payment;
})();

var DeliveredOrder = (function () {
    function DeliveredOrder(d_id, o_id) {
        this.d_id = d_id;
        this.o_id = o_id;
    }
    return DeliveredOrder;
})();

var Delivery = (function () {
    function Delivery() {
        this.delivered_orders = [];

        var i;
        for (i = 0; i < 10; ++i) {
            this.delivered_orders[i] = new DeliveredOrder(0, 0);
        }
    }
    return Delivery;
})();

var OrderStatusLine = (function () {
    function OrderStatusLine(ol_i_id, ol_supply_w_id, ol_quantity, ol_amount, ol_delivery_d) {
        this.ol_i_id = ol_i_id;
        this.ol_supply_w_id = ol_supply_w_id;
        this.ol_quantity = ol_quantity;
        this.ol_amount = ol_amount;
        this.ol_delivery_d = ol_delivery_d;
    }
    return OrderStatusLine;
})();

var OrderStatus = (function () {
    function OrderStatus() {
        this.order_lines = [];

        var i;
        for (i = 0; i < 15; ++i) {
            this.order_lines[i] = new OrderStatusLine(0, 0, 0, 0, new Date());
        }
    }
    return OrderStatus;
})();
/// <reference path="../typings/pg/pg.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var pg = require('pg');

var Postgres = (function () {
    function Postgres(logger) {
        this.connString = 'postgres://postgres:password@localhost/tpcc_15w';
        this.dummy_mode = false;
        /* Set pool size */
        pg.defaults.poolSize = 395;

        this.logger = logger;
    }
    Postgres.prototype.setDummyMode = function (dummy_mode) {
        this.dummy_mode = dummy_mode;
    };

    Postgres.prototype.getName = function () {
        return 'Postgres' + (this.dummy_mode ? 'Dummy' : '');
    };

    Postgres.prototype.doNewOrderTransaction = function (input, callback) {
        var self = this;

        /* Get a pooled connection */
        pg.connect(self.connString, function (err, client, done) {
            if (err) {
                self.logger.log('error', 'error fetching client from pool: ' + JSON.stringify(err));
                return;
            }

            var item_counter;
            var serialized_new_order = '(';

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
            var query = self.dummy_mode ? 'SELECT $1::text AS "New Order"' : 'select to_json(process_new_order($1::new_order_param)) as output';
            var bind_values = self.dummy_mode ? ['New Order'] : [serialized_new_order];

            client.query({ name: 'New Order', text: query, values: bind_values }, function (err, result) {
                // Release the client back to the pool
                done();

                if (err) {
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

                    input.order_lines[item_counter].i_price = output.order_lines[item_counter].i_price;
                    input.order_lines[item_counter].i_name = output.order_lines[item_counter].i_name;
                    input.order_lines[item_counter].i_data = output.order_lines[item_counter].i_data;
                    input.order_lines[item_counter].s_quantity = output.order_lines[item_counter].s_quantity;
                    input.order_lines[item_counter].brand_generic = output.order_lines[item_counter].brand_generic;
                    input.order_lines[item_counter].ol_amount = output.order_lines[item_counter].ol_amount;
                }

                input.o_id = output.o_id;
                input.o_entry_d = new Date(Date.parse(output.o_entry_d));
                input.w_tax = output.w_tax;
                input.d_tax = output.d_tax;
                input.d_next_o_id = output.d_next_o_id;
                input.c_last = output.c_last;
                input.c_credit = output.c_credit;
                input.c_discount = output.c_discount;
                input.o_ol_cnt = output.o_ol_cnt;
                input.total_amount = output.total_amount;

                callback('Success', input);
            });
        });
    };

    Postgres.prototype.doPaymentTransaction = function (input, callback) {
        var self = this;

        /* Get a pooled connection */
        pg.connect(self.connString, function (err, client, done) {
            if (err) {
                self.logger.log('error', 'error fetching client from pool: ' + JSON.stringify(err));
                return;
            }

            var serialized_payment = '(' + input.w_id + ',' + input.d_id + ',' + input.c_w_id + ',' + input.c_d_id + ',' + input.c_id + ',' + input.c_last + ',' + input.h_amount + ',,,,,,,,,,,,,,,,,,,,,,,,,,,)';

            var query = self.dummy_mode ? 'SELECT $1::text AS "Payment"' : 'select to_json(process_payment($1::payment_param)) as output';
            var bind_values = self.dummy_mode ? ['Payment'] : [serialized_payment];

            client.query({ name: 'Payment', text: query, values: bind_values }, function (err, result) {
                // Release the client back to the pool
                done();

                if (err) {
                    callback('Error: ' + JSON.stringify(err), input);
                    return;
                }

                if (self.dummy_mode) {
                    callback('Success', input);
                    return;
                }

                var output = result.rows[0].output;

                input.c_id = output.c_id;
                input.c_last = output.c_last;
                input.w_name = output.w_name;
                input.w_street_1 = output.w_street_1;
                input.w_street_2 = output.w_street_2;
                input.w_city = output.w_city;
                input.w_state = output.w_state;
                input.w_zip = output.w_zip;
                input.d_name = output.d_name;
                input.d_street_1 = output.d_street_1;
                input.d_street_2 = output.d_street_2;
                input.d_city = output.d_city;
                input.d_state = output.d_state;
                input.d_zip = output.d_zip;
                input.c_first = output.c_first;
                input.c_middle = output.c_middle;
                input.c_street_1 = output.c_street_1;
                input.c_street_2 = output.c_street_2;
                input.c_city = output.c_city;
                input.c_state = output.c_state;
                input.c_zip = output.c_zip;
                input.c_phone = output.c_phone;
                input.c_since = new Date(Date.parse(output.c_since));
                input.c_credit = output.c_credit;
                input.c_credit_lim = output.c_credit_lim;
                input.c_discount = output.c_discount;
                input.c_balance = output.c_balance;
                input.c_data = output.c_data;
                input.h_date = new Date(Date.parse(output.h_date));

                callback('Success', input);
            });
        });
    };

    /*
    * Since delivery transaction can be executed in asyncronous mode, and because
    * it has very relaxed response-time requirements, we should gather multiple
    * transactions here and execute them all in one go.
    *
    * TODO: Implement the above idea, and see if it yeilds better results.
    */
    Postgres.prototype.doDeliveryTransaction = function (input, callback) {
        var self = this;

        /* Get a pooled connection */
        pg.connect(self.connString, function (err, client, done) {
            if (err) {
                self.logger.log('error', 'error fetching client from pool: ' + JSON.stringify(err));
                return;
            }

            var serialized_delivery = '(' + input.w_id + ',' + input.carrier_id + ',)';

            var query = self.dummy_mode ? 'SELECT $1::text AS "Delivery"' : 'select to_json(process_delivery($1::delivery_param)) as output';
            var bind_values = self.dummy_mode ? ['Delivery'] : [serialized_delivery];

            client.query({ name: 'Delivery', text: query, values: bind_values }, function (err, result) {
                // Release the client back to the pool
                done();

                if (err) {
                    /* TODO: In case of 'Serialization' error, retry the transaction. */
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
    };

    Postgres.prototype.doOrderStatusTransaction = function (input, callback) {
        var self = this;

        /* Get a pooled connection */
        pg.connect(self.connString, function (err, client, done) {
            if (err) {
                self.logger.log('error', 'error fetching client from pool: ' + JSON.stringify(err));
                return;
            }

            var serialized_order_status = '(' + input.w_id + ',' + input.d_id + ',' + input.c_id + ',' + input.c_last + ',,,,,,,)';

            var query = self.dummy_mode ? 'SELECT $1::text AS "Order Status"' : 'select to_json(process_order_status($1::order_status_param)) as output';
            var bind_values = self.dummy_mode ? ['Order Status'] : [serialized_order_status];

            client.query({ name: 'Order Status', text: query, values: bind_values }, function (err, result) {
                // Release the client back to the pool
                done();

                if (err) {
                    /* TODO: In case of 'Serialization' error, retry the transaction. */
                    callback('Error: ' + JSON.stringify(err), input);
                    return;
                }

                if (self.dummy_mode) {
                    callback('Success', input);
                    return;
                }

                var output = result.rows[0].output;

                input.c_id = output.c_id;
                input.c_last = output.c_last;
                input.c_middle = output.c_middle;
                input.c_first = output.c_first;
                input.c_balance = output.c_balance;
                input.o_id = output.o_id;
                input.o_entry_d = new Date(Date.parse(output.o_entry_d));
                input.o_carrier_id = output.o_carrier_id;

                var i;
                for (i = 0; i < 15; ++i) {
                    if (!output.order_lines || !output.order_lines[i] || output.order_lines[i].ol_i_id === -1) {
                        break;
                    }

                    var ol_dd = output.order_lines[i].ol_delivery_d;

                    input.order_lines[i].ol_i_id = output.order_lines[i].ol_i_id;
                    input.order_lines[i].ol_supply_w_id = output.order_lines[i].ol_supply_w_id;
                    input.order_lines[i].ol_quantity = output.order_lines[i].ol_quantity;
                    input.order_lines[i].ol_amount = output.order_lines[i].ol_amount;
                    input.order_lines[i].ol_delivery_d = ol_dd === null ? new Date(0) : new Date(Date.parse(ol_dd));
                }

                callback('Success', input);
            });
        });
    };
    return Postgres;
})();

var PostgresDummy = (function (_super) {
    __extends(PostgresDummy, _super);
    function PostgresDummy(logger) {
        _super.call(this, logger);
        _super.prototype.setDummyMode.call(this, true);
    }
    return PostgresDummy;
})(Postgres);
var printf = require('printf');

var g_num_warehouses = 0;
var g_terminals = [];
var g_sleepless = false;
var nullDBResponseTime = 0 * 1000;

/* Return an integer in the inclusive range [min, max] */
function getRand(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function NURand(A, x, y) {
    /*
    * TODO: Implement Clause 2.1.6.1. Get the C-Load value from the database and
    * calculate C-Run accourding to the above mentioned clause.
    *
    * For now, we use a constant pulled out of thin air.
    */
    return (((getRand(0, A) | getRand(x, y)) + 134) % (y - x + 1)) + x;
}

/*
* Function to generate C_LAST; see Clause 4.3.2.3
*
* If you feel a need to modify this, then also make sure the database-specific
* version of this function is also updated accordingly.
*/
function generate_c_last(num) {
    var arr = ['BAR', 'OUGHT', 'ABLE', 'PRI', 'PRES', 'ESE', 'ANTI', 'CALLY', 'ATION', 'EING'];
    var first = Math.floor(num / 100);
    var second = Math.floor((num % 100) / 10);
    var third = num % 10;

    return arr[first] + arr[second] + arr[third];
}

var xact_counts = {};
xact_counts['New Order'] = 0;
xact_counts['Payment'] = 0;
xact_counts['Order Status'] = 0;
xact_counts['Delivery'] = 0;
xact_counts['Stock Level'] = 0;

var TPCCStats = (function () {
    function TPCCStats() {
        var t = this;

        t.xact_counts_last = {};
        t.xact_counts_last['New Order'] = 0;
        t.xact_counts_last['Payment'] = 0;
        t.xact_counts_last['Order Status'] = 0;
        t.xact_counts_last['Delivery'] = 0;
        t.xact_counts_last['Stock Level'] = 0;
        t.test_start_time = new Date();
        t.stats_calc_time_last = t.test_start_time;
        t.total_xacts_last = 0;
    }
    TPCCStats.prototype.reset_globals = function () {
        xact_counts['New Order'] = 0;
        xact_counts['Payment'] = 0;
        xact_counts['Order Status'] = 0;
        xact_counts['Delivery'] = 0;
        xact_counts['Stock Level'] = 0;
        this.stats_calc_time_last = new Date();
    };

    TPCCStats.prototype.getStats = function () {
        var t = this;

        var out;
        var key;
        var now = new Date();
        var seconds_since_last_call = Math.abs(now - t.stats_calc_time_last) / 1000;

        var xact_per_sec = {};
        xact_per_sec['New Order'] = (xact_counts['New Order'] - t.xact_counts_last['New Order']) / seconds_since_last_call;
        xact_per_sec['Payment'] = (xact_counts['Payment'] - t.xact_counts_last['Payment']) / seconds_since_last_call;
        xact_per_sec['Order Status'] = (xact_counts['Order Status'] - t.xact_counts_last['Order Status']) / seconds_since_last_call;
        xact_per_sec['Delivery'] = (xact_counts['Delivery'] - t.xact_counts_last['Delivery']) / seconds_since_last_call;
        xact_per_sec['Stock Level'] = (xact_counts['Stock Level'] - t.xact_counts_last['Stock Level']) / seconds_since_last_call;

        var xact_per_min = {};
        xact_per_min['New Order'] = xact_per_sec['New Order'] * 60;
        xact_per_min['Payment'] = xact_per_sec['Payment'] * 60;
        xact_per_min['Order Status'] = xact_per_sec['Order Status'] * 60;
        xact_per_min['Delivery'] = xact_per_sec['Delivery'] * 60;
        xact_per_min['Stock Level'] = xact_per_sec['Stock Level'] * 60;

        var total_xacts = xact_counts['New Order'] + xact_counts['Payment'] + xact_counts['Order Status'] + xact_counts['Delivery'] + xact_counts['Stock Level'];

        var total_xact_per_minute = xact_per_min['New Order'] + xact_per_min['Payment'] + xact_per_min['Order Status'] + xact_per_min['Delivery'] + xact_per_min['Stock Level'];

        var xact_percent = {};
        xact_percent['New Order'] = parseFloat(((xact_counts['New Order'] / total_xacts) * 100).toFixed(2));
        xact_percent['Payment'] = parseFloat(((xact_counts['Payment'] / total_xacts) * 100).toFixed(2));
        xact_percent['Order Status'] = parseFloat(((xact_counts['Order Status'] / total_xacts) * 100).toFixed(2));
        xact_percent['Delivery'] = parseFloat(((xact_counts['Delivery'] / total_xacts) * 100).toFixed(2));
        xact_percent['Stock Level'] = parseFloat(((xact_counts['Stock Level'] / total_xacts) * 100).toFixed(2));

        out = adminScreen.replace('New Order   :                                                          ', printf('New Order   : %10d %6.2f %10d %10d %6.2f %10d', xact_counts['New Order'], xact_percent['New Order'], xact_per_sec['New Order'], xact_per_min['New Order'], (xact_per_min['New Order'] / total_xact_per_minute) * 100, 60 * xact_counts['New Order'] / (Math.abs(now - t.test_start_time) / 1000))).replace('Payment     :                                                          ', printf('Payment     : %10d %6.2f %10d %10d %6.2f %10d', xact_counts['Payment'], xact_percent['Payment'], xact_per_sec['Payment'], xact_per_min['Payment'], (xact_per_min['Payment'] / total_xact_per_minute) * 100, 60 * xact_counts['Payment'] / (Math.abs(now - t.test_start_time) / 1000))).replace('Order Status:                                                          ', printf('Order Status: %10d %6.2f %10d %10d %6.2f %10d', xact_counts['Order Status'], xact_percent['Order Status'], xact_per_sec['Order Status'], xact_per_min['Order Status'], (xact_per_min['Order Status'] / total_xact_per_minute) * 100, 60 * xact_counts['Order Status'] / (Math.abs(now - t.test_start_time) / 1000))).replace('Delivery    :                                                          ', printf('Delivery    : %10d %6.2f %10d %10d %6.2f %10d', xact_counts['Delivery'], xact_percent['Delivery'], xact_per_sec['Delivery'], xact_per_min['Delivery'], (xact_per_min['Delivery'] / total_xact_per_minute) * 100, 60 * xact_counts['Delivery'] / (Math.abs(now - t.test_start_time) / 1000))).replace('Stock Level :                                                          ', printf('Stock Level : %10d %6.2f %10d %10d %6.2f %10d', xact_counts['Stock Level'], xact_percent['Stock Level'], xact_per_sec['Stock Level'], xact_per_min['Stock Level'], (xact_per_min['Stock Level'] / total_xact_per_minute) * 100, 60 * xact_counts['Stock Level'] / (Math.abs(now - t.test_start_time) / 1000))).replace('Total       :                                                          ', printf('Total       : %10d %6.2f %10d %10d %6.2f %10d', total_xacts, 100, (total_xacts - t.total_xacts_last) / seconds_since_last_call, (total_xacts - t.total_xacts_last) / seconds_since_last_call * 60, 100, 60 * total_xacts / (Math.abs(now - t.test_start_time) / 1000))).replace('Database:                ', printf('Database: %-15s', g_terminals[0].db.getName())).replace('Duration:      ', printf('Duration: %.5d', Math.abs(now - t.test_start_time) / 1000)).replace('Warehouses:        ', printf('Warehouses: %-7d', g_num_warehouses));

        t.xact_counts_last['New Order'] = xact_counts['New Order'];
        t.xact_counts_last['Payment'] = xact_counts['Payment'];
        t.xact_counts_last['Order Status'] = xact_counts['Order Status'];
        t.xact_counts_last['Delivery'] = xact_counts['Delivery'];
        t.xact_counts_last['Stock Level'] = xact_counts['Stock Level'];

        t.total_xacts_last = total_xacts;
        t.stats_calc_time_last = now;

        return out;
    };
    return TPCCStats;
})();

var menuThinkTime = g_sleepless ? 0 : 1000;

var Terminal = (function () {
    /*
    * w_id: Warehouse ID, as stored in database. We use a string type because the
    * TPC-C specification allows this to be any data type.
    */
    function Terminal(w_id, db, display, logger) {
        this.w_id = w_id;
        this.db = db;
        this.display = display;
        this.logger = logger;

        this.menuProfile = new MenuProfile(this);
        this.newOrderProfile = new NewOrderProfile(this, this.logger);
        this.paymentProfile = new PaymentProfile(this, this.logger);
        this.orderStatusProfile = new OrderStatusProfile(this);
        this.deliveryProfile = new DeliveryProfile(this);
        this.stockLevelProfile = new StockLevelProfile(this);

        this.showMenu();
    }
    Terminal.prototype.showMenu = function () {
        var self = this;

        /* Show menu */
        self.currentProfile = self.menuProfile;
        self.refreshDisplay();

        /*
        * There's no wait time between display of the menu and choosing/displaying
        * input-screen of the next transaction profile. The display of the menu
        * until the selection of the transaction type is considered part of the
        * previous transaction output screen's think-time.
        *
        * But for our ability to see the menu, I display the menu for one second
        * before switching screen to the selected transaction profile. This one
        * second of wait time is then deducted from the think-time.
        *
        * XXX If necessary, turn this into a direct call of chooseTransaction(),
        * and add 1000 ms back to the think times. This may be necessary to
        * (a) reduce CPU consumption/increase generated load, or (b) to comply with
        * specification's word, upon insistence by the auditor.
        */
        if (g_sleepless || menuThinkTime === 0)
            self.chooseTransaction();
        else
            setTimeout(function () {
                self.chooseTransaction();
            }, menuThinkTime);
    };

    Terminal.prototype.chooseTransaction = function () {
        var self = this;

        var rand = Math.random() * 100;

        /* Choose one of the 5 transactions; per Clause 5.2.3 */
        if (rand < 4) {
            self.currentProfile = self.stockLevelProfile;
        } else if (rand < 8) {
            self.currentProfile = self.deliveryProfile;
        } else if (rand < 12) {
            self.currentProfile = self.orderStatusProfile;
        } else if (rand < 55) {
            self.currentProfile = self.paymentProfile;
        } else {
            self.currentProfile = self.newOrderProfile;
        }

        /* Prepare transaction input. */
        self.currentProfile.prepareInput();

        self.refreshDisplay();

        /* Execute the transaction after the keying time. */
        setTimeout(function () {
            self.currentProfile.execute();
        }, self.currentProfile.getKeyingTime());
    };

    Terminal.prototype.refreshDisplay = function () {
        if (this.display !== null) {
            this.display.setContent(this.currentProfile.getScreen());
            this.display.parent.render(); /* Ask the containing screen to re-render itself. */
        }
    };

    Terminal.prototype.setDisplay = function (display) {
        this.display = display;
    };
    return Terminal;
})();

/*
* This is not really a transaction profile, but implements that interface to
* allow for common code to dislay the menu.
*/
var MenuProfile = (function () {
    function MenuProfile(term) {
        var self = this;

        self.term = term;
    }
    MenuProfile.prototype.getScreen = function () {
        return menuScreen;
    };

    MenuProfile.prototype.getKeyingTime = function () {
        return 0;
    };

    MenuProfile.prototype.getThinkTime = function () {
        return 0;
    };

    /* Do-nothing functions */
    MenuProfile.prototype.prepareInput = function () {
    };
    MenuProfile.prototype.execute = function () {
    };
    return MenuProfile;
})();

var NewOrderProfile = (function () {
    function NewOrderProfile(term, logger) {
        this.meanThinkTime = 12;
        this.term = term;
        this.logger = logger;
        this.order = new NewOrder();

        this.status = '';
    }
    NewOrderProfile.prototype.getKeyingTime = function () {
        if (g_sleepless)
            return 0;
        else
            return 18000;
    };

    NewOrderProfile.prototype.getThinkTime = function () {
        if (g_sleepless)
            return 0;
        else
            return 1000 * Math.min(this.meanThinkTime * 10, -1 * Math.log(Math.random()) * this.meanThinkTime);
    };

    NewOrderProfile.prototype.prepareInput = function () {
        this.status = ''; /* Clear the status message from the previous run. */

        var order = this.order;

        order.w_id = this.term.w_id;
        order.d_id = getRand(1, 10);
        order.c_id = NURand(1023, 1, 3000);

        /* This number should NOT be communicated to the SUT */
        var ol_count = getRand(5, 15);
        var rbk = getRand(0, 100);
        var i;

        for (i = 0; i < 15; ++i) {
            if (i >= ol_count) {
                order.order_lines[i].ol_i_id = -1;
                continue;
            }

            /*
            * Clause 2.4.1.5.1: If this is the last item on order and 'rollback' is
            * true, then use an unused item number.
            */
            var item_id = ((i === ol_count - 1 && rbk === 1) ? 200000 : NURand(8191, 1, 100000));

            /*
            * Due to the random nature of the item-id generator, we may generate more
            * than one order-line for the same item. At least Postgres does not do
            * the right thing when the same row is updated multiiple times in the
            * same UPDATE command. See example in [1]. Postgres demonstarates problem
            * because I use a single UPDATE statement to process the complete order,
            * and the multiple updates of the same {s_i_id, s_w_id} row in STOCK
            * table see only one version of the row, the one as seen before the UPDATE
            * command started.
            *
            * I suspect any other database that has built-in protection against the
            * Halloween Problem would have the same trouble as well, unless the
            * order-processing is performed using a multi-command transaction.
            *
            * [1]: https://gist.github.com/gurjeet/d0daf64fed2c4a111aed
            *
            * So, if the same item is being requested again, discard it and repeat
            * the process to generate a new item id.
            *
            * TODO: Clause 2.4.1.5.1 does not mention anything about avoiding
            * duplicate items in an order. See if the TPC people/auditor agree with
            * the implementation here.
            */
            var dup_finder_counter;
            var dup_hunt_counter;

            dup_hunt_counter = 1;
            for (dup_finder_counter = 0; dup_finder_counter < i; ++dup_finder_counter) {
                if (order.order_lines[dup_finder_counter].ol_i_id === item_id) {
                    var anti_duplicate;
                    do {
                        anti_duplicate = NURand(8191, 1, 100000);
                    } while(anti_duplicate === item_id);

                    this.logger.log('info', 'Found a duplicate item_id: ' + item_id + ' and replaced it with: ' + anti_duplicate + '; hunt count: ' + dup_hunt_counter);
                    item_id = anti_duplicate;

                    /* Start hunt for diplicates again */
                    ++dup_hunt_counter;
                    dup_finder_counter = -1; /* The increment expression in for loop will increment it to 0 before using it */
                }
            }

            var use_w_id;

            /*
            * Clause 2.4.1.5.2. If there are more than 1 active warehouses, then
            * 1% of the time choose a remote warehouse for an item.
            */
            if (g_num_warehouses === 1) {
                use_w_id = this.term.w_id;
            } else {
                var use_remote_warehouse = (getRand(0, 100) === 1);

                if (use_remote_warehouse === true) {
                    do {
                        use_w_id = getRand(1, g_num_warehouses);
                        /* Reject the chosen warehouse if it's the same as the terminal's warehouse */
                    } while(use_w_id === this.term.w_id);
                } else {
                    use_w_id = this.term.w_id;
                }
            }

            order.order_lines[i].ol_i_id = item_id;
            order.order_lines[i].ol_supply_w_id = use_w_id;
            order.order_lines[i].ol_quantity = getRand(1, 10);

            /* Rest of these are output feild, expected to be filled in by the SUT */
            order.order_lines[i].i_price = 0;
            order.order_lines[i].i_name = '';
            order.order_lines[i].i_data = '';
            order.order_lines[i].s_quantity = 0;
            order.order_lines[i].brand_generic = '';
            order.order_lines[i].ol_amount = 0;
        }

        /* Output values; just clearing these here to avoid errors originating from undefined/null */
        order.o_id = 0;
        order.o_entry_d = null;
        order.w_tax = 0;
        order.d_tax = 0;
        order.d_next_o_id = 0;
        order.c_last = '';
        order.c_credit = '';
        order.c_discount = 0;
        order.o_ol_cnt = 0;
        order.total_amount = 0;
    };

    NewOrderProfile.prototype.execute = function () {
        var self = this;

        self.term.refreshDisplay();

        /*
        * Note to DB driver developer: The 'self.order' object passed here is an IN-OUT
        * object; that is, fill in all its relevant fields and hand it back to the
        * callback as the second parameter. For unused order_lines array elements
        * 'ol_i_id' is to -1.
        */
        self.term.db.doNewOrderTransaction(self.order, function (status, order) {
            /*
            * TODO: In case of an error, extract the Order ID from error message and
            * set that on the 'order' object, so that it gets displayed on the screen
            * upon screen refresh.
            */
            self.status = status;

            self.order = order;

            ++xact_counts['New Order'];

            self.term.refreshDisplay();

            setTimeout(function () {
                self.term.showMenu();
            }, self.getThinkTime() - menuThinkTime); /* See note above call of Terminal.chooseTransaction() */
        });
    };

    /*
    * Although I tried very hard, this screen layout may not agree with the
    * layout described in Clause 2.4.3.5. I primarily used the screenshot under
    * Clause 2.4.3.1 as the guide. N.B: Clause 2.2.1.2's item 5 allows reordering
    * or repositioning of the fields.
    */
    NewOrderProfile.prototype.getScreen = function () {
        var i;
        var order = this.order;

        var out = newOrderScreen.replace('Warehouse:       ', printf('Warehouse: %6d', order.w_id)).replace('Customer:     ', printf('Customer: %4d', order.c_id)).replace('Order Number:         ', printf('Order Number: %8d', order.o_id)).replace('District:   ', printf('District: %2d', order.d_id)).replace('Name:                 ', printf('Name: %-16s', order.c_last)).replace('Number of Lines:   ', printf('Number of Lines: %2d', order.o_ol_cnt)).replace('Credit:   ', printf('Credit: %2s', order.c_credit, 2)).replace('Discount:       ', printf('Discount: %.4f', order.c_discount)).replace('WTax:       ', printf('WTax: %.4f', order.w_tax)).replace('DTax:       ', printf('DTax: %.4f', order.d_tax)).replace('Order Date:           ', printf('Order Date: %-10s', order.o_entry_d === null ? '' : order.o_entry_d.getFullYear() + '/' + (order.o_entry_d.getMonth() + 1) + '/' + order.o_entry_d.getDate())).replace('Total:        ', printf('Total: %7.2f', order.total_amount)).replace('Item number is not valid', printf('%-24s', this.status));

        for (i = 0; i < 15; ++i) {
            out = out.replace(' ' + (i + 11).toString() + '                                                                             ', order.order_lines[i].ol_i_id === -1 ? '                                                                                ' : printf(' %6d %7d %-24s %3d %9d %2s %6.2f   %6.2f       ', order.order_lines[i].ol_supply_w_id, order.order_lines[i].ol_i_id, order.order_lines[i].i_name, order.order_lines[i].ol_quantity, order.order_lines[i].s_quantity, order.order_lines[i].brand_generic, order.order_lines[i].i_price, order.order_lines[i].ol_amount));
        }

        return out;
    };
    return NewOrderProfile;
})();

var PaymentProfile = (function () {
    function PaymentProfile(term, logger) {
        this.meanThinkTime = 12;
        this.term = term;
        this.logger = logger;
        this.payment = new Payment();

        /*
        * These fields are not cleard once populated, so need to initialize these
        * here. Else the code would barf on undefined members.
        */
        this.payment.w_name = '';
        this.payment.w_street_1 = '';
        this.payment.w_street_2 = '';
        this.payment.w_city = '';
        this.payment.w_state = '';
        this.payment.w_zip = '';
    }
    PaymentProfile.prototype.getKeyingTime = function () {
        if (g_sleepless)
            return 0;
        else
            return 3000;
    };

    PaymentProfile.prototype.getThinkTime = function () {
        if (g_sleepless)
            return 0;
        else
            return 1000 * Math.min(this.meanThinkTime * 10, -1 * Math.log(Math.random()) * this.meanThinkTime);
    };

    /* Clause 2.5.1 */
    PaymentProfile.prototype.prepareInput = function () {
        var payment = this.payment;

        payment.w_id = this.term.w_id;
        payment.d_id = getRand(1, 10);

        if (g_num_warehouses === 1) {
            payment.c_w_id = payment.w_id;
            payment.c_d_id = payment.d_id;
        } else {
            var x = getRand(1, 100);

            if (x <= 85) {
                payment.c_w_id = payment.w_id;
                payment.c_d_id = payment.d_id;
            } else {
                do {
                    payment.c_w_id = getRand(1, g_num_warehouses);
                } while(payment.c_w_id === payment.w_id);
            }

            payment.c_d_id = getRand(1, 10);
        }

        var y = getRand(1, 100);

        if (y <= 60) {
            payment.c_id = 0;
            payment.c_last = generate_c_last(NURand(255, 0, 999));
        } else {
            payment.c_id = NURand(1023, 1, 3000);
            payment.c_last = '';
        }

        payment.h_amount = 1 + (getRand(100, 500000) / 100);
        payment.d_name = '';
        payment.d_street_1 = '';
        payment.d_street_2 = '';
        payment.d_city = '';
        payment.d_state = '';
        payment.d_zip = '';
        payment.c_first = '';
        payment.c_middle = '';
        payment.c_street_1 = '';
        payment.c_street_2 = '';
        payment.c_city = '';
        payment.c_state = '';
        payment.c_zip = '';
        payment.c_phone = '';
        payment.c_since = null;
        payment.c_credit = '';
        payment.c_credit_lim = 0;
        payment.c_discount = 0;
        payment.c_balance = 0;
        payment.c_data = '';
        payment.h_date = null;
    };

    PaymentProfile.prototype.execute = function () {
        var self = this;

        self.term.refreshDisplay();

        self.term.db.doPaymentTransaction(self.payment, function (status, payment) {
            /* TODO: Make use of the 'status' string */
            self.payment = payment;

            ++xact_counts['Payment'];

            self.term.refreshDisplay();

            setTimeout(function () {
                self.term.showMenu();
            }, self.getThinkTime() - menuThinkTime); /* See note above call of Terminal.chooseTransaction() */
        });
    };

    PaymentProfile.prototype.getScreen = function () {
        var p = this.payment;

        var out = paymentScreen.replace('Date:           ', printf('Date: %-10s', (p.h_date === null ? '' : p.h_date.getFullYear() + '/' + (p.h_date.getMonth() + 1) + '/' + p.h_date.getDate()))).replace('Warehouse:       ', printf('Warehouse: %6d', p.w_id)).replace('W_STREET_1          ', printf('%-20s', p.w_street_1)).replace('W_STREET_2          ', printf('%-20s', p.w_street_2)).replace('W_CITY                           ', printf('%-20s %2s %9s', p.w_city, p.w_state, p.w_zip)).replace('District:   ', printf('District: %2d', (p.d_id === 0 ? 0 : p.d_id))).replace('D_STREET_1          ', printf('%-20s', p.d_street_1)).replace('D_STREET_2          ', printf('%-20s', p.d_street_2)).replace('D_CITY                           ', printf('%-20s %2s %9s', p.d_city, p.d_state, p.d_zip)).replace('Customer:     ', printf('Customer: %4d', p.c_id)).replace('Cust-Warehouse:       ', printf('Cust-Warehouse: %-6d', p.c_w_id)).replace('Cust-District:   ', printf('Cust-District: %2d', p.c_d_id)).replace('Cust-Discount:       ', printf('Cust-Discount: %.4f', p.c_discount)).replace('Name:                                     ', printf('Name: %-16s %-2s %-16s', p.c_first, p.c_middle, p.c_last)).replace('C_STREET_1          ', printf('%-20s', p.c_street_1)).replace('C_STREET_2          ', printf('%-20s', p.c_street_2)).replace('C_CITY                           ', printf('%-20s %2s %9s', p.c_city, p.c_state, p.c_zip)).replace('Cust-Phone:                 ', printf('Cust-Phone: %-16s', p.c_phone)).replace('Cust-Since:           ', printf('Cust-Since: %-10s', (p.c_since === null ? '' : p.c_since.getFullYear() + '/' + (p.c_since.getMonth() + 1) + '/' + p.c_since.getDate()))).replace('Cust-Credit:   ', printf('Cust-Credit: %2s', p.c_credit)).replace('Amount Paid:        ', printf('Amount Paid: %7.2f', p.h_amount)).replace('New Cust-Balance:             ', printf('New Cust-Balance: %-12.2s', p.c_balance)).replace('Credit Limit:             ', printf('Credit Limit: %12.2f', p.c_credit_lim)).replace('CUST-DATA1                                        ', printf('%-50s', p.c_credit === 'BC' ? p.c_data.substring(0, 50) : '')).replace('CUST-DATA2                                        ', printf('%-50s', p.c_credit === 'BC' ? p.c_data.substring(50, 100) : '')).replace('CUST-DATA3                                        ', printf('%-50s', p.c_credit === 'BC' ? p.c_data.substring(100, 150) : '')).replace('CUST-DATA4                                        ', printf('%-50s', p.c_credit === 'BC' ? p.c_data.substring(150, 200) : ''));
        return out;
    };
    return PaymentProfile;
})();

/*
* The specification requires that if any Delivery transaction processes less
* than 10 orders (one from each of 10 districts), then this should be logged.
* And if the total number of such transactions reaches 1%, then it should be
* reported (in Full Disclosure Report, I'm guessing).
*
* Per the specification: The result file must be organized in such a way that
* the percentage of skipped deliveries and skipped districts can be determined.
*
* TODO: Develop test code that scours the log file/keeps track of this
* percentage.
*/
var DeliveryDetails = (function () {
    function DeliveryDetails() {
    }
    return DeliveryDetails;
})();

var DeliveryProfile = (function () {
    function DeliveryProfile(term) {
        this.meanThinkTime = 5;
        this.term = term;

        this.delivery = new Delivery();
        this.details = new DeliveryDetails();

        /*
        * This warehouse-id parameter does not change for a terminal, so
        * initialize it here.
        */
        this.delivery.w_id = this.term.w_id;
    }
    DeliveryProfile.prototype.getKeyingTime = function () {
        if (g_sleepless)
            return 0;
        else
            return 2000;
    };

    DeliveryProfile.prototype.getThinkTime = function () {
        if (g_sleepless)
            return 0;
        else
            return 1000 * Math.min(this.meanThinkTime * 10, -1 * Math.log(Math.random()) * this.meanThinkTime);
    };

    DeliveryProfile.prototype.prepareInput = function () {
        this.stage = '';

        /* this.delivery.w_id is iniitalized in the constructor */
        this.delivery.carrier_id = getRand(1, 10);
    };

    DeliveryProfile.prototype.execute = function () {
        var self = this;

        self.term.refreshDisplay();

        self.term.db.doDeliveryTransaction(self.delivery, function (status, delivery) {
            self.details.ended_at = new Date();
            self.stage = 'Delivery complete';
            self.details.n_delivered_orders = delivery.delivered_orders !== null ? delivery.delivered_orders.length : 0;
            self.details.output = delivery;

            self.delivery = delivery;

            ++xact_counts['Delivery'];

            self.term.logger.log('info', self.details);
            /* This is a response from a queued/batched transaction, so no need to refresh the display. */
        });

        self.details.queued_at = new Date();
        self.stage = 'Delivery has been queued';

        /*
        * Specification requires that the terminal not wait for the response from
        * the Delivery transaction. So we move on to Menu screen after think-time.
        */
        setTimeout(function () {
            self.term.showMenu();
        }, self.getThinkTime() - menuThinkTime); /* See note above call of Terminal.chooseTransaction() */
    };

    DeliveryProfile.prototype.getScreen = function () {
        var d = this.delivery;

        var out = deliveryScreen.replace('Warehouse:       ', printf('Warehouse: %-6d', d.w_id)).replace('Carrier Number:   ', printf('Carrier Number: %-2d', d.carrier_id)).replace('Execution Status:                         ', printf('Execution Status: %24s', this.stage));

        return out;
    };
    return DeliveryProfile;
})();

var OrderStatusProfile = (function () {
    function OrderStatusProfile(term) {
        this.meanThinkTime = 10;
        this.term = term;

        this.order_status = new OrderStatus();

        /*
        * This warehouse-id parameter does not change for a terminal, so initialize
        * it here.
        */
        this.order_status.w_id = this.term.w_id;
    }
    OrderStatusProfile.prototype.getKeyingTime = function () {
        if (g_sleepless)
            return 0;
        else
            return 2000;
    };

    OrderStatusProfile.prototype.getThinkTime = function () {
        return 1000 * Math.min(this.meanThinkTime * 10, -1 * Math.log(Math.random()) * this.meanThinkTime);
    };

    OrderStatusProfile.prototype.prepareInput = function () {
        var order_status = this.order_status;

        order_status.d_id = getRand(1, 10);

        var y = getRand(1, 100);

        if (y <= 60) {
            order_status.c_id = 0;
            order_status.c_last = generate_c_last(NURand(255, 0, 999));
        } else {
            order_status.c_id = NURand(1023, 1, 3000);
            order_status.c_last = '';
        }

        order_status.c_middle = '';
        order_status.c_first = '';
        order_status.c_balance = 0;
        order_status.o_id = 0;
        order_status.o_entry_d = new Date(0);
        order_status.o_carrier_id = 0;

        var i;
        for (i = 0; i < 15; ++i) {
            order_status.order_lines[i].ol_i_id = -1;
            order_status.order_lines[i].ol_supply_w_id = 0;
            order_status.order_lines[i].ol_quantity = 0;
            order_status.order_lines[i].ol_amount = 0;
            order_status.order_lines[i].ol_delivery_d = new Date(0);
        }
    };

    OrderStatusProfile.prototype.execute = function () {
        var self = this;

        self.term.refreshDisplay();

        self.term.db.doOrderStatusTransaction(self.order_status, function (status, order_status) {
            /* TODO: Make use of the 'status' string */
            self.order_status = order_status;

            ++xact_counts['Order Status'];

            self.term.refreshDisplay();

            setTimeout(function () {
                self.term.showMenu();
            }, self.getThinkTime() - menuThinkTime); /* See note above call of Terminal.chooseTransaction() */
        });
    };

    OrderStatusProfile.prototype.getScreen = function () {
        var i;
        var os = this.order_status;

        var out = orderStatusScreen.replace('Warehouse:       ', printf('Warehouse: %6d', os.w_id)).replace('Customer:     ', printf('Customer: %4d', os.c_id)).replace('Order Number:         ', printf('Order Number: %-8d', os.o_id)).replace('District:   ', printf('District: %2d', os.d_id)).replace('Name:                                     ', printf('Name: %-16s %2s %-16s', os.c_first, os.c_middle, os.c_last)).replace('Balance:              ', printf('Balance: %-13.2f', os.c_balance)).replace('Carrier:   ', printf('Carrier: %2d', os.o_carrier_id === null ? 0 : os.o_carrier_id)).replace('Order Date:           ', printf('Order Date: %-10s', os.o_entry_d.getTime() === (new Date(0)).getTime() ? '' : os.o_entry_d.getFullYear() + '/' + (os.o_entry_d.getMonth() + 1) + '/' + os.o_entry_d.getDate()));

        for (i = 0; i < 15; ++i) {
            var ol_dd = os.order_lines[i].ol_delivery_d;

            out = out.replace(' ' + (i + 11).toString() + '                                                                             ', os.order_lines[i].ol_i_id === -1 ? '                                                                                ' : printf(' %6d %7d %3d %7.2f %12s                                        ', os.order_lines[i].ol_supply_w_id, os.order_lines[i].ol_i_id, os.order_lines[i].ol_quantity, os.order_lines[i].ol_amount, ol_dd.getTime() === (new Date(0)).getTime() ? '' : ol_dd.getFullYear() + '/' + (ol_dd.getMonth() + 1) + '/' + ol_dd.getDate()));
        }

        return out;
    };
    return OrderStatusProfile;
})();

/*
* According to Clause 3.4.1, this is the only transaction profile in the
* specification that is allowed to run in Read Committed transaction isolation
* mode; all others are required to run in at least Repeatable Read mode.
*/
var StockLevelProfile = (function () {
    function StockLevelProfile(term) {
        this.meanThinkTime = 5;
        this.term = term;
    }
    StockLevelProfile.prototype.getKeyingTime = function () {
        if (g_sleepless)
            return 0;
        else
            return 2000;
    };

    StockLevelProfile.prototype.getThinkTime = function () {
        if (g_sleepless)
            return 0;
        else
            return 1000 * Math.min(this.meanThinkTime * 10, -1 * Math.log(Math.random()) * this.meanThinkTime);
    };

    StockLevelProfile.prototype.prepareInput = function () {
        this.status = 'P';
    };

    StockLevelProfile.prototype.execute = function () {
        var self = this;

        self.status = 'E';

        /* Do-nothing transaction */
        /* Simulate a transaction that takes 1 second */
        setTimeout(function () {
            self.receiveTransactionResponse();
        }, nullDBResponseTime);
    };

    StockLevelProfile.prototype.receiveTransactionResponse = function () {
        var self = this;

        ++xact_counts['Stock Level'];

        self.status = 'R';

        self.term.refreshDisplay();

        setTimeout(function () {
            self.term.showMenu();
        }, self.getThinkTime() - menuThinkTime); /* See note above call of Terminal.chooseTransaction() */
    };

    StockLevelProfile.prototype.getScreen = function () {
        return deliveryScreen.replace('Status:  ', 'Status: ' + this.status);
    };
    return StockLevelProfile;
})();

/*******************
* Screen templates *
********************/
var menuScreen = "|--------------------------------------------------------------------------------|\n" + "|                                      TPC-C                                     |\n" + "|                                 TRANSACTION MENU                               |\n" + "|                                                                                |\n" + "| 1. New Order                                                                   |\n" + "| 2. Payment                                                                     |\n" + "| 3. Order Status                                                                |\n" + "| 4. Delivery                                                                    |\n" + "| 5. Stock Level                                                                 |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|________________________________________________________________________________|\n";

var newOrderScreen = "|--------------------------------------------------------------------------------|\n" + "|                                 New Order                                      |\n" + "|Warehouse:        District:    WTax:        DTax:                               |\n" + "|Customer:       Name:                   Credit:    Discount:                    |\n" + "|Order Number:          Number of Lines:    Order Date:            Total:        |\n" + "|                                                                                |\n" + "| Supp_W Item_Id Item_Name                Qty Stock_Qty BG  Price   Amount       |\n" + "| 11                                                                             |\n" + "| 12                                                                             |\n" + "| 13                                                                             |\n" + "| 14                                                                             |\n" + "| 15                                                                             |\n" + "| 16                                                                             |\n" + "| 17                                                                             |\n" + "| 18                                                                             |\n" + "| 19                                                                             |\n" + "| 20                                                                             |\n" + "| 21                                                                             |\n" + "| 22                                                                             |\n" + "| 23                                                                             |\n" + "| 24                                                                             |\n" + "| 25                                                                             |\n" + "| Item number is not valid                                                       |\n" + "|________________________________________________________________________________|\n";

var paymentScreen = "|--------------------------------------------------------------------------------|\n" + "|                                     Payment                                    |\n" + "|Date:                                                                           |\n" + "|                                                                                |\n" + "|Warehouse:                               District:                              |\n" + "|W_STREET_1                               D_STREET_1                             |\n" + "|W_STREET_2                               D_STREET_2                             |\n" + "|W_CITY                                   D_CITY                                 |\n" + "|                                                                                |\n" + "|Customer:      Cust-Warehouse:        Cust-District:    Cust-Discount:          |\n" + "|Name:                                                                           |\n" + "|      C_STREET_1                         Cust-Phone:                            |\n" + "|      C_STREET_2                         Cust-Since:                            |\n" + "|      C_CITY                             Cust-Credit:                           |\n" + "|                                                                                |\n" + "|Amount Paid:          New Cust-Balance:                                         |\n" + "|Credit Limit:                                                                   |\n" + "|                                                                                |\n" + "|Cust-Data: CUST-DATA1                                                           |\n" + "|           CUST-DATA2                                                           |\n" + "|           CUST-DATA3                                                           |\n" + "|           CUST-DATA4                                                           |\n" + "|                                                                                |\n" + "|________________________________________________________________________________|\n";

var orderStatusScreen = "|--------------------------------------------------------------------------------|\n" + "|                                   Order Status                                 |\n" + "|Warehouse:        District:                                                     |\n" + "|Customer:      Name:                                      Balance:              |\n" + "|Order Number:          Order Date:            Carrier:                          |\n" + "|                                                                                |\n" + "| Supp_W Item_Id Qty  Amount Delivered On                                        |\n" + "| 11                                                                             |\n" + "| 12                                                                             |\n" + "| 13                                                                             |\n" + "| 14                                                                             |\n" + "| 15                                                                             |\n" + "| 16                                                                             |\n" + "| 17                                                                             |\n" + "| 18                                                                             |\n" + "| 19                                                                             |\n" + "| 20                                                                             |\n" + "| 21                                                                             |\n" + "| 22                                                                             |\n" + "| 23                                                                             |\n" + "| 24                                                                             |\n" + "| 25                                                                             |\n" + "|                                                                                |\n" + "|________________________________________________________________________________|\n";

var deliveryScreen = "|--------------------------------------------------------------------------------|\n" + "|                                     Delivery                                   |\n" + "| Warehouse:                                                                     |\n" + "|                                                                                |\n" + "| Carrier Number:                                                                |\n" + "|                                                                                |\n" + "| Execution Status:                                                              |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|________________________________________________________________________________|\n";

var stockLevelScreen = "|--------------------------------------------------------------------------------|\n" + "|                                   Stock Level                                  |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "| Status:                                                                        |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|________________________________________________________________________________|\n";

var adminScreen = "|--------------------------------------------------------------------------------|\n" + "|                               TPC-C Admin                                      |\n" + "| Database:                 Duration:       Warehouses:                          |\n" + "|                    Total  %/Tot         /s       /min  %/min    avg/min        |\n" + "| New Order   :                                                                  |\n" + "| Payment     :                                                                  |\n" + "| Order Status:                                                                  |\n" + "| Delivery    :                                                                  |\n" + "| Stock Level :                                                                  |\n" + "| Total       :                                                                  |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|                                                                                |\n" + "|________________________________________________________________________________|\n";
/*
Copyright 2014 Gurjeet Singh, http://gurjeet.singh.im
This file is part of TPC.js.
TPC.js is free software: you can redistribute it and/or modify it under the
terms of the GNU General Public License, version 3, as published by the Free
Software Foundation.
TPC.js is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE.  See the GNU General Public License version 3 for more
details.
You should have received a copy of the GNU General Public License version 3
along with TPC.js.  If not, see <http://www.gnu.org/licenses/>.
*/
/* TypeScript headers */
/// <reference path="../typings/node/node.d.ts" />
var GPLv3Message = "TPC.js  Copyright (C) 2014  Gurjeet Singh, http://gurjeet.singh.im" + "\n" + "This program comes with ABSOLUTELY NO WARRANTY. This is free software, and you" + "\n" + "are welcome to redistribute it under terms of GNU General Public License version 3.";

var blessed = require('blessed');
var winston = require('winston');
var g_logger = new (winston.Logger)({ exitOnError: false });
g_logger.handleExceptions(new winston.transports.File({ filename: '/tmp/tpcc_exceptions.log' }));
g_logger.add(winston.transports.File, { filename: '/tmp/tpcc.' + process.pid + '.log' });

g_logger.log('info', 'Beginning TPC-C run.');

/* Create a screen */
/*
* XXX: For some inexplicable reason, if this variable is named 'screen', it
* causes `tsc` to emit an error, and no amount of diagnosis resolved the error.
*
* TODO: Create a definition file for blessed and contribute it to
* DefinitelyTyped repo.
*/
var mainScreen = blessed.screen();

/*
* Create a box in top-left corner of the screen, sized just enough to hold a
* TPC-C terminal's contents.
*/
var mainBox = blessed.box({
    parent: mainScreen,
    top: 'top',
    left: 'left',
    width: '100%',
    height: '100%',
    tags: true,
    border: {
        type: 'line'
    },
    style: {
        fg: 'white',
        bg: 'black',
        border: {
            fg: '#f0f0f0'
        }
    }
});

/* Create a box to display license and warranty message at the bottom of the main box. */
var adminBox = blessed.box({
    parent: mainBox,
    left: 'center',
    bottom: 0,
    width: '100%',
    height: '50%',
    content: '{center}' + GPLv3Message + "{/center}",
    tags: true,
    border: {
        type: 'line'
    },
    style: {
        fg: 'white',
        bg: 'black',
        border: {
            fg: '#f0f0f0',
            bg: 'black'
        }
    }
});

/* End the program on these keys */
mainScreen.key(['q', 'C-c'], function (ch, key) {
    return process.exit(0);
});

mainBox.focus();

mainScreen.render();

function increase_warehouse_count(count) {
    var i;
    var j;

    for (i = g_num_warehouses; i < (g_num_warehouses + count); ++i) {
        for (j = 0; j < 10; ++j) {
            /* Warehouse IDs are 1 based */
            g_terminals[i * 10 + j] = new Terminal(i + 1, new Postgres(g_logger), (i === 0 && j === 0) ? mainBox : null, g_logger);
        }
    }

    g_num_warehouses += count;
}

function decrease_warehouse_count(count) {
    /* TODO */
}

increase_warehouse_count(15);

/*
*  With PostgresDummy DB, at 15000 warehouses, using 4 CPUs we get no NewOrder
* transactions until about 3 minutes!! This seems to be because of the backlog
* of Payment transactions that builds up within the first 18-or-so seconds, and
* for the first 3 minutes the database sees a barrage of Payment transactions.
* By the time that barrage ends, the backlog of NewOrder transactions builds up
* and then the database sees only NewOrder transactions for a while.
*
* NullDB doesn't exhibit this behaviour, apparently because the backlog never
* builds up.
*/
/* IIFE to display transaction stats, and to prevent polluting global scope. */
(function () {
    var stats = new TPCCStats();

    setInterval(function () {
        adminBox.setContent(stats.getStats());

        mainScreen.render();
    }, 1 * 1000);
    /*
    * For about first 18 seconds of the benchmark run, there are no 'New Order'
    * transactions completed, because of the keying time and think time
    * requirements. This causes the calculated percentage of New Order
    * transactions to show lower than actual for first few minutes.
    *
    * TODO: Research a way to calculate this percentage so that it reflects the
    * reality; New Order transactions being approximately 45% of total.
    *
    * The method below seems to be a poor fix, because the percentages even after
    * a stats-reset is quite skewed. So it is commented for now.
    *
    * Reset globals after a few seconds so that 'New Order' transaction counts
    * are not skewed.
    */
    // setTimeout(function(){stats.reset_globals()}, 45 * 1000);
})();
