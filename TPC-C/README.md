
Motivation
==========

The TPC-C benchmark drivers currently available to us, like TPCC-UVa, DBT2,
HammerDB, BenchmarkSQL, etc., all run one process (or thread) per simulated
client. Because the TPC-C benchmark specification limits the max tpmC metric
(transactions per minute of benchmark-C) from any single client to be 1.286 tpmC,
this means that to get a result of, say, 1 million tpmC we have to run about
833,000 clients. Even for a decent number as low as 100,000 tpmC, one has to run
83,000 clients.

Given that running a process/thread, even on modern operating systems, is a bit
expensive, it requires a big upfront investment in hardware to run the thousands
of clients required for driving a decent tpmC number. For example, the current
TPC-C record holder had to run 6.8 million clients to achieve 8.55 million tpmC,
and they used 16 high-end servers to run these clients, which cost them about
$ 220,000 (plus $ 550,000 in client-side software).

So, to avoid those high costs, these existing open-source implementations of
TPC-C compromise on the one of the core requirements of the TPC-C benchmark:
keying and thinking times. These implementations resort to just hammering the
SUT (system under test) with a constant barrage of transactions from a few
clients (ranging from 10-50).

So you can see that even though a decent modern database (running on a single
machine) can serve a few hundred clients simultaneously, it ends up serving
very few (10-50) clients. I strongly believe that this way the database is
not being tested to its full capacity; at least not as the TPC-C specification
intended.

The web-servers of yesteryears also suffer from the same problem; using one
process for each client request prohibits them from scaling, because the
underlying operating system cannot run thousands of processes efficiently. The
web-servers solved this problem (known as [c10k problem]) by using event-driven
architecture which is capable of handling thousands of clients using a single
process, and with minimal effort on the operating system's part.

So this implementation of TPC-C uses a similar architecture and uses [NodeJS],
the event-driven architecture, to run thousands of clients against a database.

[c10k problem]: http://en.wikipedia.org/wiki/C10k_problem
[NodeJS]: http://nodejs.org/

2.7 million tpmC
-----------------

My iniital tests demonstrate that, theoretically, a NodeJS application running
on my 2-year old laptop is capable of generating about 2.7 million tpmC; all
this on a single CPU, while 7 other CPUs are sitting idle. I ran the
nodejs_ticks_per_second.js script (linked below), to see how many events can
NodeJS process per second. On my machine the result was about 600,000/sec. Since
TPC-C mandates that no more than 45% of the transactions be the New Order
Transaction, this means that only about 270,000 of those events can be used for
processing New Order Transaction. Since a New Order transaction involves about
6 steps (display menu, keying time, send transaction, receive result, render
screen, think time), we can get 45,000 New Order Transactions per second, and
that translates to 2,700,000 tpmC.

https://github.com/gurjeet/nodejs_ticks_per_second/blob/master/ticks_per_second.js

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

The snippet below shows a typical run, with custom configuration.

```bash
cd TPC-C/

export TPCC='{"active_warehouses":15, "database_type":"Postgres", "postgres_connection_pool_count": 4, "postgres_connection_string":"postgres://tpcc:password@localhost/postgres"}'

make run
```

Demo Screencast
---------------
Click on the link labeled `slow` in the bottom-right corner of the screencast
below to see a demo run of TPCC.js against `Postgres` using 15 warehouses (that
is, 150 clients). The upper half of the screen shows Terminal-1 of Warehouse-1,
and the bottom-half shows the statistics of all the transaction types.

http://showterm.io/d269c80846350a4e9051b

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

* Watch backend execution using the following query

```sql
select  regexp_replace(query, '.*process_(.*)\(.*', '\1') as "Transaction Profile",
        state as "Current Backend State",
        count(*) as count,
        total
from    (select *,
                count(*) over () as total
        from    pg_stat_activity
        where   pid <> pg_backend_pid()) as v
group by
        query, state, total
order by query, state;
```

Typical output may look like:

```
 Transaction Profile | Current Backend State | count | total
---------------------+-----------------------+-------+-------
 delivery            | active                |     1 |     5
 new_order           | active                |     1 |     5
 order_status        | idle                  |     1 |     5
 payment             | active                |     1 |     5
 payment             | idle                  |     1 |     5
(5 rows)
```

TODO
====

1. Allow a configurable value for the first active warehouse-id.

2. Allow user to increase/decrease the think/keying times, with an aim of
   increasing/decreasing the transaction rates using the same number of
   active warehouses.
