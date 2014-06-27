
var printf = require('printf');

var nullDBResponseTime = 0*1000; /* in milliseconds; Response time of the database that doesn't do anything */

var xact_counts: {[transaction: string] : number} = {};
xact_counts['New Order']    = 0;
xact_counts['Payment']      = 0;
xact_counts['Order Status'] = 0;
xact_counts['Delivery']     = 0;
xact_counts['Stock Level']  = 0;

var xact_counts_last: {[transaction: string] : number} = {};
xact_counts_last['New Order']    = 0;
xact_counts_last['Payment']      = 0;
xact_counts_last['Order Status'] = 0;
xact_counts_last['Delivery']     = 0;
xact_counts_last['Stock Level']  = 0;

var test_start_time: any = new Date();
var total_xacts_last: number = 0;
var stats_calc_time_last: any = new Date();  /* TypeScript complains on (Date - Date), so use 'any' data type */

function getStats() {
  var out: string;
  var key: string;
  var now: any = new Date();
  var seconds_since_last_call = Math.abs(now - stats_calc_time_last)/1000;

  var xact_per_sec: {[transaction: string] : number} = {};
  xact_per_sec['New Order']    = (xact_counts['New Order']    - xact_counts_last['New Order']   )/seconds_since_last_call;
  xact_per_sec['Payment']      = (xact_counts['Payment']      - xact_counts_last['Payment']     )/seconds_since_last_call;
  xact_per_sec['Order Status'] = (xact_counts['Order Status'] - xact_counts_last['Order Status'])/seconds_since_last_call;
  xact_per_sec['Delivery']     = (xact_counts['Delivery']     - xact_counts_last['Delivery']    )/seconds_since_last_call;
  xact_per_sec['Stock Level']  = (xact_counts['Stock Level']  - xact_counts_last['Stock Level'] )/seconds_since_last_call;

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
                  60 * xact_counts['New Order']/(Math.abs(now - test_start_time)/1000)))
        .replace('Payment     :                                                          ',
                  printf('Payment     : %10d %6.2f %10d %10d %6.2f %10d',
                  xact_counts['Payment'],
                  xact_percent['Payment'],
                  xact_per_sec['Payment'],
                  xact_per_min['Payment'],
                  (xact_per_min['Payment']/total_xact_per_minute)*100,
                  60 * xact_counts['Payment']/(Math.abs(now - test_start_time)/1000)))
        .replace('Order Status:                                                          ',
                  printf('Order Status: %10d %6.2f %10d %10d %6.2f %10d',
                  xact_counts['Order Status'],
                  xact_percent['Order Status'],
                  xact_per_sec['Order Status'],
                  xact_per_min['Order Status'],
                  (xact_per_min['Order Status']/total_xact_per_minute)*100,
                  60 * xact_counts['Order Status']/(Math.abs(now - test_start_time)/1000)))
        .replace('Delivery    :                                                          ',
                  printf('Delivery    : %10d %6.2f %10d %10d %6.2f %10d',
                  xact_counts['Delivery'],
                  xact_percent['Delivery'],
                  xact_per_sec['Delivery'],
                  xact_per_min['Delivery'],
                  (xact_per_min['Delivery']/total_xact_per_minute)*100,
                  60 * xact_counts['Delivery']/(Math.abs(now - test_start_time)/1000)))
        .replace('Stock Level :                                                          ',
                  printf('Stock Level : %10d %6.2f %10d %10d %6.2f %10d',
                  xact_counts['Stock Level'],
                  xact_percent['Stock Level'],
                  xact_per_sec['Stock Level'],
                  xact_per_min['Stock Level'],
                  (xact_per_min['Stock Level']/total_xact_per_minute)*100,
                  60 * xact_counts['Stock Level']/(Math.abs(now - test_start_time)/1000)))
        .replace('Total       :                                                          ',
                  printf('Total       : %10d %6.2f %10d %10d %6.2f %10d',
                  total_xacts,
                  100,
                  (total_xacts - total_xacts_last)/seconds_since_last_call,
                  (total_xacts - total_xacts_last)/seconds_since_last_call * 60,
                  100,
                  60 * total_xacts/(Math.abs(now - test_start_time)/1000)))
        .replace('Time:                                        ', printf('Time: %s', now))
        ;

  xact_counts_last['New Order']    = xact_counts['New Order']    ;
  xact_counts_last['Payment']      = xact_counts['Payment']      ;
  xact_counts_last['Order Status'] = xact_counts['Order Status'] ;
  xact_counts_last['Delivery']     = xact_counts['Delivery']     ;
  xact_counts_last['Stock Level']  = xact_counts['Stock Level']  ;

  total_xacts_last = total_xacts;
  stats_calc_time_last = now;

  return out;
}

