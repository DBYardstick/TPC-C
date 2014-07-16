
var printf = require('printf');

var g_num_warehouses: number = 0;
var g_terminals: Terminal[] = [];
var g_hammer: boolean = false;  /* Hammer mode currently doesn't work reliably and consistently */
var nullDBResponseTime: number = 0*1000; /* in milliseconds; Response time of the database that doesn't do anything */

/* Return an integer in the inclusive range [min, max] */
function getRand(min: number, max: number) {
  return min + Math.floor(Math.random() * (max-min+1));
}

function NURand(A: number, x: number, y: number) {

  /*
   * TODO: Implement Clause 2.1.6.1. Get the C-Load value from the database and
   * calculate C-Run accourding to the above mentioned clause.
   *
   * For now, we use a constant pulled out of thin air.
   */
  return (((getRand(0, A) | getRand(x, y)) + 134 /* => C */) % (y - x + 1)) + x;
}

/*
 * Function to generate C_LAST; see Clause 4.3.2.3
 *
 * If you feel a need to modify this, then also make sure the database-specific
 * version of this function is also updated accordingly.
 */
function generate_c_last(num: number): string {
  var arr: string[]	= ['BAR', 'OUGHT', 'ABLE', 'PRI', 'PRES', 'ESE', 'ANTI', 'CALLY', 'ATION', 'EING'];
  var first:  number = Math.floor(num / 100);
  var second: number = Math.floor((num % 100) / 10);
  var third:  number = num % 10;

  return arr[first] + arr[second] + arr[third];
}


var xact_counts: {[transaction: string] : number} = {};
xact_counts['New Order']    = 0;
xact_counts['Payment']      = 0;
xact_counts['Order Status'] = 0;
xact_counts['Delivery']     = 0;
xact_counts['Stock Level']  = 0;

class TPCCStats {

  xact_counts_last: {[transaction: string] : number};
  test_start_time: any;
  total_xacts_last: number;
  stats_calc_time_last: any;  /* TypeScript complains on (Date - Date), so use 'any' data type */

  constructor() {
    var t = this;

    t.xact_counts_last                 = {};
    t.xact_counts_last['New Order']    = 0;
    t.xact_counts_last['Payment']      = 0;
    t.xact_counts_last['Order Status'] = 0;
    t.xact_counts_last['Delivery']     = 0;
    t.xact_counts_last['Stock Level']  = 0;
    t.test_start_time                  = new Date();
    t.stats_calc_time_last             = t.test_start_time;
    t.total_xacts_last                 = 0;
  }

  reset_globals() {
    xact_counts['New Order']    = 0;
    xact_counts['Payment']      = 0;
    xact_counts['Order Status'] = 0;
    xact_counts['Delivery']     = 0;
    xact_counts['Stock Level']  = 0;
    this.stats_calc_time_last      = new Date();
  }

