// my module, stored in sqlite3result.js
// patching phantomjs' require()
var require = patchRequire(require);
var childProcess = require("child_process");

const SQLITE_ASSOC = "SQLITE_ASSOC";
const SQLITE_BOTH = "SQLITE_BOTH";
const SQLITE_NUM = "SQLITE_NUM";

exports.sqlite3result = function(stdout){
	var aStdout = stdout.split("\n");
	aStdout.pop(); // Vire le dernier \n
	this.fields = aStdout.shift().split("|");
	this.result = [];
	for (var i=0; i < aStdout.length;i++){	
		this.result.push(aStdout[i].split("|"));
	}
	this.numRows = this.result.length;
	this.numColumns = this.fields.length;
	this.columnName = function(columnNumber) {
		return this.fields[columnNumber];
	};
	this.fetchArray = function(resultType) {
		resultType = resultType ? resultType : SQLITE_BOTH;
		var row = this.result.shift();
		if (!row) return false;
		var resultLine = {};
		for (var j=0;j<row.length; j++){
			if (resultType == SQLITE_ASSOC || resultType == SQLITE_BOTH){
				resultLine[this.fields[j]] = row[j];
			}
			if (resultType == SQLITE_NUM || resultType == SQLITE_BOTH){
				resultLine[j] = row[j];
			}
		}
		return resultLine;
	};
	this.fetchAll = function(resultType) {
		var result = [];
		while (resultLine = this.fetchArray(resultType)){
			result.push(resultLine);
		}
		if (!result.length) return false;
		return result;
	};
	this.reset = function(){
		this.result = [];
		for (var i=0; i < aStdout.length;i++){	
			this.result.push(aStdout[i].split("|"));
		}
		return true;	
	};
	return this;
};