class Terminal  {

  public w_id: number;
  display: any;

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
  constructor(w_id: number, display: any) {

    this.w_id = w_id;
    this.display = display;

    this.menuProfile        = new MenuProfile(this);
    this.newOrderProfile    = new NewOrderProfile(this);
    this.paymentProfile     = new PaymentProfile(this);
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
     //setTimeout(function(){self.chooseTransaction();}, 1000);
     self.chooseTransaction();
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

  getProfile(): TransactionProfile {
    return this.currentProfile;
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
  prepareInput();

  /* Execute the transaction */
  execute();

  /*
   * execute() function should register this function as the even-handler for
   * when the transaction response is received. This function then in turn
   * should call the terminal's showMenu() after think-time.
   */
  receiveTransactionResponse();
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
  receiveTransactionResponse(){}
}

class OrderLineItem {
  constructor(public i_id: number, public i_name: string,
              public supply_w_id: number, public quantity: number,
              public s_quantity: number, public branded_generic: string,
              public i_price: number, public amount: number) {
  }
}

class NewOrderProfile implements TransactionProfile {

  term: Terminal;  /* term.w_id is the terminal's warehouse */
  w_tax: number;
  d_id: number;
  d_tax: number;
  c_id: number;
  c_name: string;
  c_credit: string;
  c_discount: number;
  o_id: number;
  o_entry_d: Date;
  o_ol_cnt: number;
  ol_items: OrderLineItem[];
  total: number;

  constructor(term: Terminal) {
    this.term = term;
  }

  getKeyingTime() {
    return 18000;  /* Clause 5.2.5.7 */
  }

  meanThinkTime: number = 12;  /* Clause 5.2.5.7 */
  getThinkTime() {
    return 1000 * Math.min(this.meanThinkTime * 10, -1 * Math.log(Math.random()) * this.meanThinkTime);
  }

  prepareInput() {

    var i: number;

    this.w_tax = 0.10;
    this.d_id = 9;
    this.d_tax = 0.15;
    this.c_id = 99;
    this.c_name = 'Singh';
    this.c_credit = 'GC';
    this.c_discount = 0.40;
    this.o_id = 9999;
    this.o_entry_d = new Date();
    this.o_ol_cnt = 12;

    this.ol_items = [];

    for (i = 0; i < 15; ++i) {
      this.ol_items[i] = new OrderLineItem(i*1000, 'ITEM' + i, this.term.w_id,
                                            15-i, 9999, 'G', 200, 200*(15-i));
    }

    this.total = 0;
  }

  execute(){

    var self = this;

    /* Do-nothing transaction */

    /* Simulate a transaction that takes 1 second */
    setTimeout(function(){
      self.receiveTransactionResponse();
      }, nullDBResponseTime);
  }

  receiveTransactionResponse(){

    var self = this;

    ++xact_counts['New Order'];

    /*Simulate that the completed transaction provided the order's total amount */
    self.total = 900;

    self.term.refreshDisplay();

    setTimeout(function(){
        self.term.showMenu();
      }, self.getThinkTime() - 1000);  /* See note above call of Terminal.chooseTransaction() */
  }

  /*
   * Although I tried very hard, this screen layout may not agree with the
   * layout describe in Clause 2.4.3.5. I primarily used the screenshot under
   * Clause 2.4.3.1 as the guide. N.B: Clause 2.2.1.2's item 5 allows reordering
   * or repositioning of the fields.
   */
  getScreen(): string {

    var i: number;

    var out:string = newOrderScreen
                      .replace('Warehouse:     '        , printf('Warehouse: %4d', this.term.w_id))
                      .replace('Customer:     '         , printf('Customer: %4d', this.c_id))
                      .replace('Order Number:         ' , printf('Order Number: %8d', this.c_id))
                      .replace('District:   '           , printf('District: %2d', this.d_id))
                      .replace('Name:                 ' , printf('Name: %-16s', this.c_name))
                      .replace('Number of Lines:   '    , printf('Number of Lines: %2d', this.o_ol_cnt))
                      .replace('Credit:   '             , printf('Credit: %2s', this.c_credit, 2))
                      .replace('Discount:       '       , printf('Discount: %.4f', this.c_discount))
                      .replace('WTax:       '           , printf('WTax: %.4f', this.w_tax))
                      .replace('DTax:       '           , printf('DTax: %.4f', this.d_tax))
                      .replace('Order Date:           ' , printf('Order Date: %10s', this.o_entry_d.getFullYear() + '/' + this.o_entry_d.getMonth() + '/' + this.o_entry_d.getDay()))
                      .replace('Total:       '          , printf('Total: %6.2f', this.total))
                      ;

    for (i = 0; i < 15; ++i) {
      out = out.replace(' ' + (i+11).toString() + '                                                                             ',
                         printf(' %6d %7d %-24s %3d %9d %2s %5.2f %6.2d         ',
                                this.ol_items[i].supply_w_id,
                                this.ol_items[i].i_id,
                                this.ol_items[i].i_name,
                                this.ol_items[i].quantity,
                                this.ol_items[i].s_quantity,
                                this.ol_items[i].branded_generic,
                                this.ol_items[i].i_price,
                                this.ol_items[i].amount));
    }

    return out;
  }
}

class PaymentProfile implements TransactionProfile {

  term: Terminal;  /* term.w_id is the terminal's warehouse */
  status: string;  /* TODO: remove this and add actual variables */

  constructor(term: Terminal) {
    this.term = term;
  }

  getKeyingTime() {
    return 3000;  /* Clause 5.2.5.7 */
  }

  meanThinkTime: number = 12;  /* Clause 5.2.5.7 */
  getThinkTime() {
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

    ++xact_counts['Payment'];

    self.status = 'R';

    self.term.refreshDisplay();

    setTimeout(function(){
        self.term.showMenu();
      }, self.getThinkTime() - 1000);  /* See note above call of Terminal.chooseTransaction() */
  }

  getScreen(): string {
      return paymentScreen.replace('Status:  ', 'Status: ' + this.status);
  }
}

class OrderStatusProfile implements TransactionProfile {

  term: Terminal;  /* term.w_id is the terminal's warehouse */
  status: string;  /* TODO: remove this and add actual variables */

  constructor(term: Terminal) {
    this.term = term;
  }

  getKeyingTime() {
    return 2000;  /* Clause 5.2.5.7 */
  }

  meanThinkTime: number = 10;  /* Clause 5.2.5.7 */
  getThinkTime() {
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

    ++xact_counts['Order Status'];

    self.status = 'R';

    self.term.refreshDisplay();

    setTimeout(function(){
        self.term.showMenu();
      }, self.getThinkTime() - 1000);  /* See note above call of Terminal.chooseTransaction() */
  }

  getScreen(): string {
      return orderStatusScreen.replace('Status:  ', 'Status: ' + this.status);
  }
}

class DeliveryProfile implements TransactionProfile {

  term: Terminal;  /* term.w_id is the terminal's warehouse */
  status: string;  /* TODO: remove this and add actual variables */

  constructor(term: Terminal) {
    this.term = term;
  }

  getKeyingTime() {
    return 2000;  /* Clause 5.2.5.7 */
  }

  meanThinkTime: number = 5;  /* Clause 5.2.5.7 */
  getThinkTime() {
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

    ++xact_counts['Delivery'];

    self.status = 'R';

    self.term.refreshDisplay();

    setTimeout(function(){
        self.term.showMenu();
      }, self.getThinkTime() - 1000);  /* See note above call of Terminal.chooseTransaction() */
  }

  getScreen(): string {
      return deliveryScreen.replace('Status:  ', 'Status: ' + this.status);
  }
}

class StockLevelProfile implements TransactionProfile {

  term: Terminal;  /* term.w_id is the terminal's warehouse */
  status: string;  /* TODO: remove this and add actual variables */

  constructor(term: Terminal) {
    this.term = term;
  }

  getKeyingTime() {
    return 2000;  /* Clause 5.2.5.7 */
  }

  meanThinkTime: number = 5;  /* Clause 5.2.5.7 */
  getThinkTime() {
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
      }, self.getThinkTime() - 1000);  /* See note above call of Terminal.chooseTransaction() */
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
/*02*/+"|                                                                                |\n"
/*03*/+"|                                      TPC-C                                     |\n"
/*04*/+"|                                                                                |\n"
/*05*/+"|                                                                                |\n"
/*06*/+"|                                                                                |\n"
/*07*/+"|                                                                                |\n"
/*08*/+"|                                                                                |\n"
/*10*/+"|                                                                                |\n"
/*11*/+"|                                                                                |\n"
/*12*/+"|                                                                                |\n"
/*13*/+"|                                                                                |\n"
/*14*/+"|                                    MENU SCREEN                                 |\n"
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
/*03*/+"| Warehouse:      District:    WTax:        DTax:                                |\n"
/*04*/+"| Customer:       Name:                   Credit:    Discount:                   |\n"
/*05*/+"| Order Number:          Number of Lines:    Order Date:            Total:       |\n"
/*06*/+"|                                                                                |\n"
/*07*/+"| Supp_W Item_Id Item_Name                Qty Stock_Qty BG Price   Amount        |\n"
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
/*23*/+"| ItemNotFoundMessage                                                            |\n"
/*24*/+"|________________________________________________________________________________|\n"
;

var paymentScreen: string =
//       01234567890123456789012345678901234567890123456789012345678901234567890123456789
/*01*/ "|--------------------------------------------------------------------------------|\n"
/*02*/+"|                                                                                |\n"
/*03*/+"|                                 Payment                                        |\n"
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

var orderStatusScreen: string =
//       01234567890123456789012345678901234567890123456789012345678901234567890123456789
/*01*/ "|--------------------------------------------------------------------------------|\n"
/*02*/+"|                                                                                |\n"
/*03*/+"|                              Order Status                                      |\n"
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

var deliveryScreen: string =
//       01234567890123456789012345678901234567890123456789012345678901234567890123456789
/*01*/ "|--------------------------------------------------------------------------------|\n"
/*02*/+"|                                                                                |\n"
/*03*/+"|                                Delivery                                        |\n"
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

var stockLevelScreen: string =
//       01234567890123456789012345678901234567890123456789012345678901234567890123456789
/*01*/ "|--------------------------------------------------------------------------------|\n"
/*02*/+"|                                                                                |\n"
/*03*/+"|                               Stock Level                                      |\n"
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

xact_counts["New Order"] = 0;
xact_counts["Payment"] = 0;
xact_counts["Order Status"] = 0;
xact_counts["Delivery"] = 0;
xact_counts["Stock Level"] = 0;

var adminScreen: string =
//       01234567890123456789012345678901234567890123456789012345678901234567890123456789
/*01*/ "|--------------------------------------------------------------------------------|\n"
/*02*/+"|                               TPC-C Admin                                      |\n"
/*03*/+"| Time:                                                                          |\n"
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
