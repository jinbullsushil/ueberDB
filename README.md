#About

ueberDB Using with MsSQL (Microsoft SQL Server)

#Database Support
* MsSQL


#Install

`npm install ueberDB`

#Example

```javascript
var ueberDB = require("ueberDB");

//mssql
var db = new ueberDB.database("mssql", {"user":"root", host: "localhost", "password":"", database: "store"});
//initialize the database
db.init(function (err)
{
  if(err)
  {
    console.error(err);
    process.exit(1);
  }

  //set a object as a value
  //can be done without a callback, cause the value is immediately in the buffer
  db.set("valueA", {a:1,b:2});

  //get the object
  db.get("valueA", function(err, value){
    console.log(value);

    db.close(function(){
      process.exit(0);
    });
  });
});
```

#License
[Apache License v2](http://www.apache.org/licenses/LICENSE-2.0.html)