  getStats() {
    var t = this; /* Short name */

    var out: string;
    var key: string;
    var now: any = new Date();
    var seconds_since_last_call = Math.abs(now - t.stats_calc_time_last)/1000;

    var xact_per_sec: {[transaction: string] : number} = {};
    xact_per_sec['New Order']    = (xact_counts['New Order']    - t.xact_counts_last['New Order']   )/seconds_since_last_call;
    xact_per_sec['Payment']      = (xact_counts['Payment']      - t.xact_counts_last['Payment']     )/seconds_since_last_call;
    xact_per_sec['Order Status'] = (xact_counts['Order Status'] - t.xact_counts_last['Order Status'])/seconds_since_last_call;
    xact_per_sec['Delivery']     = (xact_counts['Delivery']     - t.xact_counts_last['Delivery']    )/seconds_since_last_call;
    xact_per_sec['Stock Level']  = (xact_counts['Stock Level']  - t.xact_counts_last['Stock Level'] )/seconds_since_last_call;

    var xact_per_min: {[transaction: string] : number} = {};
    xact_per_min['New Order']    = xact_per_sec['New Order']   * 60;
    xact_per_min['Payment']      = xact_per_sec['Payment']     * 60;
    xact_per_min['Order Status'] = xact_per_sec['Order Status']* 60;
    xact_per_min['Delivery']     = xact_per_sec['Delivery']    * 60;
    xact_per_min['Stock Level']  = xact_per_sec['Stock Level'] * 60;

    var total_xacts: number =  xact_counts['New Order'] + xact_counts['Payment']
                              + xact_counts['Order Status'] + xact_counts['Delivery']
                              + xact_counts['Stock Level'];

    var total_xact_per_minute = xact_per_min['New Order']
                                + xact_per_min['Payment']
                                + xact_per_min['Order Status']
                                + xact_per_min['Delivery']
                                + xact_per_min['Stock Level'];

    var xact_percent: {[transaction: string] : number} = {};
    xact_percent['New Order']    = parseFloat(((xact_counts['New Order']    /total_xacts) * 100).toFixed(2));
    xact_percent['Payment']      = parseFloat(((xact_counts['Payment']      /total_xacts) * 100).toFixed(2));
    xact_percent['Order Status'] = parseFloat(((xact_counts['Order Status'] /total_xacts) * 100).toFixed(2));
    xact_percent['Delivery']     = parseFloat(((xact_counts['Delivery']     /total_xacts) * 100).toFixed(2));
    xact_percent['Stock Level']  = parseFloat(((xact_counts['Stock Level']  /total_xacts) * 100).toFixed(2));

    out = adminScreen
          .replace('New Order   :                                                          ',
                    printf('New Order   : %10d %6.2f %10d %10d %6.2f %10d',
                    xact_counts['New Order'],
                    xact_percent['New Order'],
                    xact_per_sec['New Order'],
                    xact_per_min['New Order'],
                    (xact_per_min['New Order']/total_xact_per_minute)*100,
                    60 * xact_counts['New Order']/(Math.abs(now - t.test_start_time)/1000)))
          .replace('Payment     :                                                          ',
                    printf('Payment     : %10d %6.2f %10d %10d %6.2f %10d',
                    xact_counts['Payment'],
                    xact_percent['Payment'],
                    xact_per_sec['Payment'],
                    xact_per_min['Payment'],
                    (xact_per_min['Payment']/total_xact_per_minute)*100,
                    60 * xact_counts['Payment']/(Math.abs(now - t.test_start_time)/1000)))
          .replace('Order Status:                                                          ',
                    printf('Order Status: %10d %6.2f %10d %10d %6.2f %10d',
                    xact_counts['Order Status'],
                    xact_percent['Order Status'],
                    xact_per_sec['Order Status'],
                    xact_per_min['Order Status'],
                    (xact_per_min['Order Status']/total_xact_per_minute)*100,
                    60 * xact_counts['Order Status']/(Math.abs(now - t.test_start_time)/1000)))
          .replace('Delivery    :                                                          ',
                    printf('Delivery    : %10d %6.2f %10d %10d %6.2f %10d',
                    xact_counts['Delivery'],
                    xact_percent['Delivery'],
                    xact_per_sec['Delivery'],
                    xact_per_min['Delivery'],
                    (xact_per_min['Delivery']/total_xact_per_minute)*100,
                    60 * xact_counts['Delivery']/(Math.abs(now - t.test_start_time)/1000)))
          .replace('Stock Level :                                                          ',
                    printf('Stock Level : %10d %6.2f %10d %10d %6.2f %10d',
                    xact_counts['Stock Level'],
                    xact_percent['Stock Level'],
                    xact_per_sec['Stock Level'],
                    xact_per_min['Stock Level'],
                    (xact_per_min['Stock Level']/total_xact_per_minute)*100,
                    60 * xact_counts['Stock Level']/(Math.abs(now - t.test_start_time)/1000)))
          .replace('Total       :                                                          ',
                    printf('Total       : %10d %6.2f %10d %10d %6.2f %10d',
                    total_xacts,
                    100,
                    (total_xacts - t.total_xacts_last)/seconds_since_last_call,
                    (total_xacts - t.total_xacts_last)/seconds_since_last_call * 60,
                    100,
                    60 * total_xacts/(Math.abs(now - t.test_start_time)/1000)))
          .replace('Database:                ', printf('Database: %-15s', g_terminals[0].db.getName()))
          .replace('Duration:      ', printf('Duration: %.5d', Math.abs(now - t.test_start_time)/1000))
          .replace('Warehouses:        ', printf('Warehouses: %-7d', g_num_warehouses))
          ;

    t.xact_counts_last['New Order']    = xact_counts['New Order']    ;
    t.xact_counts_last['Payment']      = xact_counts['Payment']      ;
    t.xact_counts_last['Order Status'] = xact_counts['Order Status'] ;
    t.xact_counts_last['Delivery']     = xact_counts['Delivery']     ;
    t.xact_counts_last['Stock Level']  = xact_counts['Stock Level']  ;

    t.total_xacts_last = total_xacts;
    t.stats_calc_time_last = now;

    return out;
  }
}

var menuThinkTime: number = g_hammer ? 0 : 1000;

class Terminal  {

  public w_id: number;
  db: TPCCDatabase;
  display: any;
  logger: any;

  menuProfile: MenuProfile;
  newOrderProfile: NewOrderProfile;
  paymentProfile: PaymentProfile;
  orderStatusProfile: OrderStatusProfile;
  deliveryProfile: DeliveryProfile;
  stockLevelProfile: StockLevelProfile;

  currentProfile: TransactionProfile;

  /*
   * w_id: Warehouse ID, as stored in database. We use a string type because the
   * TPC-C specification allows this to be any data type.
   */
  constructor(w_id: number, db: TPCCDatabase, display: any, logger: any) {

    this.w_id = w_id;
    this.db = db;
    this.display = display;
    this.logger = logger;

    this.menuProfile        = new MenuProfile(this);
    this.newOrderProfile    = new NewOrderProfile(this, this.logger);
    this.paymentProfile     = new PaymentProfile(this, this.logger);
    this.orderStatusProfile = new OrderStatusProfile(this);
    this.deliveryProfile    = new DeliveryProfile(this);
    this.stockLevelProfile  = new StockLevelProfile(this);

    this.showMenu();
  }

  showMenu() {

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
     if (g_hammer || menuThinkTime === 0)
       self.chooseTransaction();
     else
       setTimeout(function(){self.chooseTransaction();}, menuThinkTime);
  }

  chooseTransaction() {

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
    setTimeout(function(){

        self.currentProfile.execute();
      }, self.currentProfile.getKeyingTime());
  }

  refreshDisplay() {
    if (this.display !== null) {
      this.display.setContent(this.currentProfile.getScreen());
      this.display.parent.render(); /* Ask the containing screen to re-render itself. */
    }
  }

  setDisplay(display: any) {
    this.display = display;
  }
}

interface TransactionProfile {

  getScreen() : string;
  getKeyingTime(): number; /* Clause 5.2.5.7 */
  getThinkTime(): number;  /* Clause 5.2.5.7 */

