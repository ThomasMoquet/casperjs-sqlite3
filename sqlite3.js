// my module, stored in sqlite3.js
// patching phantomjs' require()
var require = patchRequire(require);
var childProcess = require("child_process");


var sqliteresultmod = require('./sqlite3result');


const SQLITE_ASSOC = "SQLITE_ASSOC";
const SQLITE_BOTH = "SQLITE_BOTH";
const SQLITE_NUM = "SQLITE_NUM";

exports.sqlite3 = function(db){
	this.db = db;
	this._query = null;
	this._error_msg = null;
	this._lastInsertRowID = null;
	this._changes = null;
	this._totalChanges = null;
	this.exec = function(query, callback) {
		this._query = query.concat(";").replace(";;",";");
		var sqlite3 = this;
		if (childProcess) {
			childProcess.execFile("sqlite3", [this.db, this._query+"SELECT changes();SELECT total_changes();SELECT last_insert_rowid();"], null, function (err, stdout, stderr) {
				var aStdout = stdout.split("\n");
				aStdout.pop(); // Vire le dernier \n
				sqlite3._lastInsertRowID = aStdout.pop();
				sqlite3._totalChanges = aStdout.pop();
				sqlite3._changes = aStdout.pop();
				sqlite3._error_msg = stderr.replace("\n", "");
				if (callback && typeof(callback) === "function") {  
					callback(stderr ? false : true);
				}
			});
		}
	};
	this.query = function(query, callback) {
		this._query = query.concat(";").replace(";;",";");
		var sqlite3 = this;
		if (childProcess) {
			childProcess.execFile("sqlite3", ["-header", this.db, this._query+"SELECT changes();SELECT total_changes();SELECT last_insert_rowid();"], null, function (err, stdout, stderr) {
				var aStdout = stdout.split("\n");
				aStdout.pop(); // Vire le dernier \n
				sqlite3._lastInsertRowID = aStdout.pop();
				aStdout.pop(); // Vire le label lastInsertRowID
				sqlite3._totalChanges = aStdout.pop();
				aStdout.pop(); // Vire le label total change
				sqlite3._changes = aStdout.pop();
				aStdout.pop(); // Vire le label change
				stdout = aStdout.join("\n");
				sqlite3._error_msg = stderr.replace("\n", "");
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
	this.querySingle = function(query, entireRow, callback) {
		this._query = query;
		var sqlite3 = this;
		entireRow = entireRow ? entireRow : false;
		if (childProcess) {
			childProcess.execFile("sqlite3", ["-header", this.db, this._query], null, function (err, stdout, stderr) {
				sqlite3._error_msg = stderr.replace("\n", "");
				if (sqlite3._error_msg){
					result = false;
				} else {
					var aStdout = stdout.split("\n");
					var fields = aStdout.shift().split("|");
					var row = aStdout.shift().split("|");
					if (entireRow) {
						var result = {};
						for (var j=0;j<row.length; j++){
							result[fields[j]] = row[j];
						}
					} else {
						var result = row[0];
					}
				}
				if (callback && typeof(callback) === "function") {  
					callback(result);
				}
			});
		}
	};
	this.queryArray = function(query, resultType, callback) {
		this._query = query;
		var sqlite3 = this;
		resultType = resultType ? resultType : SQLITE_BOTH;
		if (childProcess) {
			childProcess.execFile("sqlite3", ["-header", this.db, this._query], null, function (err, stdout, stderr) {
				sqlite3._error_msg = stderr.replace("\n", "");
				if (sqlite3._error_msg) {
					var result = false;
				} else {
					var aStdout = stdout.split("\n");
					aStdout.pop(); // Vire le dernier \n
					var fields = aStdout.shift().split("|");
					var resultTmp = [];
					for (var i=0; i < aStdout.length;i++){	
						resultTmp.push(aStdout[i].split("|"));
					}					
					var result = [];
					for (var i=0; i < resultTmp.length;i++){
						var resultLine = {};
						for (var j=0;j<resultTmp[i].length; j++){
							if (resultType == SQLITE_ASSOC || resultType == SQLITE_BOTH){
								resultLine[fields[j]] = resultTmp[i][j];
							}
							if (resultType == SQLITE_NUM || resultType == SQLITE_BOTH){
								resultLine[j] = resultTmp[i][j];
							}
						}
						result.push(resultLine);
					}
				}
				if (callback && typeof(callback) === "function") {  
					callback(result);
				}
			});
		}
	};
	this.lastErrorMsg = function(){
		return this._error_msg;
	};
	this.lastInsertRowID = function() {
		return this._lastInsertRowID;
	};
	this.changes = function() {
		return this._changes;
	};
	this.totalChanges = function() {
		return this._totalChanges;
	};
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
