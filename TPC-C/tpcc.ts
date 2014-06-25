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


var GPLv3Message =
"TPC.js  Copyright (C) 2014  Gurjeet Singh, http://gurjeet.singh.im"
+ "\n" + "This program comes with ABSOLUTELY NO WARRANTY. This is free software, and you"
+ "\n" + "are welcome to redistribute it under terms of GNU General Public License version 3.";

var blessed = require('blessed');

/* Create a screen */
/*
 * XXX: For some inexplicable reason, if this variable is named 'screen', it
 * causes `tsc` to emit an error, and no amount of diagnosis resolved the error.
 *
 * TODO: Create a definition file for blessed and contribute it to
 * DefinitelyTyped repo.
 */
var mainScreen: any = blessed.screen();

/*
 * Create a box in top-left corner of the screen, sized just enough to hold a
 * TPC-C terminal's contents.
 */
var mainBox: any = blessed.box({
  parent: mainScreen, /* This box is the only child of the screen */
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
      fg: '#f0f0f0',
    },
  }
});

var headerBox: any = blessed.box({
  parent: mainBox,
  left: 'center',
  bottom: 0,
  width: '100%',
  height: '120',
  content: '{center}TPC-C{/center}',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: '#f0f0f0',
      bg: 'black',
    },
  }
});

/* Create a box to display license and warranty message at the bottom of the main box. */
var licenseBox: any = blessed.box({
  parent: mainBox,
  left: 'center',
  bottom: 0,
  width: '100%',
  height: '250',
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
      bg: 'black',
    },
  }
});

/* Remove the license/warranty message after a while */
var licenseBoxTimeoutHandle: any = setTimeout(function() {

  //licenseBox.parent.remove(licenseBox);
  headerBox.parent.remove(headerBox);

  mainScreen.render();

  //delete licenseBox;
    /* Recover the redundant object, and all the event
                       * handlers associated with it.
                       */

}, 300);

/* Remove the license/warranty message if someone clicks on it. */
licenseBox.on('click', function() {

  licenseBox.parent.remove(licenseBox);

  mainScreen.render();

  /*
   * Prevent the timeout function from being called, because we've already done
   * its work.
   */
  clearTimeout(licenseBoxTimeoutHandle);

  delete licenseBox;  /* Recover the redundant object, and all the event
                       * handlers associated with it.
                       */
});

/* End the program on these keys */
mainScreen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

mainBox.focus();

mainScreen.render();

var terminal: Terminal = new Terminal(1, mainBox);