  /* Prepare fresh input */
  prepareInput(): void;

  /* Execute the transaction
   *
   * execute() function should register a function as the event-handler for
   * when the transaction response is received. That function then in turn
   * should call the terminal's showMenu() after think-time.
   */
  execute(): void;
}

/*
 * This is not really a transaction profile, but implements that interface to
 * allow for common code to dislay the menu.
 */
class MenuProfile implements TransactionProfile {

  term: Terminal;

  constructor(term: Terminal) {
    var self = this;

    self.term = term;
  }

  getScreen(): string {
    return menuScreen
  }

  getKeyingTime(){
    return 0;
  }

  getThinkTime() {
    return 0;
  }

  /* Do-nothing functions */
  prepareInput(){}
  execute(){}
}

class NewOrderProfile implements TransactionProfile {

  term: Terminal;  /* term.w_id is the terminal's warehouse */
  logger: any;
  order: NewOrder;
  status: string;

  constructor(term: Terminal, logger: any) {
    this.term = term;
    this.logger = logger;
    this.order = new NewOrder();

    this.status = '';
  }

  getKeyingTime() {
    if (g_hammer)
      return 0;
    else
      return 18000;  /* Clause 5.2.5.7 */
  }

  meanThinkTime: number = 12;  /* Clause 5.2.5.7 */
  getThinkTime() {
    if (g_hammer)
      return 0;
    else
        return 1000 * Math.min(this.meanThinkTime * 10, -1 * Math.log(Math.random()) * this.meanThinkTime);
  }

  prepareInput() {

    this.status = '';  /* Clear the status message from the previous run. */

    var order = this.order;

    order.w_id        = this.term.w_id;
    order.d_id        = getRand(1, 10);
    order.c_id        = NURand(1023, 1, 3000);

    /* This number should NOT be communicated to the SUT */
    var ol_count:number = getRand(5, 15);
    var rbk: number = getRand(0, 100);
    var i: number;

    for (i = 0; i < 15; ++i) {

      if (i >= ol_count) {
        order.order_lines[i].ol_i_id = -1;
        continue;
      }

      /*
       * Clause 2.4.1.5.1: If this is the last item on order and 'rollback' is
       * true, then use an unused item number.
       */
      var item_id = ((i === ol_count -1 && rbk === 1) ? 200000 : NURand(8191, 1, 100000));
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
      var dup_finder_counter: number;
      var dup_hunt_counter: number;

      dup_hunt_counter = 1;
      for (dup_finder_counter = 0; dup_finder_counter < i; ++dup_finder_counter) {

        if (order.order_lines[dup_finder_counter].ol_i_id === item_id) {

          var anti_duplicate: number;
          do {
            anti_duplicate = NURand(8191, 1, 100000);
          } while (anti_duplicate === item_id);

          this.logger.log('info', 'Found a duplicate item_id: ' + item_id + ' and replaced it with: ' + anti_duplicate + '; hunt count: ' + dup_hunt_counter);
          item_id = anti_duplicate;

          /* Start hunt for diplicates again */
          ++dup_hunt_counter;
          dup_finder_counter = -1; /* The increment expression in for loop will increment it to 0 before using it */
        }
      }

      var use_w_id: number;

      /*
       * Clause 2.4.1.5.2. If there are more than 1 active warehouses, then
       * 1% of the time choose a remote warehouse for an item.
       */
      if (g_num_warehouses === 1) {

        use_w_id = this.term.w_id;

      } else {
        var use_remote_warehouse: boolean = (getRand(0, 100) === 1);

        if (use_remote_warehouse === true) {
          do {

            use_w_id = getRand(1, g_num_warehouses);

          /* Reject the chosen warehouse if it's the same as the terminal's warehouse */
          } while(use_w_id === this.term.w_id);

        } else {

          use_w_id = this.term.w_id;

        }
      }

      order.order_lines[i].ol_i_id        = item_id;
      order.order_lines[i].ol_supply_w_id = use_w_id;
      order.order_lines[i].ol_quantity    = getRand(1, 10);

      /* Rest of these are output feild, expected to be filled in by the SUT */
      order.order_lines[i].i_price        = 0;
      order.order_lines[i].i_name         = '';
      order.order_lines[i].i_data         = '';
      order.order_lines[i].s_quantity     = 0;
      order.order_lines[i].brand_generic  = '';
      order.order_lines[i].ol_amount      = 0;
    }

    /* Output values; just clearing these here to avoid errors originating from undefined/null */
    order.o_id        = 0;
    order.o_entry_d   = null;
    order.w_tax       = 0;
    order.d_tax       = 0;
    order.d_next_o_id = 0;
    order.c_last      = '';
    order.c_credit    = '';
    order.c_discount  = 0;
    order.o_ol_cnt    = 0;
    order.total_amount= 0;
  }

  execute(){

    var self = this;

    self.term.refreshDisplay();

    /*
     * Note to DB driver developer: The 'self.order' object passed here is an IN-OUT
     * object; that is, fill in all its relevant fields and hand it back to the
     * callback as the second parameter. For unused order_lines array elements
     * 'ol_i_id' is to -1.
     */
    self.term.db.doNewOrderTransaction(self.order, function(status: string, order: NewOrder) {

      /*
       * TODO: In case of an error, extract the Order ID from error message and
       * set that on the 'order' object, so that it gets displayed on the screen
       * upon screen refresh.
       */
      self.status = status;

      self.order = order;

      ++xact_counts['New Order'];

      self.term.refreshDisplay();

      setTimeout(function(){
          self.term.showMenu();
        }, self.getThinkTime() - menuThinkTime);  /* See note above call of Terminal.chooseTransaction() */
      }
    );
  }

