
Developers
==========

Prerequisites
-------------

1. NodeJS 0.10.x
2. TypScript compiler
3. GNU Make (or equivalent)


Compile and Run
---------------

In the `TPC-C` directory:

- Use `make` to compile the source code.

- Use `make run` to execute the TPC-C tests, and compile the code if necessary.

- Use `make watch` to launch the compiler in 'watch' mode, where it watches
source files for changes and automatically compiles them as you save the source
files.

Notes
=====

* With PostgresDummy DB, at 15000 warehouses, using 4 CPUs we get no NewOrder
transactions until about 3 minutes!! This seems to be because of the backlog of
Payment transactions that builds up within the first 18-or-so seconds, and for
the first 3 minutes the database sees a barrage of Payment transactions. By the
time that barrage ends, the backlog of NewOrder transactions builds up and then
the database sees only NewOrder transactions for a while.

  NullDB doesn't exhibit this behaviour, apparently because the backlog never
builds up.


TODO
====

1. Allow a configurable value for the first active warehouse-id.

2. Allow user to increase/decrease the think/keying times, with an aim of
   increasing/decreasing the transaction rates using the same number of
   active warehouses.
