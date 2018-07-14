# Global





* * *

## Class: jssql
A bluebird promise based database wrapper for Ti.Database API. Partly based on https://github.com/ricardoalcocer/jssql thanks for the idea!
JSSQL CommonJS module. Using bluebird promises.
Made by Max Allan Niklasson
Use it however you want, fork it and have fun.

### jssql.jssql(dbname, dbpath, remotebackup) 

Create a jssql instance.

**Parameters**

**dbname**: `string`, The name of the database

**dbpath**: `string`, Optional when installing a database

**remotebackup**: `boolean`, Optional


**Example**:
```js
//Init the jssql module
var DBH = require("jssql");
var db = new DBH.jssql("databasename");
```

### jssql.tableExists(tablename) 

Checks if a table exists

**Parameters**

**tablename**: `string`, Checks if a table exists

**Returns**: `Promise`

### jssql.createTable(tablename, columns) 

Create a table

**Parameters**

**tablename**: `string`, Create a table

**columns**: `Array`, Create a table

**Returns**: `Promise`

**Example**:
```js
//Example of creating a table
db.createTable('tablename', [
 {
     name: 'testId',
     type: 'INTEGER PRIMARY KEY'
 },{
     name 'testValue',
     type: 'TEXT'
 }]).then(function(success){
     console.log("Create table successfully");
 }).catch(function(error){
     console.log(error);
 }]);
```

### jssql.dropTable(tablename) 

Drop table speciefied by name

**Parameters**

**tablename**: `string`, Drop table speciefied by name

**Returns**: `Promise`

### jssql.addColumn(tablename, column, columnType) 

Add a column to a table.

**Parameters**

**tablename**: `string`, Name of the table to alter

**column**: `string`, Name of the new column

**columnType**: `string`, SQLite type for the new column

**Returns**: `Promise`

### jssql.insertOrReplace(table, obj) 

Insert or replace data

**Parameters**

**table**: `string`, Insert or replace data

**obj**: `Array`, Insert or replace data

**Returns**: `Promise`

### jssql.exec(sql) 

Execute one or multiple queries.

**Parameters**

**sql**: `string | Array`, Execute one or multiple queries.

**Returns**: `Promise`

### jssql.get(filterObject) 

Execute a get request against the database.

**Parameters**

**filterObject**: `Object`, Execute a get request against the database.

 - **filterObject.table**: `string`, the name of the table

 - **filterObject.fields**: `string`, the fields to get in return. Default is '*' (optional)

 - **filterObject.where**: `string`, a SQLite where filter (optional)

 - **filterObject.group**: `string`, a SQLite group by filter (optional)

 - **filterObject.order**: `string`, a SQLite order by filter (optional)

 - **filterObject.limit**: `string`, a SQLite limit filter (optional)

**Returns**: `Promise`

### jssql.getOne(getEntryObject) 

Simple getter for one entry only

**Parameters**

**getEntryObject**: `Object`, object param's

 - **getEntryObject.table**: `string`, name of the table to open

 - **getEntryObject.id**: `string`, either the PK's value or combined with `field` the field's value

 - **getEntryObject.field**: `string`, value of the field filter (optional)

 - **getEntryObject.where**: `string`, define your own SQLite where value (optional)

**Returns**: `Promise`

**Example**:
```js
//Fetch on entry by primary key. Does not require any specified id-column, as long as one column is primary key.
db.getOne({
 table: "table",
 id: "1",
}).then(function(entry){
 console.log(entry);
});,//Fetch on entry by optional field.
db.getOne({
 table: "table",
 id: "1",
 field: "category_id"
}).then(function(entry){
 console.log(entry);
});
```

**Example**:
```js
//Fetch on entry by primary key. Does not require any specified id-column, as long as one column is primary key.
db.getOne({
 table: "table",
 id: "1",
}).then(function(entry){
 console.log(entry);
});,//Fetch on entry by optional field.
db.getOne({
 table: "table",
 id: "1",
 field: "category_id"
}).then(function(entry){
 console.log(entry);
});
```

### jssql.update(updateObject) 

Update entry/entries. Using a alike approach as `getEntry`

**Parameters**

**updateObject**: `Object`, Update entry/entries. Using a alike approach as `getEntry`

 - **updateObject.table**: `string`, the name of the table

 - **updateObject.id**: `string`, either the PK's value or combined with `field` the field's value

 - **getEntryObject.field**: `string`, value of the field filter (optional)

 - **getEntryObject.where**: `string`, define your own SQLite where value (optional)

 - **updateObject.update**: `object`, a key to value object. The key represent the field and value is the value that you want to update to

**Returns**: `Promise`, returns a integer of all the affected rows

**Example**:
```js
//Update a specific PK'd entry
db.update({
 table: 'table',
 id: '2',
 update: {
     translation: 'new value'
 }}).then(function(success){
     console.log("Updated", success);
 });
```

### jssql.remove(deleteObject) 

Delete entry / entries.

**Parameters**

**deleteObject**: `Object`, Delete entry / entries.

 - **updateObject.table**: `string`, the name of the table

 - **updateObject.id**: `string`, either the PK's value or combined with `field` the field's value

 - **getEntryObject.field**: `string`, value of the field filter (optional)

 - **getEntryObject.where**: `string`, define your own SQLite where value (optional)

**Returns**: `Promise`, returns a integer of all the affected rows

**Example**:
```js
//Delete a specific PK
db.delete({
 table: 'table',
 id: '2',
});
```



* * *