  /*
   * Although I tried very hard, this screen layout may not agree with the
   * layout described in Clause 2.4.3.5. I primarily used the screenshot under
   * Clause 2.4.3.1 as the guide. N.B: Clause 2.2.1.2's item 5 allows reordering
   * or repositioning of the fields.
   */
  getScreen(): string {

    var i: number;
    var order: NewOrder = this.order;

    var out:string = newOrderScreen
                      .replace('Warehouse:       '        , printf('Warehouse: %6d'      , order.w_id))
                      .replace('Customer:     '           , printf('Customer: %4d'       , order.c_id))
                      .replace('Order Number:         '   , printf('Order Number: %8d'   , order.o_id))
                      .replace('District:   '             , printf('District: %2d'       , order.d_id))
                      .replace('Name:                 '   , printf('Name: %-16s'         , order.c_last))
                      .replace('Number of Lines:   '      , printf('Number of Lines: %2d', order.o_ol_cnt))
                      .replace('Credit:   '               , printf('Credit: %2s'         , order.c_credit, 2))
                      .replace('Discount:       '         , printf('Discount: %.4f'      , order.c_discount))
                      .replace('WTax:       '             , printf('WTax: %.4f'          , order.w_tax))
                      .replace('DTax:       '             , printf('DTax: %.4f'          , order.d_tax))
                      .replace('Order Date:           '   , printf('Order Date: %-10s'   , order.o_entry_d === null ? '' : order.o_entry_d.getFullYear() + '/' + (order.o_entry_d.getMonth()+1) + '/' + order.o_entry_d.getDate()))
                      .replace('Total:        '           , printf('Total: %7.2f'        , order.total_amount))
                      .replace('Item number is not valid' , printf('%-24s'               , this.status))
                      ;

    for (i = 0; i < 15; ++i) {
      out = out.replace(' ' + (i+11).toString() + '                                                                             ',
                         order.order_lines[i].ol_i_id === -1
                         ? '                                                                                '
                         : printf(' %6d %7d %-24s %3d %9d %2s %6.2f   %6.2f       ',
                                order.order_lines[i].ol_supply_w_id,
                                order.order_lines[i].ol_i_id,
                                order.order_lines[i].i_name,
                                order.order_lines[i].ol_quantity,
                                order.order_lines[i].s_quantity,
                                order.order_lines[i].brand_generic,
                                order.order_lines[i].i_price,
                                order.order_lines[i].ol_amount));
    }

    return out;
  }
}

class PaymentProfile implements TransactionProfile {

  term: Terminal;  /* term.w_id is the terminal's warehouse */
  logger: any;
  payment: Payment;

  constructor(term: Terminal, logger: any) {
    this.term = term;
    this.logger = logger;
    this.payment = new Payment();

    /*
     * These fields are not cleard once populated, so need to initialize these
     * here. Else the code would barf on undefined members.
     */
    this.payment.w_name      = '';
    this.payment.w_street_1  = '';
    this.payment.w_street_2  = '';
    this.payment.w_city      = '';
    this.payment.w_state     = '';
    this.payment.w_zip       = '';
  }

  getKeyingTime() {
    if (g_hammer)
      return 0;
    else
      return 3000;  /* Clause 5.2.5.7 */
  }

  meanThinkTime: number = 12;  /* Clause 5.2.5.7 */
  getThinkTime() {
    if (g_hammer)
      return 0;
    else
      return 1000 * Math.min(this.meanThinkTime * 10, -1 * Math.log(Math.random()) * this.meanThinkTime);
  }

  /* Clause 2.5.1 */
  prepareInput() {

    var payment = this.payment;

    payment.w_id        = this.term.w_id;
    payment.d_id        = getRand(1, 10);

    if (g_num_warehouses === 1) {
      payment.c_w_id = payment.w_id;
      payment.c_d_id = payment.d_id;
    } else {
      var x = getRand(1, 100);

      if (x <= 85) {
        payment.c_w_id    = payment.w_id;
        payment.c_d_id    = payment.d_id;
      } else {

          do {
            payment.c_w_id = getRand(1, g_num_warehouses);
          } while (payment.c_w_id === payment.w_id);
      }

      payment.c_d_id    = getRand(1, 10);
    }

    var y = getRand(1, 100);

    if (y <= 60) {
      payment.c_id      = 0;
      payment.c_last    = generate_c_last(NURand(255,0,999));
    } else {
      payment.c_id      = NURand(1023,1,3000);
      payment.c_last    = '';
    }

    payment.h_amount    = 1 + (getRand(100, 500000)/100);
    payment.d_name      = '';
    payment.d_street_1  = '';
    payment.d_street_2  = '';
    payment.d_city      = '';
    payment.d_state     = '';
    payment.d_zip       = '';
    payment.c_first     = '';
    payment.c_middle    = '';
    payment.c_street_1  = '';
    payment.c_street_2  = '';
    payment.c_city      = '';
    payment.c_state     = '';
    payment.c_zip       = '';
    payment.c_phone     = '';
    payment.c_since     = null;
    payment.c_credit    = '';
    payment.c_credit_lim= 0;
    payment.c_discount  = 0;
    payment.c_balance   = 0;
    payment.c_data      = '';
    payment.h_date      = null;
  }

