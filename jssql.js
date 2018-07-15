Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="node_modules/@types/titanium/index.d.ts" />
/**
 * A bluebird promise based database wrapper for Ti.Database API. Partly based on https://github.com/ricardoalcocer/jssql thanks for the idea!
 * JSSQL CommonJS module. Using bluebird promises.
 * Made by Max Allan Niklasson
 * Use it however you want, fork it and have fun.
 * @class jssql
 */
var Promise = require("bluebird");
var jssql = /** @class */ (function () {
    /**
     * Create a jssql instance.
     * @example //Init the jssql module
     * var DBH = require("jssql");
     * var db = new DBH.jssql("databasename");
     * @param {string} dbname The name of the database
     * @param {string} dbpath Optional when installing a database
     * @param {boolean} remotebackup
     * Optional
     */
    function jssql(dbname, dbpath, remotebackup) {
        if (dbpath === void 0) { dbpath = null; }
        if (remotebackup === void 0) { remotebackup = false; }
        this.dbname = dbname;
        if (dbpath !== null && !Ti.App.Properties.getBool("JSSQL_IS_DB_INSTALLED_" + dbname)) {
            this.db = Ti.Database.install(dbpath, dbname);
            Ti.App.Properties.setBool("JSSQL_IS_DB_INSTALLED_" + dbname, true);
        }
        if (remotebackup === true) {
            this.db.file.setRemoteBackup(true);
        }
    }
    /**
     * @description Checks if a table exists
     * @param {string} tablename
     * @returns {Promise}
     */
    jssql.prototype.tableExists = function (tablename) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.db = Ti.Database.open(_this.dbname);
            var resultSet = _this.db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name = '" + tablename + "'");
            if (resultSet.rowCount > 0) {
                resolve();
            }
            else {
                reject();
            }
        }).finally(function () { return _this.db.close(); });
    };
    /**
     * @description Create a table
     * @example //Example of creating a table
     * db.createTable('tablename', [
     *  {
     *      name: 'testId',
     *      type: 'INTEGER PRIMARY KEY'
     *  },{
     *      name 'testValue',
     *      type: 'TEXT'
     *  }]).then(function(success){
     *      console.log("Create table successfully");
     *  }).catch(function(error){
     *      console.log(error);
     *  }]);
     * @param {string} tablename
     * @param {Array} columns
     * @returns {Promise}
     */
    jssql.prototype.createTable = function (tablename, columns) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.db = Ti.Database.open(_this.dbname);
            try {
                var sql = "CREATE TABLE IF NOT EXISTS '" + tablename + "' (" + columns.map(function (i) {
                    return i.name + " " + i.type;
                }).join(", ") + ")";
                _this.db.execute(sql);
            }
            catch (err) {
                reject(err);
            }
            resolve();
        }).finally(function () { return _this.db.close(); });
    };
    /**
     * @description Drop table speciefied by name
     * @param {string} tablename
     * @returns {Promise}
     */
    jssql.prototype.dropTable = function (tablename) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.tableExists(tablename).then(function () {
                _this.db = Ti.Database.open(_this.dbname);
                try {
                    _this.db.execute("DROP TABLE " + tablename);
                    resolve();
                }
                catch (error) {
                    reject(error);
                }
            }).catch(function () {
                reject("Table does not exists");
            });
        }).finally(function () { return _this.db.close(); });
    };
    /**
     * @description Add a column to a table.
     * @param {string} tablename Name of the table to alter
     * @param {string} column Name of the new column
     * @param {string} columnType SQLite type for the new column
     * @returns {Promise}
     */
    jssql.prototype.addColumn = function (tablename, column, columnType) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.db = Titanium.Database.open(_this.dbname);
            var fieldExists = false;
            var resultSet = _this.db.execute("PRAGMA TABLE_INFO(" + tablename + ")");
            while (resultSet.isValidRow()) {
                if (resultSet.field(1) == column) {
                    fieldExists = true;
                }
                resultSet.next();
            }
            if (!fieldExists) {
                try {
                    _this.db.execute("ALTER TABLE " + tablename + " ADD COLUMN " + column + " " + columnType);
                    resolve();
                }
                catch (error) {
                    reject(error);
                }
            }
            else {
                resolve();
            }
        }).finally(function () { return _this.db.close(); });
    };
    /**
     * @description Insert or replace data
     * @param {string} table
     * @param {Array} obj
     * @returns {Promise}
     */
    jssql.prototype.insertOrReplace = function (table, obj) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var data = [];
            if (Array.isArray(obj)) {
                obj.forEach(function (o) {
                    data.push(insertOrReplacePrepare(table, o));
                });
            }
            else {
                data = [insertOrReplacePrepare(table, obj)];
            }
            _this.db = Titanium.Database.open(_this.dbname);
            _this.db.execute("BEGIN");
            var queue = data.map(function (query) {
                return new Promise(function (resolve2, reject2) {
                    try {
                        _this.db.execute(query);
                        resolve2();
                    }
                    catch (error) {
                        reject2(error);
                    }
                });
            });
            Promise.all(queue).then(function () {
                _this.db.execute("COMMIT");
                resolve(_this.db.getLastInsertRowId());
            }).catch(function (error) {
                _this.db.execute("ROLLBACK");
                reject(error);
            });
        }).finally(function () { return _this.db.close(); });
    };
    /**
     * Execute one or multiple queries.
     * @param {(string | Array)} sql
     * @returns {Promise}
     */
    jssql.prototype.exec = function (sql) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var sqls = [];
            if (Array.isArray(sql)) {
                sqls = sql;
            }
            else {
                sqls = [sql];
            }
            _this.db = Titanium.Database.open(_this.dbname);
            _this.db.execute("BEGIN");
            Promise.all(sqls.map((function (query) {
                return new Promise(function (resolve2, reject2) {
                    try {
                        _this.db.execute(query);
                        resolve2();
                    }
                    catch (error) {
                        reject2(new Error("Could not execute query [" + query + "]"));
                    }
                });
            }))).then(function () {
                resolve();
                _this.db.execute("COMMIT");
            }).catch(function (error) {
                reject(error);
                _this.db.execute("ROLLBACK");
            });
        }).finally(function () { return _this.db.close(); });
    };
    /**
     * @description Execute a get request against the database.
     * @param {Object} filterObject
     * @param {string} filterObject.table - the name of the table
     * @param {string} [filterObject.fields] - the fields to get in return. Default is '*' (optional)
     * @param {string} [filterObject.where] - a SQLite where filter (optional)
     * @param {string} [filterObject.group] - a SQLite group by filter (optional)
     * @param {string} [filterObject.order] - a SQLite order by filter (optional)
     * @param {string} [filterObject.limit] - a SQLite limit filter (optional)
     * @returns {Promise}
     */
    jssql.prototype.get = function (obj) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var fields = obj.fields || '*';
            if (obj.join) {
                fields = obj.fields || obj.join + " .*";
            }
            var sql = "SELECT " + fields + " FROM " + obj.table;
            if (obj.where) {
                sql += " WHERE " + obj.where;
            }
            if (obj.group) {
                sql += " GROUP BY " + obj.group;
            }
            if (obj.order) {
                sql += " ORDER BY " + obj.order;
            }
            if (obj.limit) {
                sql += " LIMIT " + obj.limit;
            }
            _this.db = Titanium.Database.open(_this.dbname);
            try {
                var results = getResult(_this.db.execute(sql));
                resolve(results);
            }
            catch (error) {
                reject(error);
            }
        }).finally(function () { return _this.db.close(); });
    };
    /**
     * @description Simple getter for one entry only
     * @param {Object} getEntryObject object param's
     * @param {string} getEntryObject.table name of the table to open
     * @param {string} getEntryObject.id either the PK's value or combined with `field` the field's value
     * @param {string} [getEntryObject.field] value of the field filter (optional)
     * @param {string} [getEntryObject.where] define your own SQLite where value (optional)
     * @example //Fetch on entry by primary key. Does not require any specified id-column, as long as one column is primary key.
     * db.getOne({
     *  table: "table",
     *  id: "1",
     * }).then(function(entry){
     *  console.log(entry);
     * });
     * @example //Fetch on entry by optional field.
     * db.getOne({
     *  table: "table",
     *  id: "1",
     *  field: "category_id"
     * }).then(function(entry){
     *  console.log(entry);
     * });
     * @returns {Promise}
     */
    jssql.prototype.getOne = function (obj) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.db = Titanium.Database.open(_this.dbname);
            //This method get the PK's name
            var resultSet = _this.db.execute("PRAGMA TABLE_INFO(" + obj.table + ")");
            var pkColumn = "id";
            while (resultSet.isValidRow()) {
                if (resultSet.fieldByName("pk")) {
                    pkColumn = resultSet.fieldByName("name");
                }
                resultSet.next();
            }
            resultSet.close();
            var sql = "SELECT * FROM " + obj.table + " WHERE " + pkColumn + " = '" + obj.id + "' LIMIT 1";
            if (obj.field && obj.id) {
                sql = "SELECT * FROM " + obj.table + " WHERE " + obj.field + " = '" + obj.id + "' LIMIT 1";
            }
            if (obj.where && !obj.field && !obj.id) {
                sql = "SELECT * FROM " + obj.table + " WHERE " + obj.where + " LIMIT 1";
            }
            try {
                var result = getResult(_this.db.execute(sql));
                resolve(result[0]);
            }
            catch (error) {
                reject(error);
            }
        }).finally(function () { return _this.db.close(); });
    };
    /**
     * Update entry/entries. Using a alike approach as `getEntry`
     * @param {Object} updateObject
     * @param {string} updateObject.table the name of the table
     * @param {string} updateObject.id either the PK's value or combined with `field` the field's value
     * @param {string} [getEntryObject.field] value of the field filter (optional)
     * @param {string} [getEntryObject.where] define your own SQLite where value (optional)
     * @param {object} updateObject.update a key to value object. The key represent the field and value is the value that you want to update to
     * @example //Update a specific PK'd entry
     * db.update({
     *  table: 'table',
     *  id: '2',
     *  update: {
     *      translation: 'new value'
     *  }}).then(function(success){
     *      console.log("Updated", success);
     *  });
     * @returns {Promise} returns a integer of all the affected rows
     */
    jssql.prototype.update = function (obj) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var pkColumn = "id";
            _this.db = Titanium.Database.open(_this.dbname);
            //This method get the PK's name
            var resultSet = _this.db.execute("PRAGMA TABLE_INFO(" + obj.table + ")");
            while (resultSet.isValidRow()) {
                if (resultSet.fieldByName("pk")) {
                    pkColumn = resultSet.fieldByName("name");
                }
                resultSet.next();
            }
            resultSet.close();
            var keys = Object.keys(obj.update);
            var updates = keys.map(function (keyField) {
                return keyField + " = \"" + obj.update[keyField].trim().replace(/""([\s\S])|(")/g, '"$1$2') + "\"";
            }).join(", ");
            var sql = "UPDATE " + obj.table + " SET " + updates + " WHERE " + pkColumn + " = '" + obj.id + "'";
            if (obj.field && obj.id) {
                sql = "UPDATE " + obj.table + " SET " + updates + " WHERE " + obj.field + " = '" + obj.id + "'";
            }
            if (obj.where && !obj.field && !obj.id) {
                sql = "UPDATE " + obj.table + " SET " + updates + " WHERE " + obj.where;
            }
            try {
                _this.db.execute(sql);
                resolve(_this.db.rowsAffected);
            }
            catch (error) {
                reject(error);
            }
        }).finally(function () { return _this.db.close(); });
    };
    /**
     * @description Delete entry / entries.
     * @param {Object} deleteObject
     * @param {string} updateObject.table the name of the table
     * @param {string} updateObject.id either the PK's value or combined with `field` the field's value
     * @param {string} [getEntryObject.field] value of the field filter (optional)
     * @param {string} [getEntryObject.where] define your own SQLite where value (optional)
     * @example //Delete a specific PK
     * db.delete({
     *  table: 'table',
     *  id: '2',
     * });
     * @returns {Promise} returns a integer of all the affected rows
     */
    jssql.prototype.remove = function (obj) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var pkColumn = "id";
            _this.db = Titanium.Database.open(_this.dbname);
            //This method get the PK's name
            var resultSet = _this.db.execute("PRAGMA TABLE_INFO(" + obj.table + ")");
            while (resultSet.isValidRow()) {
                if (resultSet.fieldByName("pk")) {
                    pkColumn = resultSet.fieldByName("name");
                }
                resultSet.next();
            }
            resultSet.close();
            var sql = "DELETE FROM " + obj.table + " WHERE " + pkColumn + " = '" + obj.id + "'";
            if (obj.id && obj.field) {
                sql = "DELETE FROM " + obj.table + " WHERE " + obj.field + " = '" + obj.field + "'";
            }
            if (obj.where && !obj.field && !obj.id) {
                sql = "DELETE FROM " + obj.table + " WHERE " + obj.where;
            }
            try {
                _this.db.execute(sql);
                resolve(_this.db.rowsAffected);
            }
            catch (error) {
                reject(error);
            }
        }).finally(function () { return _this.db.close(); });
    };
    return jssql;
}());
exports.jssql = jssql;
function insertOrReplacePrepare(table, obj) {
    var keys = Object.keys(obj);
    var values = [];
    keys.forEach(function (item) {
        switch (typeof obj[item]) {
            case "string":
                values.push('"' + obj[item] + '"');
                break;
            case "number":
                values.push(obj[item]);
                break;
        }
    });
    return "INSERT OR REPLACE INTO " + table + " (" + keys.toString() + ") VALUES (" + values.toString() + ")";
}
function getResult(resultSet) {
    var result = {};
    var results = [];
    if (resultSet) {
        try {
            while (resultSet.isValidRow()) {
                result = {};
                var fieldCount = resultSet.fieldCount;
                for (var i = 0; i < fieldCount; i++) {
                    result[resultSet.fieldName(i)] = resultSet.field(i);
                }
                results.push(result);
                resultSet.next();
            }
            resultSet.close();
            return results;
        }
        catch (error) {
            throw error;
        }
    }
    else {
        throw new Error("Failed with resulting");
    }
}
