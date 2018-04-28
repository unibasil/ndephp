const { NDEIndex, NDEDatabase, NDEData } = require('nde.js');

class NDEMediaDatabase extends NDEDatabase {

	$artists;

	_process_record($record) {
		// For a song, we gotta have artist and title as a minimum.
		if (!$record.artist)
			$record.artist = null;
		if (!$record.title)
			$record.title = null;

		// Do the normal processing.
		const $index = super._process_record($record);
		// Do we not have this artist already?
		if (!this.artists[$record.artist])
			this.artists[$record.artist] = new NDEMediaArtist($record.artist);

		// Also add it to our artists array
		this.artists[$record.artist].songs.push(this.records[$index]);
	}

	/**
	 * Get all the artists
	 */
	artists() {
		return this.artists;
	}

	/**
	 * Get a single artist
	 */
	artist($artist) {
		return isset(this.artists[$artist]) ? this.artists[$artist] : false;
	}
}


class NDEMediaArtist {
	public $songs;
	songs() {
		return this.songs;
	}
}
