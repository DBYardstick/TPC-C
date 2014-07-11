class OrderLine {
  constructor(
  public ol_i_id        : number,  /* Input */
  public ol_supply_w_id : number,  /* Input */
  public ol_quantity    : number,  /* Input */
  public i_price        : number,  /* Output */
  public i_name         : string,  /* Output */
  public i_data         : string,  /* Output */
  public s_quantity     : number,  /* Output */
  public brand_generic  : string,  /* Output */
  public ol_amount      : number   /* Output */
  ){

  }

}

/* New Order I/O, per Clause 2.4.3 */
class NewOrder {

  w_id          : number;      /* Input */
  d_id          : number;      /* Input */
  c_id          : number;      /* Input */
  order_lines   : OrderLine[]; /* In/Out */  /* if order_lines[n].ol_i_id === -1, then that and the following order-line items should be ignored */
  o_id          : number;      /* Output */
  o_entry_d     : Date;        /* Output */
  w_tax         : number;      /* Output */
  d_tax         : number;      /* Output */
  d_next_o_id   : number;      /* Output */
  c_last        : string;      /* Output */
  c_credit      : string;      /* Output */
  c_discount    : number;      /* Output */
  o_ol_cnt      : number;      /* Output */
  total_amount  : number;      /* Output */

  constructor() {

    this.order_lines = [];

    var i;
      for (i = 0; i < 15; ++i) {
        this.order_lines[i] = new OrderLine(0, 0, 0, 0, '', '', 0, '', 0);
      }
  }
}

class Payment {
    w_id        : number;  /* Input */
    d_id        : number;  /* Input */
    c_w_id      : number;  /* Input */
    c_d_id      : number;  /* Input */
    c_id        : number;  /* In/Out */ /* Only one of c_id or c_name is non-zero/null at a time */
    c_last      : string;  /* In/Out */
    h_amount    : number;  /* Input */
    w_name      : string;  /* Output */
    w_street_1  : string;  /* Output */
    w_street_2  : string;  /* Output */
    w_city      : string;  /* Output */
    w_state     : string;  /* Output */
    w_zip       : string;  /* Output */
    d_name      : string;  /* Output */
    d_street_1  : string;  /* Output */
    d_street_2  : string;  /* Output */
    d_city      : string;  /* Output */
    d_state     : string;  /* Output */
    d_zip       : string;  /* Output */
    c_first     : string;  /* Output */
    c_middle    : string;  /* Output */
    //c_last    : string;  /* This is an In/Out parameter; see above */
    c_street_1  : string;  /* Output */
    c_street_2  : string;  /* Output */
    c_city      : string;  /* Output */
    c_state     : string;  /* Output */
    c_zip       : string;  /* Output */
    c_phone     : string;  /* Output */
    c_since     : Date;    /* Output */
    c_credit    : string;  /* Output */
    c_credit_lim: number;  /* Output */
    c_discount  : number;  /* Output */
    c_balance   : number;  /* Output */
    c_data      : string;    /* Output */
    h_date      : Date;    /* Output */

    constructor() {}
}
