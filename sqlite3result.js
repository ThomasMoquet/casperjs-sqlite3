/**
* A class that handles result sets for the SQLite 3 module.
*
* @class sqlite3result
* @constructor
*/


/**
 * SQLITE3_ASSOC: To return an array indexed by column name as returned in the corresponding result set
 *
 * @property SQLITE3_ASSOC
 * @type String
 * @final
 */
const SQLITE3_ASSOC = "SQLITE3_ASSOC";


/**
 * SQLITE3_BOTH: To return an array indexed by both column name and number as returned in the corresponding result set, starting at column 0
 *
 * @property SQLITE3_BOTH
 * @type String
 * @final
 */
const SQLITE3_BOTH = "SQLITE3_BOTH";


/**
 * SQLITE3_NUM: To return an array indexed by column number as returned in the corresponding result set, starting at column 0
 *
 * @property SQLITE3_NUM
 * @type String
 * @final
 */
const SQLITE3_NUM = "SQLITE3_NUM";


exports.sqlite3result = function(stdout){
	/**
	 * Sqlite3 query result output that is required for parsing result
	 *
	 * @attribute stdout
	 * @type {String} sqlite3 query result output
	 * @required
	 */	 
	 
	 
	var aStdout = stdout.split("\n"); 	// Change output to array	
	
	
	/**
	 * Setting fields name (given by -header sqlite3 option )
	 *
	 * @private
	 * @property _fields
	 */
	this._fields = aStdout.shift().split("|");
	
	
	/**
	 * Setting raw result
	 *
	 * @private
	 * @property _result
	 */
	this._result = [];
	for (var i=0; i < aStdout.length;i++){	
		this._result.push(aStdout[i].split("|"));
	}
	
	
	/**
	 * Setting number of returned rows
	 *
	 * @private
	 * @property _numRows
	 */
	this._numRows = this._result.length;
	
	
	/**
	 * Setting number of returned columns
	 *
	 * @private
	 * @property _numColumns
	 */
	this._numColumns = this._fields.length;
	
	
	/**
	 * Returns the column name
	 *
	 * @method columnName
	 * @param columnNumber {Integer} Column ID
	 * @return {String} Column name
	 */
	this.columnName = function(columnNumber) {
		return this._fields[columnNumber];
	};

	
	/**
	 * 	Fetches a result row as an associative or numerically indexed array or both
	 *
	 * @method fetchArray
	 * @param [resultType=SQLITE3_BOTH] {String}
	 *
	 * Controls how the next row will be returned to the caller. 
	 * This value must be one of either SQLITE3_ASSOC, SQLITE3_NUM, or SQLITE3_BOTH
	 *
	 * - SQLITE3_ASSOC: returns an array indexed by column name as returned in the corresponding result set
	 * - SQLITE3_NUM: returns an array indexed by column number as returned in the corresponding result set, starting at column 0
	 * - SQLITE3_BOTH: returns an array indexed by both column name and number as returned in the corresponding result set, starting at column 0
	 *
	 * @return {Array} Returns a result row as an associatively or numerically indexed array or both.
	 * @return {Boolean} Alternately will return FALSE if there are no more rows.
	 */
	this.fetchArray = function(resultType) {
		resultType = resultType ? resultType : SQLITE3_BOTH;
		var row = this._result.shift();
		if (!row) return false;
		var resultLine = {};
		for (var j=0;j<row.length; j++){
			if (resultType == SQLITE3_ASSOC || resultType == SQLITE3_BOTH){
				resultLine[this._fields[j]] = row[j];
			}
			if (resultType == SQLITE3_NUM || resultType == SQLITE3_BOTH){
				resultLine[j] = row[j];
			}
		}
		return resultLine;
	};
	
	
	/**
	 * 	Fetches all rows from a result set as an array of arrays
	 *  It is similar to calling fetchArray for each row in the result set.
	 *
	 * @method fetchAll
	 * @param [resultType=SQLITE3_BOTH] {String}
	 *
	 * Controls how the next row will be returned to the caller. 
	 * This value must be one of either SQLITE3_ASSOC, SQLITE3_NUM, or SQLITE3_BOTH
	 *
	 * - SQLITE3_ASSOC: returns an array indexed by column name as returned in the corresponding result set
	 * - SQLITE3_NUM: returns an array indexed by column number as returned in the corresponding result set, starting at column 0
	 * - SQLITE3_BOTH: returns an array indexed by both column name and number as returned in the corresponding result set, starting at column 0
	 *
	 * @return {Array} Returns an array of the remaining rows in a result set. 
	 * If called right after query(), it returns all rows. 
	 * If called after fetchArray(), it returns the rest. 
	 * If there are no rows in a result set, it returns an empty array.
	 */
	this.fetchAll = function(resultType) {
		var result = [];
		while (resultLine = this.fetchArray(resultType)){
			result.push(resultLine);
		}
		return result;
	};
	
	
	/**
	 * Resets the result set back to the first row
	 *
	 * @method reset
	 * @return {Boolean} Returns TRUE.
	 */	
	this.reset = function(){
		this._result = [];
		for (var i=0; i < aStdout.length;i++){	
			this._result.push(aStdout[i].split("|"));
		}
		return true;	
	};
	
	
	/**
	 * Returns the number of rows in the result set
	 *
	 * @method numRows
	 * @return {Integer} Returns the number of rows in the result set
	 */	
	this.numRows = function(){
		return this._numRows;
	};
	
	
	/**
	 * Returns the number of columns in the result set
	 *
	 * @method numColumns
	 * @return {Integer} Returns the number of columns in the result set
	 */	
	this.numColumns = function(){
		return this._numColumns;
	};
	
	
	return this;
};