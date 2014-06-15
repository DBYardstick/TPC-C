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

var GPLv3Message =
"TPC.js  Copyright (C) 2014  Gurjeet Singh, http://gurjeet.singh.im"
+ "\n" + "This program comes with ABSOLUTELY NO WARRANTY. This is free software, and you"
+ "\n" + "are welcome to redistribute it under terms of GNU General Public License version 3.";

var blessed = require('blessed');

/* Create a screen */
var screen = blessed.screen();

/* Create a box in top-left corner, sized just enough to hold a TPC-C terminal's contents */
var topBox = blessed.box({
  parent: screen, /* This box is the only child of the screen */
  top: 'top',
  left: 'left',
  width: '500',
  height: '500',
  content: '{center}{bold}TPC-C{/bold}{/center}',
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
    hover: {
      bg: 'green'
    }
  }
});

/* Create a box to display license and warranty message at the bottom of the top box. */
var licenseBox = blessed.box({
  parent: topBox,
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
    hover: {
      bg: 'green'
    }
  }
});

/* Remove the license/warranty message after a while */
var licenseBoxTimeoutHandle = setTimeout(function() {
  licenseBox.parent.remove(licenseBox);
  screen.render();
}, 3000);

/* Remove the license/warranty message if someone clicks on it. */
licenseBox.on('click', function() {

  licenseBox.parent.remove(licenseBox);

  /*
   * Prevent the timeout function from being called, because we've already done
   * its work.
   */
  clearTimeout(licenseBoxTimeoutHandle);

  delete licenseBox;  /* Recover the redundant object, and all the event
                       * handlers associated with it.
                       */
});

topBox.on('click', function(data) {
  topBox.setContent('{center}Some different {red-fg}content{/red-fg}.{/center}');
  screen.render();
});

topBox.key('enter', function(ch, key) {
  topBox.setContent('{right}Even different {black-fg}content{/black-fg}.{/right}\n');
  topBox.setLine(1, 'bar');
  topBox.insertLine(1, 'foo');
  screen.render();
});

/* End the program on these keys */
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

topBox.focus();

screen.render();