  execute(){

    var self = this;

    self.term.refreshDisplay();

    self.term.db.doPaymentTransaction(self.payment, function(status: string, payment: Payment) {

      /* TODO: Make use of the 'status' string */
      self.payment = payment;

      ++xact_counts['Payment'];

      self.term.refreshDisplay();

      setTimeout(function(){
          self.term.showMenu();
        }, self.getThinkTime() - menuThinkTime);  /* See note above call of Terminal.chooseTransaction() */
      }
    );
  }

  getScreen(): string {
      var p: Payment = this.payment;

      var out:string =
        paymentScreen
        .replace('Date:           '                           , printf('Date: %-10s'            , (p.h_date === null ? '' : p.h_date.getFullYear() + '/' + (p.h_date.getMonth()+1) + '/' + p.h_date.getDate())))
        .replace('Warehouse:       '                          , printf('Warehouse: %6d'         , p.w_id))
        .replace('W_STREET_1          '                       , printf('%-20s'                  , p.w_street_1))
        .replace('W_STREET_2          '                       , printf('%-20s'                  , p.w_street_2))
        .replace('W_CITY                           '          , printf('%-20s %2s %9s'          , p.w_city, p.w_state, p.w_zip))
        .replace('District:   '                               , printf('District: %2d'          , (p.d_id === 0 ?  0 : p.d_id)))
        .replace('D_STREET_1          '                       , printf('%-20s'                  , p.d_street_1))
        .replace('D_STREET_2          '                       , printf('%-20s'                  , p.d_street_2))
        .replace('D_CITY                           '          , printf('%-20s %2s %9s'          , p.d_city, p.d_state, p.d_zip))
        .replace('Customer:     '                             , printf('Customer: %4d'          , p.c_id))
        .replace('Cust-Warehouse:       '                     , printf('Cust-Warehouse: %-6d'   , p.c_w_id))
        .replace('Cust-District:   '                          , printf('Cust-District: %2d'     , p.c_d_id))
        .replace('Cust-Discount:       '                      , printf('Cust-Discount: %.4f'    , p.c_discount))
        .replace('Name:                                     ' , printf('Name: %-16s %-2s %-16s' , p.c_first, p.c_middle, p.c_last))
        .replace('C_STREET_1          '                       , printf('%-20s'                  , p.c_street_1))
        .replace('C_STREET_2          '                       , printf('%-20s'                  , p.c_street_2))
        .replace('C_CITY                           '          , printf('%-20s %2s %9s'          , p.c_city, p.c_state, p.c_zip))
        .replace('Cust-Phone:                 '               , printf('Cust-Phone: %-16s'      , p.c_phone))
        .replace('Cust-Since:           '                     , printf('Cust-Since: %-10s'      , (p.c_since === null ? '' : p.c_since.getFullYear() + '/' + (p.c_since.getMonth()+1) + '/' + p.c_since.getDate())))
        .replace('Cust-Credit:   '                            , printf('Cust-Credit: %2s'       , p.c_credit))
        .replace('Amount Paid:        '                        , printf('Amount Paid: %7.2f'   , p.h_amount))
        .replace('New Cust-Balance:             '             , printf('New Cust-Balance: %-12.2s'  , p.c_balance))
        .replace('Credit Limit:             '                 , printf('Credit Limit: %12.2f'    , p.c_credit_lim))
        .replace('CUST-DATA1                                        ', printf('%-50s'            , p.c_credit === 'BC' ? p.c_data.substring(0,50)    : ''))
        .replace('CUST-DATA2                                        ', printf('%-50s'            , p.c_credit === 'BC' ? p.c_data.substring(50,100)  : ''))
        .replace('CUST-DATA3                                        ', printf('%-50s'            , p.c_credit === 'BC' ? p.c_data.substring(100,150) : ''))
        .replace('CUST-DATA4                                        ', printf('%-50s'            , p.c_credit === 'BC' ? p.c_data.substring(150,200) : ''))
        ;
      return out;
  }
}

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
class DeliveryDetails {
  queued_at: Date;
  ended_at: Date;
  status: string;
  n_delivered_orders: number;
  output: Delivery;
}

class DeliveryProfile implements TransactionProfile {

  term: Terminal;  /* term.w_id is the terminal's warehouse */

  delivery: Delivery;
  details: DeliveryDetails;
  stage: string;

  constructor(term: Terminal) {
    this.term = term;

    this.delivery = new Delivery();
    this.details = new DeliveryDetails();

    /*
     * This warehouse-id parameter does not change for a terminal, so
     * initialize it here.
     */
    this.delivery.w_id = this.term.w_id;
  }

  getKeyingTime() {
    if (g_hammer)
      return 0;
    else
      return 2000;  /* Clause 5.2.5.7 */
  }

  meanThinkTime: number = 5;  /* Clause 5.2.5.7 */
  getThinkTime() {
    if (g_hammer)
      return 0;
    else
      return 1000 * Math.min(this.meanThinkTime * 10, -1 * Math.log(Math.random()) * this.meanThinkTime);
  }

  prepareInput() {

    this.stage = '';

    /* this.delivery.w_id is iniitalized in the constructor */
    this.delivery.carrier_id = getRand(1, 10);

  }

