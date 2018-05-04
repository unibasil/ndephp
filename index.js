const util = require('util');
const fs = require('fs');

/**
 * @property {Function} uint8
 * @property {Function} uint16
 * @property {Function} int32
 * @property {Function} array
 * @property {Function} string
 * @property {Function} buffer
 */
const Parser = require("binary-parser").Parser;

const indexFileName = 'ml/main.idx';
const tableFileName = 'ml/main.dat';

// const indexFileName = 'ml/art.idx';
// const tableFileName = 'ml/art.dat';

const NDEINDEX_SIGNATURE = 'NDEINDEX';
const NDETABLE_SIGNATURE = 'NDETABLE';

const FIELD_UNDEFINED = 255;
const FIELD_COLUMN = 0;
const FIELD_INDEX = 1;
const FIELD_REDIRECTOR = 2;
const FIELD_STRING = 3;
const FIELD_INTEGER = 4;
const FIELD_BOOLEAN = 5;
const FIELD_BINARY = 6;
const FIELD_GUID = 7;
const FIELD_FLOAT = 9;
const FIELD_DATETIME = 10;
const FIELD_LENGTH = 11;
const FIELD_FILENAME = 12;

// Index

const ndeIndexElement = new Parser()
	.endianess('little')
	.int32("offset")
	.int32("index");

const ndeIndexFile = new Parser()
	.endianess('little')
	.string("signature", {
		length: NDEINDEX_SIGNATURE.length,
		assert: NDEINDEX_SIGNATURE
	})
	.int32("count")
	.int32("idx1")
	.array("records", {
		type: ndeIndexElement,
		length: "count"
	})
	.int32("idx2")
	.array("second", {
		type: ndeIndexElement,
		length: "count"
	});

// Data

const ndeColumnField = new Parser()
	.endianess('little')
	.uint8('type')
	.uint8('uniq')
	.uint8('size')
	.buffer('name', { length: 'size', formatter: v => { return v.toString() } });

const ndeIndexField = new Parser()
	.endianess('little')
	.int32('offset')
	.int32('type')
	.uint8('size')
	.buffer('name', { length: 'size', formatter: v => { return v.toString() } });

const ndeRedirectorField = new Parser()
	.endianess('little')
	.int32('value');

const ndeStringField = new Parser()
	.endianess('little')
	.uint16('size')
	.buffer('value', { length: 'size', formatter: v => { return v.toString('utf16le') } });

const ndeIntegerField = new Parser()
	.endianess('little')
	.int32('value');

const ndeDateTmeField = new Parser()
	.endianess('little')
	.int32('value', { formatter: v => { return new Date(v * 1000).toUTCString() } });

const ndeBooleanField = new Parser()
	.endianess('little')
	.uint8('value');

const ndeBinaryField = new Parser()
	.endianess('little')
	.uint16('size')
	.buffer('value', { length: 'size' });

const ndeGUIDField = new Parser()
	.endianess('little')
	.buffer('value', { length: 16 });

const ndeFloatField = new Parser()
	.endianess('little')
	.floatle('value');

const ndeFileNameField = new Parser()
	.endianess('little')
	.uint16('size')
	.buffer('value', { length: 'size', formatter: v => { return v.toString('utf16le') } });

const ndeUnknownField = new Parser()
	.endianess('little')
	.uint16('size')
	.skip('size');

const ndeField = new Parser()
	.endianess('little')
	.uint8('id')
	.uint8('fieldType')
	.int32('size')
	.int32('next')
	.int32('prev')
	.choice('data', {
		tag: 'fieldType',
		choices: {
			0: ndeColumnField,      // FIELD_COLUMN
			1: ndeIndexField,       // FIELD_INDEX
			2: ndeRedirectorField,  // FIELD_REDIRECTOR
			3: ndeStringField,      // FIELD_STRING
			4: ndeIntegerField,     // FIELD_INTEGER
			5: ndeBooleanField,     // FIELD_BOOLEAN
			6: ndeBinaryField,      // FIELD_BINARY
			7: ndeGUIDField,        // FIELD_GUID
			9: ndeFloatField,       // FIELD_FLOAT
			10: ndeDateTmeField,    // FIELD_DATETIME
			11: ndeIntegerField,    // FIELD_LENGTH
			12: ndeFileNameField    // FIELD_FILENAME
		},
		defaultChoice: ndeUnknownField
	});

const ndeTableFile = new Parser()
	.endianess('little')
	.string("signature", {
		length: NDETABLE_SIGNATURE.length,
		assert: NDETABLE_SIGNATURE
	})
	.array('fields', {
		type: ndeField,
		readUntil: 'eof'
	});

const ndeIndex = ndeIndexFile.parse(fs.readFileSync(indexFileName));
// console.info(util.inspect(ndeIndex, false, null));

const ndeTable = ndeTableFile.parse(fs.readFileSync(tableFileName));
// console.info(util.inspect(ndeTable, false, null));


let columns = [];
let rows = [];
let seq = [];
let acc = null;
let cursor = 0;
ndeTable.fields.forEach((v, i, arr) => {
	if (v.fieldType === 0) {
		columns[v.id] = [v.id, v.data.name];
	} else if (v.fieldType === 1) {
		// skip index field type
	} else {
		if (v.id === 0) {
			if (acc !== null) {
				if (acc.rating > 0) {
					rows[cursor] = Object.assign({}, acc);
					cursor++;
				}
			}
			// acc = [[v.id, v.fieldType, v.data.value]];
			acc = { filename: v.data.value };
		} else {
			if (v.id === 12) {
				acc.rating = v.data.value;
			} else if (v.id === 1) {
				acc.name = v.data.value;
			}
		}
	}
});

//console.info(columns);
// console.table(rows);
// console.info(rows);
// console.info(rows.length);
const a = JSON.stringify(rows, null, 2);
// console.info(JSON.stringify(rows));
// console.info(seq);

fs.writeFileSync('best.json', a);

