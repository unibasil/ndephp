/**
 * NDE (Nullsoft Database Engine) in PHP
 * By Daniel15 - http://www.d15.biz/
 */

const {	NDEIndex, NDEDatabase, NDEData } = require('nde.js');

/**
 * A record, our internal representation. Nothing's here, look at* NDEDatabase::__construct
 */
class NDERecord {
}

/**
 * A NDE Field Format information (from Winamp SDK):
 ==================================================================================================
 Offset                      Data Type      Size                  Field
 ==================================================================================================
 0                           UCHAR          1                     Column ID
 1                           UCHAR          1                     Field Type
 2                           INT            4                     Size of field data
 6                           INT            4                     Next field position in table data pool
 10                          INT            4                     Previous field position in table data pool
 14                          FIELDDATA      SizeOfFieldData       Field data
 ==================================================================================================
 */

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

class NDEField {
	id;
	type;
	size;
	next;
	prev;
	raw;
	data;

	/**
	 * Creates a new NDEField.
	 * When an instance of this class is created, we need to:
	 * 1. Get all the data (using the format information as shown above)
	 * 2. Set the "$data" variable based on the type of field this is.
	 */
	constructor(data) {
		// First two things are unsigned characters (UCHAR).
		this.id = data.readUInt8(0);
		this.type = data.readUInt8(1);

		// Next three are integers.
		this.size = data.readUInt32BE(2);
		this.next = data.readUInt32BE(6);
		this.prev = data.readUInt32BE(10);

		// And this is the rest of the data.
		this.raw = data.readAsArrayBuffer(data, 14, this.size);

		NDEDatabase.debug_msg('&rarr; <strong>Field:</strong> Column ID: ' + this.id +
			' . type: ' + this.type +
			', size: ' + this.size +
			', next: ' + this.next +
			', prev: ' + this.prev + '<br />');

		// Actually get the data, depending on type.
		switch (this.type) {
			case FIELD_COLUMN:
				this.data = new NDEField_Column(this.raw);
				break;

			// I don't actually know what these are, so they're ignored for now.
			case FIELD_INDEX:
				break;

			case FIELD_STRING:
				this.data = new NDEField_String(this.raw);
				break;

			case FIELD_INTEGER:
			case FIELD_LENGTH:
				this.data = new NDEField_Integer(this.raw);
				break;

			case FIELD_DATETIME:
				this.data = new NDEField_DateTime(this.raw);
				break;

			// Shouldn't really happen. Yes, I know I haven't implemented all
			// the different types, but the above ones are the only ones that
			// seem to be used in the media library.
			default:
				console.error(`<strong style="color: red">Unknown field type: ${this.type}</strong>`);
				break;
		}
	}

	/**
	 * When we convert this to a string, we use the inner type.
	 * Hopefully that's a good assumption.
	 */
	toString() {
		return this.data.toString();
	}
}

/**
 * All data types inherit from this class
 */
class NDEField_Data {
}

/**
 * NDE "Column" type
 * Format information:
 ==================================================================================================
 Offset                      Data Type      Size                  Field
 ==================================================================================================
 0                           UCHAR          1                     Column Field Type (ie, FIELD_INTEGER)
 1                           UCHAR          1                     Index unique values (0/1)
 2                           UCHAR          1                     Size of column name string
 3                           STRING         SizeOfColumnName      Public name of the column
 ==================================================================================================
 */
class NDEField_Column extends NDEField_Data {
	type;
	unique;
	size;
	name;

	constructor(data) {
		super();
		// Characters (UCHARs)
		this.type = data.readUInt8(0);
		this.unique = data.readUInt8(1);
		this.size = data.readUInt8(2);
		// Name = rest of the data
		this.name = substr(data, 3, this.size);

		NDEDatabase::debug_msg(`&mdash;&rarr; <strong>Column:</strong> Type: ${this.type}, size: ${this.size}, name: ${this.name}<br />`);
	}

	toString() {
		return this.name;
	}
}

/**
 * NDE "String" type
 * Format information:
 ==================================================================================================
 Offset                      Data Type      Size                  Field
 ==================================================================================================
 0                           USHORT         2                     Size of string
 2                           STRING         SizeOfString          String
 ==================================================================================================
 */
class NDEField_String extends NDEField_Data {
	size;
	data;

	constructor(data) {
		super();
		// Unsigned short
		this.size = array_pop(unpack('S', $data));
		// Convert from UTF-16 (what Winamp uses) to UTF-8 (what PHP uses)
		this.data = iconv('UTF-16', 'UTF-8', substr($data, 2, this.size));
		NDEDatabase::debug_msg(`&mdash;&rarr; <strong>String:</strong> Size: ${this.size}, data: ${this.data}<br />`);
	}
}

/**
 * NDE "Integer" type. I think this is the simplest one :)
 * Format information:
 ==================================================================================================
 Offset                      Data Type      Size                  Field
 ==================================================================================================
 0                           INT            4                     Integer value
 ==================================================================================================
 */
class NDEField_Integer extends NDEField_Data {
	data;
	constructor (data) {
		super();
		this.data = array_pop(unpack('i', data));
		NDEDatabase::debug_msg(`&mdash;&rarr; <strong>Integer:</strong> data: ${this.data}<br />`);
	}
	toString() {
		return this.data;
	}
}

/**
 * NDE "DateTime" type. This is exact same as an integer, except it's treated
 * as a date/time format. The number is a UNIX timestamp.
 *
 * TODO: Add a field for formatted date?
 */
class NDEField_DateTime extends NDEField_Data {
	public data;
	constructor($data) {
		super();
		this.data = array_pop(unpack('i', $data));

		NDEDatabase::debug_msg(`&mdash;&rarr; <strong>DateTime:</strong> data: ${this.data}<br />`);
	}
	toString() {
		return this.data;
	}
}

/**
 * Print binary data as hex (eg. 0xDE 0xAD 0xFF 0x01)
 */
function print_binary(stuff) {
	for (i = 0; i < stuff.length; i++) {
		console.log('0x' + stuff[i].toString(16));
	}
}