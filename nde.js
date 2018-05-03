/**
 * NDE (Nullsoft Database Engine) in PHP
 * By Daniel15 - http://www.d15.biz/
 *
 * References:
 * - http://gutenberg.free.fr/fichiers/SDK%20Winamp/nde_specs_v1.txt
 * - http://translate.google.com/translate?hl=en&sl=de&u=http://itavenue.de/java/mlremote-oder-die-winamp-media-library
 */

	// All the data type stuff is in a separate file
	// require('data_types.php');

const fs = require('fs');
require('./nde-data-types');

const NDEINDEX_SIGNATURE = 'NDEINDEX';
const NDETABLE_SIGNATURE = 'NDETABLE';

const isDebug = true;

class debug {
	static log(str) {
		if (isDebug) {
			console.log(str);
		}
	}
}

class NDEFileRecord {
	fields;
}

/**
 * NDE Index file class
 * ==================================================================================================
 * Offset                      Data Type      Size                  Field
 * ==================================================================================================
 * 0                           STRING         8                     "NDEINDEX"
 * 8                           INT            4                     Number of records
 * 12                          INDEX          4*NumberOfRecords     Primary Index (insertion order)
 *
 * Optional :
 *
 * 4*NumberOfRecords+12        INDEX          4*NumberOfRecords     First Secondary Index
 * 2*(4*NumberOfRecords)+12    INDEX          4*NumberOfRecords     Second Secondary Index
 * ...
 * ==================================================================================================
 */
class NDEIndex {

	numberOfRecords;
	file;

	/**
	 * When we create this class, we'd better load the file, and check how long it is.
	 */
	constructor (fileName) {
		const f = fs.open(fileName, 'r', (err, fd) => {
			if (err) throw err;
			fs.stat(fd, (err, stat) => {
				console.info(stat);





				fs.close(fd, (err) => {
					if (err) throw err;
				});
			});
			const signature = f.read(NDEINDEX_SIGNATURE.length);
		});
		this.file = f;


		if (signature === NDEINDEX_SIGNATURE) {
			debug.log('Index signature: ' + signature + '<br />');
			this.numberOfRecords = f.readInt32LE(8);

			// Number of records in the file
			// Bytes that don't seem to do anything
			// $temp = fread(this.file, 4);

		} else {
			throw new Error('Invalid index signature');
		}

	}

	/**
	 * Get the next index from the index file.
	 */
	getNext() {
		return {
			'offset': this.file.read(4),
			'index': $data[2]
		};
	}
}

/**
 * NDE Data file class
 */
class NDEData {
	// This is the very first thing in the file. It's used to verify that the
	// file actually is a NDE Table.

	private $file;
	// The order the columns are in. This is defined by the "Column" field,
	// which is the first one in the file.
	private $columns;

	/**
	 * Just load the file and check the signature
	 */
	constructor  ($file) {
		this.file = fopen($file, 'rb');
		// TODO: Actually check the signature.
		$temp = fread(this.file, strlen(this.SIGNATURE));
		NDEDatabase.debug_msg(`Data signature: ${temp}<br />`);
	}

	/**
	 * Get a record from the file. One record consists of many fields, in a
	 * linked list. Firstly, this gets the first field (identified by the offset
	 * passed to this function) and reads that. Then, it checks if it has a next
	 * field to go to (the field will contain this data). If so, it goes to that
	 * field, and reads it. This continues until we have no more fields in the
	 * record. After that, we check what type of field it is.
	 *
	 * The two "other" types are "column" and "index". I don't know what the
	 * index type actually does, but the "column" type tells us all the
	 * information stored about songs. The very first record in the file is a
	 * "column" record, and the second record is a "index" record. The rest of
	 * the file is all information about songs.
	 */
	get_record($offset, $index)
	{
		$record = new NDEFileRecord();

	NDEDatabase.debug_msg('<strong>Record:</strong><br />');

	// While we have fields to get
	do
	{
		// Go to this offset
		fseek(this.file, $offset);
		// Read some stuff
		$data = fread(this.file, 14);
		// Find out the length we need to read from the file
		$size = array_pop(unpack('i', substr($data, 2, 4)));
		// Add this data
		$data .= fread(this.file, $size);
		// The actual field itself
		$field = new NDEField($data);
		$record->fields[] = $field;

		// Do we have another one in this series? Better grab the offset
		$offset = $field.next;
	}
	while ($offset != 0);

	// Is this the "column" field?
	if ($record->fields[0]->type == NDEField::FIELD_COLUMN)
	{
		// We need to fill our $columns variable!
		foreach ($record->fields as $field)
		this.columns[$field->id] = $field->data->name;

		return false;
	}
	// otherwise, it could be that weird index one.
	elseif ($record->fields[0]->type == NDEField::FIELD_INDEX)
	{
		// TODO: Find out what this field actually is.
		return false;
	}

	// Otherwise, it's a song!
	// We need to store all the data stuffs
	$song = new NDERecord();

	foreach ($record->fields as $field)
	{
		$variable = this.columns[$field->id];
		$song->$variable = $field->data->data;
	}

	return $song;
}
}

/**
 * NDE Database
 *
 * A database is basically an index file, and a data file. The index file tells
 * us where to go to get data, and the data file tells us where the data
 * actually is. This class coordinates the two files.
 */
class NDEDatabase
{
	// Files
	$index;
	$data;

	// Set this to true to get too much debugging info (go on, try it). :P
	isDebug = false;

	$records;

	/**
	 * Creates a new instance of the NDEDatabase class.
	 *
	 * When an instance of this class is created, we need to:
	 * 1. Load the index file (basefile + '.idx').
	 * 2. Load the data file (basefile + '.dat').
	 * 3. Loop through all the indices, and load the corresponding data.
	 */
	constructor (baseFileName) {
		this.index = new NDEIndex(baseFileName + '.idx');
		this.data = new NDEData(baseFileName + '.dat');

	// Need to read in all the records
	for (let i = 0; i < this.index.numberOfRecords(); i++) {
		// Get the next index from the index file
		let index_data = this.index.get();
		// NDEDatabase::debug_msg('<strong>Read ' . $i . ':</strong> offset = ' . $index_data['offset'] . ', index = ' . $index_data['index'] . '... <br />');
		// Now, get the data associated with this index.
		$data = this.data.get_record($index_data['offset'], $index_data['index']);
		// Was it a record? If so, process it.
		if ($data instanceof NDERecord) {
			this._process_record($data);
		}
	}
}

	/**
	 * Add a record to our array. Defined as a function so that other classes can extend it.
	 */
	_process_record($record) {
		this.records.push($record);
		// Return the index of the new record.
		return this.records.length - 1;
	}

	/**
	 * Debugging function, used to show debug messages only if we're in debug mode.
	 */
	debug_msg($string) {
		if (this.isDebug) {
			console.log($string);
		}
	}
};

exports = {
	NDEIndex,
	NDEDatabase,
	NDEData
};
