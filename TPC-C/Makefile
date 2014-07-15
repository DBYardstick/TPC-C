
OUTPUT = runner.js
SOURCES = null_db.ts transaction_objects.ts db_interface.ts postgres_db.ts terminal.ts tpcc.ts

all: $(OUTPUT)

run: all
	node $(OUTPUT)

watch: $(SOURCES)
	tsc --watch --out $(OUTPUT) --noImplicitAny $^

$(OUTPUT): $(SOURCES)
	tsc --out $(OUTPUT) --noImplicitAny $^
