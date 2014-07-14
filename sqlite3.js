/**
 * __CasperJS__ module that interfaces __SQLite 3__ databases.
 *
 * 		var sqlitemod = require('./sqlite3');
 *
 * 		sqlite = sqlitemod.sqlite3("mysqlite.db");
 *
 * 		sqlite.queryArray("SELECT * FROM myTable;", function(arrayResult){
 *			// Do stuff
 * 		}
 *
 * @author Thomas Moquet
 *
 * @module sqlite3
 */
 
 
var require = patchRequire(require);				// patching phantomjs' require()
var childProcess = require("child_process");		// Requiring childProcess to execute command line
var sqliteresultmod = require('./sqlite3result');	// Requiring SQLite3 result class


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


exports.sqlite3 = function(db){
	/**
	 * Sqlite3 database filename
	 *
	 * @attribute db
	 * @type {String} sqlite3 databse filename
	 * @required
	 */	 
	this._db = db;
	
	
	/**
	 * The SQL query to execute
	 *
	 * @private
	 * @property _query
	 */
	this._query = null;
	
	
	/**
	 * The error message returned
	 *
	 * @private
	 * @property _error_msg
	 */
	this._error_msg = null;
	
	
	/**
	 * The last insert row id
	 *
	 * @private
	 * @property _lastInsertRowID
	 */
	this._lastInsertRowID = null;
	
	
	/**
	 * The number of database rows that were changed (or inserted or deleted) by the most recent SQL statement.
	 *
	 * @private
	 * @property _changes
	 */
	this._changes = null;
	
	
	/**
	 * The number of database rows that were changed (or inserted or deleted) by all the SQL statements.
	 *
	 * @private
	 * @property _totalChanges
	 */
	this._totalChanges = null;
	
	
	/**
	 * Executes a result-less query against a given database
	 *
	 * @method exec
	 * @param query {String} The SQL query to execute (typically an INSERT, UPDATE, or DELETE query).
	 * @param callback {Function} Callback the return
	 *
	 * @return {Boolean} Returns TRUE if the query succeeded, FALSE on failure.
	 */
	this.exec = function(query, callback) {
		this._query = query.concat(";").replace(";;",";"); 		// Assuring having end semicolon for adding SQL query
		var sqlite3 = this;
		if (childProcess) {
			childProcess.execFile("sqlite3", [this._db, this._query+"SELECT changes();SELECT total_changes();SELECT last_insert_rowid();"], null, function (err, stdout, stderr) {
				var aStdout = stdout.split("\n");				// Change output to array	
				aStdout.pop(); 									// Delete last empty line
				sqlite3._lastInsertRowID = aStdout.pop();		// Set _lastInsertRowID
				sqlite3._totalChanges = aStdout.pop();			// Set _totalChanges
				sqlite3._changes = aStdout.pop();				// Set _changes
				sqlite3._error_msg = stderr.replace("\n", "");	// Delete line feed
				if (callback && typeof(callback) === "function") {  
					callback(stderr ? false : true);
				}
			});
		}
	};
	
	
	/**
	 * Executes an SQL query
	 *
	 * @method query
	 * @param query {String} The SQL query to execute.
	 * @param callback {Function} Callback the return
	 *
	 * @return {sqlite3result} Returns an {{#crossLink "sqlite3result"}}{{/crossLink}} object if the query returns results. 
	 * Otherwise, returns TRUE if the query succeeded, FALSE on failure.
	 */
	this.query = function(query, callback) {
		this._query = query.concat(";").replace(";;",";");		// Assuring having end semicolon for adding SQL query
		var sqlite3 = this;
		if (childProcess) {
			childProcess.execFile("sqlite3", ["-header", this._db, this._query+"SELECT changes();SELECT total_changes();SELECT last_insert_rowid();"], null, function (err, stdout, stderr) {
				var aStdout = stdout.split("\n");				// Change output to array
				aStdout.pop(); 									// Delete last empty line
				sqlite3._lastInsertRowID = aStdout.pop();		// Set _lastInsertRowID
				aStdout.pop(); 									// Delete last_insert_rowid column name
				sqlite3._totalChanges = aStdout.pop();			// Set _totalChanges
				aStdout.pop(); 									// Delete total_changes column name
				sqlite3._changes = aStdout.pop();				// Set _changes
				aStdout.pop();									// Delete changes column name
				stdout = aStdout.join("\n");					// Change array to input
				sqlite3._error_msg = stderr.replace("\n", "");	// Delete line feed
				if (sqlite3._error_msg) {
					sqlite3result = false;
				} else if (!stdout){
					sqlite3result = true;
				} else {	
					sqlite3result = sqliteresultmod.sqlite3result(stdout);
				}
				if (callback && typeof(callback) === "function") {  
					callback(sqlite3result);
				}
			});
		}
	};
		
	
	/**
	 * Executes a query and returns a single result
	 *
	 * @method querySingle
	 * @param query {String} The SQL query to execute.
	 * @param entireRow {Boolean} By default, querySingle() returns the value of the first column returned by the query. 
	 * If entire_row is TRUE, then it returns an array of the entire first row.
	 * @param callback {Function} Callback the return
	 *
	 * @return {String} Returns the value of the first column of results
	 * @return {Array} or an array of the entire first row (if entireRow is TRUE).
	 * @return {Boolean} Invalid or failing queries will return FALSE.
	 * If the query is valid but no results are returned, then NULL will be returned if entireRow is FALSE
	 * otherwise an empty array is returned.
	 */
	this.querySingle = function(query, entireRow, callback) {
		this._query = query;
		var sqlite3 = this;
		entireRow = entireRow ? entireRow : false;
		if (childProcess) {
			childProcess.execFile("sqlite3", ["-header", this._db, this._query], null, function (err, stdout, stderr) {
				sqlite3._error_msg = stderr.replace("\n", "");
				if (sqlite3._error_msg){
					result = false;
				} else {
					var aStdout = stdout.split("\n");
					var fields = aStdout.shift().split("|");
					if (aStdout.length) {
						var row = aStdout.shift().split("|");
						if (entireRow) {
							var result = {};
							for (var j=0;j<row.length; j++){
								result[fields[j]] = row[j];
							}
						} else {
							var result = row[0];
						}
					} else {
						if (entireRow) {
							var result = {};
						} else {
							var result = null;
						}
					}
				}
				if (callback && typeof(callback) === "function") {  
					callback(result);
				}
			});
		}
	};
			
	
	/**
	 * Executes a query and fetches all rows from the result set as an array of arrays
	 * It is similar to calling query then fetchArray for each row in the result set.
	 *
	 * @method queryArray
	 * @param query {String} The SQL query to execute.
	 *
	 * @param [resultType=SQLITE3_BOTH] {String}
	 *
	 * Controls how the rows will be returned. 
	 * This value must be one of either SQLITE3_ASSOC, SQLITE3_NUM, or SQLITE3_BOTH
	 *
	 * - SQLITE3_ASSOC: returns an array indexed by column name as returned in the corresponding result set
	 * - SQLITE3_NUM: returns an array indexed by column number as returned in the corresponding result set, starting at column 0
	 * - SQLITE3_BOTH: returns an array indexed by both column name and number as returned in the corresponding result set, starting at column 0
	 *
	 * @param callback {Function} Callback the return
	 *
	 * @return {Array} or an array of the entire first row (if entireRow is TRUE).
	 * @return {Boolean} Invalid or failing queries will return FALSE.
	 * If the query is valid but no results are returned, an empty array is returned.
	 */
	this.queryArray = function(query, resultType, callback) {
		this._query = query;
		var sqlite3 = this;
		resultType = resultType ? resultType : SQLITE3_BOTH;
		if (childProcess) {
			childProcess.execFile("sqlite3", ["-header", this._db, this._query], null, function (err, stdout, stderr) {
				sqlite3._error_msg = stderr.replace("\n", "");
				if (sqlite3._error_msg) {
					var result = false;
				} else {
					if (stdout) {
						var aStdout = stdout.split("\n");
						aStdout.pop();
						var fields = aStdout.shift().split("|");
						var resultTmp = [];
						for (var i=0; i < aStdout.length;i++){	
							resultTmp.push(aStdout[i].split("|"));
						}					
						var result = [];
						for (var i=0; i < resultTmp.length;i++){
							var resultLine = {};
							for (var j=0;j<resultTmp[i].length; j++){
								if (resultType == SQLITE3_ASSOC || resultType == SQLITE3_BOTH){
									resultLine[fields[j]] = resultTmp[i][j];
								}
								if (resultType == SQLITE3_NUM || resultType == SQLITE3_BOTH){
									resultLine[j] = resultTmp[i][j];
								}
							}
							result.push(resultLine);
						}
					} else {
						var result = [];
					}
				}
				if (callback && typeof(callback) === "function") {  
					callback(result);
				}
			});
		}
	};
	
	
	/**
	 * Returns English text describing the most recent failed SQLite request
	 *
	 * @method lastErrorMsg
	 *
	 * @return {String} Returns an English string describing the most recent failed SQLite request.
	 */
	this.lastErrorMsg = function(){
		return this._error_msg;
	};
	
	
	/**
	 * Returns the row ID of the most recent INSERT into the database
	 *
	 * @method lastInsertRowID
	 *
	 * @return {Integer} Returns the row ID of the most recent INSERT into the database
	 */
	this.lastInsertRowID = function() {
		return this._lastInsertRowID;
	};
	
	
	/**
	 * Returns the number of database rows that were changed (or inserted or deleted) by the most recent SQL statement
	 *
	 * @method lastInsertRowID
	 *
	 * @return {Integer} Returns an integer value corresponding to the number of database rows changed (or inserted or deleted) by the most recent SQL statement.
	 */
	this.changes = function() {
		return this._changes;
	};
	
	
	/**
	 * Returns the number of database rows that were changed (or inserted or deleted) by all the SQL statements.
	 *
	 * @method lastInsertRowID
	 *
	 * @return {Integer} Returns an integer value corresponding to the number of database rows changed (or inserted or deleted) by all the SQL statement.
	 */
	this.totalChanges = function() {
		return this._totalChanges;
	};
	
	
	/**
	 * Returns the SQLite3 library version as a string constant, version date and version hash
	 *
	 * @method lastInsertRowID
	 *
	 * @param callback {Function} Callback the return
	 *
	 * @return {Array} Returns an associative array with the keys "versionString", "versionDate" and "versionHash".
	 */
	this.version = function(callback) {
		if (childProcess) {
			childProcess.execFile("sqlite3", ["-version"], null, function (err, stdout, stderr) {
				var infos = stdout.replace("\n", "").split(" ");
				var result = {};
				result["versionString"] = infos[0];
				result["versionDate"] = infos[1]+" "+infos[2];
				result["versionHash"] = infos[3];
				if (callback && typeof(callback) === "function") {  
					callback(result);
				}
			});
		}
	};
	
	
	return this;
}
