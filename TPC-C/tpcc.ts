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
var winston = require('winston');
var g_logger = new (winston.Logger)({ exitOnError: false })
g_logger.handleExceptions(new winston.transports.File({ filename: '/tmp/tpcc_exceptions.log' }))
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

/* Create a box to display license and warranty message at the bottom of the main box. */
var adminBox: any = blessed.box({
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
      bg: 'black',
    },
  }
});


/* End the program on these keys */
mainScreen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

mainBox.focus();

mainScreen.render();

function increase_warehouse_count(count: number) {
  var i: number;
  var j: number;

  for (i = g_num_warehouses;
        i < (g_num_warehouses + count);
        ++i) {

    for (j = 0; j < 10; ++j) {
                                          /* Warehouse IDs are 1 based */
      g_terminals[i*10 + j] = new Terminal(i+1, new Postgres(g_logger), (i === 0 && j === 0) ? mainBox : null, g_logger);
    }
  }

  g_num_warehouses += count;
}

function decrease_warehouse_count(count: number) {
    /* TODO */
}

increase_warehouse_count(15);

/* IIFE to display transaction stats, and to prevent polluting global scope. */
(function () {
  var stats: TPCCStats = new TPCCStats();

  setInterval(function(){

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