  execute(){

    var self = this;

    self.term.refreshDisplay();

    self.term.db.doDeliveryTransaction(self.delivery, function(status: string, delivery: Delivery) {

      self.details.ended_at = new Date();
      self.stage = 'Delivery complete';
      self.details.n_delivered_orders = (delivery.delivered_orders === null ? 0 : delivery.delivered_orders.length);
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
    setTimeout(function(){
        self.term.showMenu();
      }, self.getThinkTime() - menuThinkTime);  /* See note above call of Terminal.chooseTransaction() */
  }

  getScreen(): string {

      var d: Delivery = this.delivery;

      var out:string =
        deliveryScreen
        .replace('Warehouse:       '                          , printf('Warehouse: %-6d'        , d.w_id))
        .replace('Carrier Number:   '                         , printf('Carrier Number: %-2d'   , d.carrier_id))
        .replace('Execution Status:                         ' , printf('Execution Status: %24s' , this.stage))
        ;

      return out;
  }
}

class OrderStatusProfile implements TransactionProfile {

  term: Terminal;  /* term.w_id is the terminal's warehouse */
  order_status: OrderStatus;

  constructor(term: Terminal) {
    this.term = term;

    this.order_status = new OrderStatus();

    /*
     * This warehouse-id parameter does not change for a terminal, so initialize
     * it here.
     */
    this.order_status.w_id = this.term.w_id;
  }

  getKeyingTime() {
    if (g_hammer)
      return 0;
    else
      return 2000;  /* Clause 5.2.5.7 */
  }

  meanThinkTime: number = 10;  /* Clause 5.2.5.7 */
  getThinkTime() {
    return 1000 * Math.min(this.meanThinkTime * 10, -1 * Math.log(Math.random()) * this.meanThinkTime);
  }

  prepareInput() {

    var order_status = this.order_status;

    order_status.d_id = getRand(1, 10);

    var y = getRand(1, 100);

    if (y <= 60) {
      order_status.c_id      = 0;
      order_status.c_last    = generate_c_last(NURand(255,0,999));
    } else {
      order_status.c_id      = NURand(1023,1,3000);
      order_status.c_last    = '';
    }

    order_status.c_middle       = '';
    order_status.c_first        = '';
    order_status.c_balance      = 0;
    order_status.o_id           = 0;
    order_status.o_entry_d      = new Date(0);
    order_status.o_carrier_id   = 0;

    var i: number;
    for (i = 0; i < 15; ++i) {
      order_status.order_lines[i].ol_i_id			    = -1;
      order_status.order_lines[i].ol_supply_w_id  = 0;
      order_status.order_lines[i].ol_quantity		  = 0;
      order_status.order_lines[i].ol_amount		    = 0;
      order_status.order_lines[i].ol_delivery_d	  = new Date(0);
    }
  }

  execute(){

    var self = this;

    self.term.refreshDisplay();

    self.term.db.doOrderStatusTransaction(self.order_status, function(status: string, order_status: OrderStatus) {

      /* TODO: Make use of the 'status' string */
      self.order_status = order_status;

      ++xact_counts['Order Status'];

      self.term.refreshDisplay();

      setTimeout(function(){
          self.term.showMenu();
        }, self.getThinkTime() - menuThinkTime);  /* See note above call of Terminal.chooseTransaction() */
      }
    );
  }

  getScreen(): string {
    var i: number;
    var os: OrderStatus = this.order_status;

    var out:string = orderStatusScreen
                      .replace('Warehouse:       '        , printf('Warehouse: %6d'      , os.w_id))
                      .replace('Customer:     '           , printf('Customer: %4d'       , os.c_id))
                      .replace('Order Number:         '   , printf('Order Number: %-8d'   , os.o_id))
                      .replace('District:   '             , printf('District: %2d'       , os.d_id))
                      .replace('Name:                                     '   , printf('Name: %-16s %2s %-16s'         , os.c_first, os.c_middle, os.c_last))
                      .replace('Balance:              '   , printf('Balance: %-13.2f'        , os.c_balance))
                      .replace('Carrier:   '              , printf('Carrier: %2d'        , os.o_carrier_id === null ? 0 : os.o_carrier_id))
                      .replace('Order Date:           '   , printf('Order Date: %-10s'   , os.o_entry_d.getTime() === (new Date(0)).getTime() ? '' : os.o_entry_d.getFullYear() + '/' + (os.o_entry_d.getMonth()+1) + '/' + os.o_entry_d.getDate()))
                      ;

    for (i = 0; i < 15; ++i) {
      var ol_dd = os.order_lines[i].ol_delivery_d;

      out = out.replace(' ' + (i+11).toString() + '                                                                             ',
                         os.order_lines[i].ol_i_id === -1
                         ? '                                                                                '
                         : printf(' %6d %7d %3d %7.2f %12s                                        ',
                                os.order_lines[i].ol_supply_w_id,
                                os.order_lines[i].ol_i_id,
                                os.order_lines[i].ol_quantity,
                                os.order_lines[i].ol_amount,
                                ol_dd.getTime() === (new Date(0)).getTime() ? '' : ol_dd.getFullYear() + '/' + (ol_dd.getMonth()+1) + '/' + ol_dd.getDate()));
    }

    return out;
  }
}

/*
 * According to Clause 3.4.1, this is the only transaction profile in the
 * specification that is allowed to run in Read Committed transaction isolation
 * mode; all others are required to run in at least Repeatable Read mode.
 */
class StockLevelProfile implements TransactionProfile {

  term: Terminal;  /* term.w_id is the terminal's warehouse */
  status: string;  /* TODO: remove this and add actual variables */

  constructor(term: Terminal) {
    this.term = term;
  }

  getKeyingTime() {
    if (g_hammer)
      return 0;
    else
      return 2000;  /* Clause 5.2.5.7 */
  }

  meanThinkTime: number = 5;  /* Clause 5.2.5.7 */
  getThinkTime() {
    if (g_hammer)
      return 0;
    else
      return 1000 * Math.min(this.meanThinkTime * 10, -1 * Math.log(Math.random()) * this.meanThinkTime);
  }

  prepareInput() {

    this.status = 'P';
  }

  execute(){

    var self = this;

    self.status = 'E';

    /* Do-nothing transaction */

    /* Simulate a transaction that takes 1 second */
    setTimeout(function(){
      self.receiveTransactionResponse();
      }, nullDBResponseTime);
  }

  receiveTransactionResponse(){

    var self = this;

    ++xact_counts['Stock Level'];

    self.status = 'R';

    self.term.refreshDisplay();

    setTimeout(function(){
        self.term.showMenu();
      }, self.getThinkTime() - menuThinkTime);  /* See note above call of Terminal.chooseTransaction() */
  }

  getScreen(): string {
      return deliveryScreen.replace('Status:  ', 'Status: ' + this.status);
  }
}

/*******************
* Screen templates *
********************/

var menuScreen: string =
//       01234567890123456789012345678901234567890123456789012345678901234567890123456789
/*01*/ "|--------------------------------------------------------------------------------|\n"
/*02*/+"|                                      TPC-C                                     |\n"
/*03*/+"|                                 TRANSACTION MENU                               |\n"
/*04*/+"|                                                                                |\n"
/*05*/+"| 1. New Order                                                                   |\n"
/*06*/+"| 2. Payment                                                                     |\n"
/*07*/+"| 3. Order Status                                                                |\n"
/*08*/+"| 4. Delivery                                                                    |\n"
/*10*/+"| 5. Stock Level                                                                 |\n"
/*11*/+"|                                                                                |\n"
/*12*/+"|                                                                                |\n"
/*13*/+"|                                                                                |\n"
/*14*/+"|                                                                                |\n"
/*09*/+"|                                                                                |\n"
/*15*/+"|                                                                                |\n"
/*16*/+"|                                                                                |\n"
/*17*/+"|                                                                                |\n"
/*18*/+"|                                                                                |\n"
/*19*/+"|                                                                                |\n"
/*20*/+"|                                                                                |\n"
/*21*/+"|                                                                                |\n"
/*22*/+"|                                                                                |\n"
/*23*/+"|                                                                                |\n"
/*24*/+"|________________________________________________________________________________|\n"
;

var newOrderScreen: string =
//       01234567890123456789012345678901234567890123456789012345678901234567890123456789
/*01*/ "|--------------------------------------------------------------------------------|\n"
/*02*/+"|                                 New Order                                      |\n"
/*03*/+"|Warehouse:        District:    WTax:        DTax:                               |\n"
/*04*/+"|Customer:       Name:                   Credit:    Discount:                    |\n"
/*05*/+"|Order Number:          Number of Lines:    Order Date:            Total:        |\n"
/*06*/+"|                                                                                |\n"
/*07*/+"| Supp_W Item_Id Item_Name                Qty Stock_Qty BG  Price   Amount       |\n"
/*08*/+"| 11                                                                             |\n"
/*09*/+"| 12                                                                             |\n"
/*10*/+"| 13                                                                             |\n"
/*11*/+"| 14                                                                             |\n"
/*12*/+"| 15                                                                             |\n"
/*13*/+"| 16                                                                             |\n"
/*14*/+"| 17                                                                             |\n"
/*15*/+"| 18                                                                             |\n"
/*16*/+"| 19                                                                             |\n"
/*17*/+"| 20                                                                             |\n"
/*18*/+"| 21                                                                             |\n"
/*19*/+"| 22                                                                             |\n"
/*20*/+"| 23                                                                             |\n"
/*21*/+"| 24                                                                             |\n"
/*22*/+"| 25                                                                             |\n"
/*23*/+"| Item number is not valid                                                       |\n"
/*24*/+"|________________________________________________________________________________|\n"
;

var paymentScreen: string =
//       01234567890123456789012345678901234567890123456789012345678901234567890123456789
/*01*/ "|--------------------------------------------------------------------------------|\n"
/*02*/+"|                                     Payment                                    |\n"
/*03*/+"|Date:                                                                           |\n"
/*04*/+"|                                                                                |\n"
/*05*/+"|Warehouse:                               District:                              |\n"
/*06*/+"|W_STREET_1                               D_STREET_1                             |\n"
/*07*/+"|W_STREET_2                               D_STREET_2                             |\n"
/*08*/+"|W_CITY                                   D_CITY                                 |\n"
/*10*/+"|                                                                                |\n"
/*11*/+"|Customer:      Cust-Warehouse:        Cust-District:    Cust-Discount:          |\n"
/*12*/+"|Name:                                                                           |\n"
/*13*/+"|      C_STREET_1                         Cust-Phone:                            |\n"
/*14*/+"|      C_STREET_2                         Cust-Since:                            |\n"
/*09*/+"|      C_CITY                             Cust-Credit:                           |\n"
/*15*/+"|                                                                                |\n"
/*16*/+"|Amount Paid:          New Cust-Balance:                                         |\n"
/*17*/+"|Credit Limit:                                                                   |\n"
/*18*/+"|                                                                                |\n"
/*19*/+"|Cust-Data: CUST-DATA1                                                           |\n"
/*20*/+"|           CUST-DATA2                                                           |\n"
/*21*/+"|           CUST-DATA3                                                           |\n"
/*22*/+"|           CUST-DATA4                                                           |\n"
/*23*/+"|                                                                                |\n"
/*24*/+"|________________________________________________________________________________|\n"
;

var orderStatusScreen: string =
//       01234567890123456789012345678901234567890123456789012345678901234567890123456789
/*01*/ "|--------------------------------------------------------------------------------|\n"
/*02*/+"|                                   Order Status                                 |\n"
/*03*/+"|Warehouse:        District:                                                     |\n"
/*04*/+"|Customer:      Name:                                      Balance:              |\n"
/*05*/+"|Order Number:          Order Date:            Carrier:                          |\n"
/*06*/+"|                                                                                |\n"
/*07*/+"| Supp_W Item_Id Qty  Amount Delivered On                                        |\n"
/*08*/+"| 11                                                                             |\n"
/*09*/+"| 12                                                                             |\n"
/*10*/+"| 13                                                                             |\n"
/*11*/+"| 14                                                                             |\n"
/*12*/+"| 15                                                                             |\n"
/*13*/+"| 16                                                                             |\n"
/*14*/+"| 17                                                                             |\n"
/*15*/+"| 18                                                                             |\n"
/*16*/+"| 19                                                                             |\n"
/*17*/+"| 20                                                                             |\n"
/*18*/+"| 21                                                                             |\n"
/*19*/+"| 22                                                                             |\n"
/*20*/+"| 23                                                                             |\n"
/*21*/+"| 24                                                                             |\n"
/*22*/+"| 25                                                                             |\n"
/*23*/+"|                                                                                |\n"
/*24*/+"|________________________________________________________________________________|\n"
;

var deliveryScreen: string =
//       01234567890123456789012345678901234567890123456789012345678901234567890123456789
/*01*/ "|--------------------------------------------------------------------------------|\n"
/*02*/+"|                                     Delivery                                   |\n"
/*03*/+"| Warehouse:                                                                     |\n"
/*04*/+"|                                                                                |\n"
/*05*/+"| Carrier Number:                                                                |\n"
/*06*/+"|                                                                                |\n"
/*07*/+"| Execution Status:                                                              |\n"
/*08*/+"|                                                                                |\n"
/*10*/+"|                                                                                |\n"
/*11*/+"|                                                                                |\n"
/*12*/+"|                                                                                |\n"
/*13*/+"|                                                                                |\n"
/*14*/+"|                                                                                |\n"
/*09*/+"|                                                                                |\n"
/*15*/+"|                                                                                |\n"
/*16*/+"|                                                                                |\n"
/*17*/+"|                                                                                |\n"
/*18*/+"|                                                                                |\n"
/*19*/+"|                                                                                |\n"
/*20*/+"|                                                                                |\n"
/*21*/+"|                                                                                |\n"
/*22*/+"|                                                                                |\n"
/*23*/+"|                                                                                |\n"
/*24*/+"|________________________________________________________________________________|\n"
;

var stockLevelScreen: string =
//       01234567890123456789012345678901234567890123456789012345678901234567890123456789
/*01*/ "|--------------------------------------------------------------------------------|\n"
/*02*/+"|                                   Stock Level                                  |\n"
/*03*/+"|                                                                                |\n"
/*04*/+"|                                                                                |\n"
/*05*/+"| Status:                                                                        |\n"
/*06*/+"|                                                                                |\n"
/*07*/+"|                                                                                |\n"
/*08*/+"|                                                                                |\n"
/*10*/+"|                                                                                |\n"
/*11*/+"|                                                                                |\n"
/*12*/+"|                                                                                |\n"
/*13*/+"|                                                                                |\n"
/*14*/+"|                                                                                |\n"
/*09*/+"|                                                                                |\n"
/*15*/+"|                                                                                |\n"
/*16*/+"|                                                                                |\n"
/*17*/+"|                                                                                |\n"
/*18*/+"|                                                                                |\n"
/*19*/+"|                                                                                |\n"
/*20*/+"|                                                                                |\n"
/*21*/+"|                                                                                |\n"
/*22*/+"|                                                                                |\n"
/*23*/+"|                                                                                |\n"
/*24*/+"|________________________________________________________________________________|\n"
;

var adminScreen: string =
//       01234567890123456789012345678901234567890123456789012345678901234567890123456789
/*01*/ "|--------------------------------------------------------------------------------|\n"
/*02*/+"|                               TPC-C Admin                                      |\n"
/*03*/+"| Database:                 Duration:       Warehouses:                          |\n"
/*04*/+"|                    Total  %/Tot         /s       /min  %/min    avg/min        |\n"
/*05*/+"| New Order   :                                                                  |\n"
/*06*/+"| Payment     :                                                                  |\n"
/*07*/+"| Order Status:                                                                  |\n"
/*08*/+"| Delivery    :                                                                  |\n"
/*10*/+"| Stock Level :                                                                  |\n"
/*11*/+"| Total       :                                                                  |\n"
/*12*/+"|                                                                                |\n"
/*13*/+"|                                                                                |\n"
/*14*/+"|                                                                                |\n"
/*09*/+"|                                                                                |\n"
/*15*/+"|                                                                                |\n"
/*16*/+"|                                                                                |\n"
/*17*/+"|                                                                                |\n"
/*18*/+"|                                                                                |\n"
/*19*/+"|                                                                                |\n"
/*20*/+"|                                                                                |\n"
/*21*/+"|                                                                                |\n"
/*22*/+"|                                                                                |\n"
/*23*/+"|                                                                                |\n"
/*24*/+"|________________________________________________________________________________|\n"
;
