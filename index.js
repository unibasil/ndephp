
const Parser = require("binary-parser").Parser;

const NDEINDEX_SIGNATURE = 'NDEINDEX';
const NDETABLE_SIGNATURE = 'NDETABLE';

// Build an IP packet header Parser

const ndeIndex = new Parser()
	.array('i', {
		type: 'int32be',
		// length: "numberOfRecords"
		length: "numberOfRecords"
	});

const ndeIndexFile = new Parser()
	.string("signature", {
		length: NDEINDEX_SIGNATURE.length
	})
	.int32("numberOfRecords")
	.array("index1", {
		type: 'int32be',
		length: "numberOfRecords"
	})
	.array("index2", {
		type: 'int32be',
		length: "numberOfRecords"
	})
	.array("index3", {
		type: 'int32be',
		length: "numberOfRecords"
	});



// const ndeDataFile = new Parser()
// 	.endianess("big")
// 	.string("signature", NDETABLE_SIGNATURE.length)
// 	.int32be("numberOfRecords")
// 	.array("index", {
// 		type: "int32",
// 		length: "numberOfRecords"
// 	});

// const content = [
// 	'NDEINDEX',
// 	6,
// 	1, 2, 3, 4, 5, 6,
// 	1, 2, 3, 4, 5, 6,
// 	1, 2, 3, 4, 5, 6
// ];
// console.info(content);

// const buffer = Buffer.from(content);

// console.info(new Int32Array([6]).length);

// const buffer = Buffer.concat([
// 	new Buffer.from('NDEINDEX', 8),
// 	new Buffer.from(new Int32Array([6])),
// 	new Buffer.from(new Int32Array([1, 1, 1, 1, 1, 1])),
// 	new Buffer.from(new Int32Array([2, 2, 2, 2, 2, 2])),
// 	new Buffer.from(new Int32Array([3, 3, 3, 3, 3, 3])),
// 	new Buffer.from(new Int32Array([3, 3, 3, 3, 3, 3])),
// 	new Buffer.from(new Int32Array([3, 3, 3, 3, 3, 3])),
// 	new Buffer.from(new Int32Array([3, 3, 3, 3, 3, 3])),
// 	new Buffer.from(new Int32Array([3, 3, 3, 3, 3, 3])),
// 	new Buffer.from(new Int32Array([3, 3, 3, 3, 3, 3])),
// 	new Buffer.from(new Int32Array([3, 3, 3, 3, 3, 3]))
// ]);

const idx = new Buffer.from([
	0, 0, 0, 1,
	0, 0, 0, 2,
	0, 0, 0, 3,
	0, 0, 0, 4,
	0, 0, 0, 5,
	0, 0, 0, 6,
]);
const b = new Buffer(12);
b.write(NDEINDEX_SIGNATURE, 0, 8);
b.writeInt32BE(6, 8, 4);

const len = b.length + idx.length * 3;
console.info(len);
const buffer = Buffer.concat([
	b,
	idx,
	idx,
	idx
], len);


console.info(buffer);
console.info(buffer.toJSON());

console.info(typeof buffer);
// console.info(ndeIndexFile.getCode());

const result = ndeIndexFile.parse(buffer);
console.info(result);
