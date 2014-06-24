
/* The screen that is currently being displayed by the terminal */

class Terminal  {

  currentProfile: TransactionProfile;
  display: any;

  /*
   * w_id: Warehouse ID, as stored in database. We use a string type because the
   * TPC-C specification allows this to be any data type.
   */
  constructor(public w_id: string, display: any) {
    this.display = display;
    this.currentProfile = new MenuProfile(this);
    this.setProfile(new MenuProfile(this));
  }

  setProfile(profile: TransactionProfile) {
    this.currentProfile = profile;

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

var terminals: Terminal[];

interface TransactionProfile {
  getScreen() : string;
  action();
}

class MenuProfile implements TransactionProfile {

  term: Terminal;

  constructor(term: Terminal) {
    var self = this;

    self.term = term;

    setTimeout(function(){
      self.action();
      }, 2000);
  }

  getScreen(): string {
    return menuScreen
  }

  action() {
    var self = this;

    setTimeout(function() {

      self.term.setProfile(new NewOrderProfile(self.term));

      }, 3000);
  }
}

class NewOrderProfile implements TransactionProfile {

  term: Terminal;

  constructor(term: Terminal) {

    var self = this;

    self.term = term;

    setTimeout(function() {
      self.action();
      }, 1000);
  }

  getScreen(): string {
    return newOrderScreen.replace('WAREHOUSE', this.term.w_id);
  }

  action() {

    var self = this;

    setTimeout(function() {

      self.term.setProfile(new MenuProfile(self.term));

      }, 3000);
  }
}

/*******************
* Screen templates *
********************/

var menuScreen: string =
//      01234567890123456789012345678901234567890123456789012345678901234567890123456789
/*01*/ "                                                                                \n"
/*02*/+"                                                                                \n"
/*03*/+"                                                                                \n"
/*04*/+"                                                                                \n"
/*05*/+"                                                                                \n"
/*06*/+"                                                                                \n"
/*07*/+"                                                                                \n"
/*08*/+"                                                                                \n"
/*09*/+"                                                                                \n"
/*10*/+"                                                                                \n"
/*11*/+"                                                                                \n"
/*12*/+"                                                                                \n"
/*13*/+"                                                                                \n"
/*14*/+"                        MENU SCREEN                                             \n"
/*15*/+"                                                                                \n"
/*16*/+"                                                                                \n"
/*17*/+"                                                                                \n"
/*18*/+"                                                                                \n"
/*19*/+"                                                                                \n"
/*20*/+"                                                                                \n"
/*21*/+"                                                                                \n"
/*22*/+"                                                                                \n"
/*23*/+"                                                                                \n"
/*24*/+"                                                                                \n"
;

var newOrderScreen: string =
//      01234567890123456789012345678901234567890123456789012345678901234567890123456789
/*01*/ "                                                                                \n"
/*02*/+"                                                                                \n"
/*03*/+"                                                                                \n"
/*04*/+"                                                                                \n"
/*05*/+"                                                                                \n"
/*06*/+"                                                                                \n"
/*07*/+"                                                                                \n"
/*08*/+"                                                                                \n"
/*09*/+"                                                                                \n"
/*10*/+"                                                                                \n"
/*11*/+"                                                                                \n"
/*12*/+"                                                                                \n"
/*13*/+"                                                                                \n"
/*14*/+"                        NEW ORDER                                               \n"
/*15*/+"                                                                                \n"
/*16*/+"                       W_ID: WAREHOUSE                                          \n"
/*17*/+"                                                                                \n"
/*18*/+"                                                                                \n"
/*19*/+"                                                                                \n"
/*20*/+"                                                                                \n"
/*21*/+"                                                                                \n"
/*22*/+"                                                                                \n"
/*23*/+"                                                                                \n"
/*24*/+"                                                                                \n"
;
