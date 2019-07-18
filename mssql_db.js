/**
 * 2017 
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var mssql = require("mssql");
var async = require("async");
/*
//Initiallising connection string
var dbConfig = {
	server: '127.0.0.1',
    user:  'sa',
    password: '',    
    database: 'stage',
    port: '1533'
};
//Function to connect to database and execute query
var  executeQuery = function(res, query){             
     mssql.connect(dbConfig, function (err) {
			if (err) {   
				console.log("Error while connecting database :- " + err);
				res.send(err);
			}
			else {
			   // create Request object
				var request = new mssql.Request();
			  // query to the database
				request.query(query, function (err, res) {
					if (err) {
						console.log("Error while querying database :- " + err);
						res.send(err);
					}
					else {
						console.log(res);
					}
				});
            }
      });           
}
*/
// initialize w/ default settings
var msSqlSettings = {
  server      : '127.0.0.1',
  port        : '9200',
  user        : '9200',
  password    : '9200',
  database    : 'ueberes'
};
var clientCon;
exports.database = function(settings)
{
  this.db = null;
  this.settings = settings || {};  
  this.replaceVALs = new Array();  
  // update settings if they were provided
  if(this.settings.server) {
    msSqlSettings.server = this.settings.server;
  }
  if(this.settings.port) {
    msSqlSettings.port = this.settings.port;
  }
  if(this.settings.user) {
    msSqlSettings.user = this.settings.user;
  }
  if(this.settings.password) {
    msSqlSettings.password = this.settings.password;
  }
  if(this.settings.database) {
    msSqlSettings.database = this.settings.database;
  }
  //console.info("MsSql DB will be used with these settings: " + JSON.stringify(msSqlSettings));  
}
exports.database.prototype.init = function(callback) {
	mssql.connect(msSqlSettings, function (err) { 
		 if (err) {
			callback(err);
		 }
		 // create Request object
		 var request = new mssql.Request();		 
		 // query to the database and get the data
		 var self = this;
		 var sqlCreate = "if not exists (select * from sysobjects where name='etherpad_store' " +
                  " and xtype='U') " +
                  " CREATE TABLE [dbo].[etherpad_store]( " +
                  " [key] [varchar](100) NOT NULL, " +
                  " [value] [nvarchar](max) NOT NULL, " +
                  " [userId] [nvarchar](max) NULL, " +
                  " [title] [nvarchar](max) NULL, " +
                  " [createdon] [datetime] NOT NULL DEFAULT GETDATE(), " +
                  " [Status] [int] NOT NULL DEFAULT 0 , " +
                  " CONSTRAINT [PK_store] PRIMARY KEY CLUSTERED ( " +
                  " [key] ASC " +
                  " )WITH (PAD_INDEX  = OFF, " +
                  " STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, " +
                  " ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) " +
                  " ON [PRIMARY]  " +
                  " ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]  " +
                  " ";
		// console.log(sqlCreate);
		 request.query(sqlCreate, function (err, recordset) {
			 if(err){
				throw err;
			 }else{ 
				 // send data as a response
				//console.log(recordset);				
				callback();
			 }				 
		});
	});
};
exports.database.prototype.findKeys = function (key, notKey, callback)
{
  var params=[];
  //desired keys are key, e.g. pad:%
  key=key.replace(/\*/g,'%');
  params.push(key);
  var query="SELECT [key] FROM [dbo].[etherpad_store] WHERE  [key] LIKE "+escape(key);
  if(notKey!=null && notKey != undefined){
    //not desired keys are notKey, e.g. %:%:%
    notKey=notKey.replace(/\*/g,'%');
    query+=" AND [key] NOT LIKE "+escape(notKey);
    params.push(notKey);
  }
  //console.log(query);
  var request = new mssql.Request();	
  request.query(query, function (err, results) {
	  var value = [];
		if(err){
			callback(err,value);
		}		
		if(results.rowsAffected !=0)
		{
				//console.log(results.recordset);
				for(var pad in results.recordset)
				{
						value.push(results.recordset[pad].key);
						//console.log(results.recordset[pad].key);
				}		
		}		
		callback(err,value);			 
	});
  //console.log(params);
}
exports.database.prototype.get = function (key, callback)
{
	var getQuery = "SELECT value FROM [dbo].[etherpad_store] WHERE  [key] = '"+ [key] + "'" ;
	//console.log(getQuery);
	var request = new mssql.Request();		 
	// query to the database and get the data
	request.query(getQuery, function (err, results) {
		var value = null;	
		if(err){
			callback(err,value);
		}
		if(results!=null && results != undefined){		
			if(results.rowsAffected !=0)
			{
				value = results.recordset[0].value;
			}
		}	
		/*	
		if(results.rowsAffected !=0)
		{
			value = results.recordset[0].value;
		}
		*/
		callback(err,value);			 
	});
	/*
  this.db.get("SELECT value FROM store WHERE key = ?", key, function(err,row)
  {
    callback(err,row ? row.value : null);
  });*/
}
exports.database.prototype.set = function (key, value, callback)
{	
  var request = new mssql.Request();	
  if(key.length > 100)
  {
    callback("Your Key can only be 100 chars");
  }
  else
  {	  
	var tmpData = new Array();
	tmpData[0] = key;
	tmpData[1] = value;			
	var chkU =  checkRecods(tmpData,function ( resp) {
		if(resp.rowsAffected==0){
			//console.log('Inseryt ');
			//console.log("Inseryt Value = "+resp.newvalue+"key = "+resp.newkey+"\n\n");				
			var insertQuery = " Insert into [dbo].[etherpad_store] ([key],[value],[userId]) Values ("+escape(resp.newkey)+", "+escape(resp.newvalue)+", '3')";
			request.query(insertQuery, function (err, results) {
				if(err){
					throw err;
				}
			},callback);			
		}
		else
		{
			//console.log('Update ');
			//console.log("Update Value = "+resp.newvalue+"key = "+resp.newkey+"\n\n");
			var updateQuery = " Update [dbo].[etherpad_store] set [value] = "+escape(resp.newvalue)+" Where [key]= "+escape(resp.newkey)+" ;";
			request.query(updateQuery, function (err, results) {
				if(err){
					throw err;
				}
			},callback);
		}
	});	  
  }  
}
exports.database.prototype.doBulk = function (bulk, callback)
{ 
	var _this = this;
	var self = this;
	/*
	self.get("pad:home", function(err, level){
      if(err){
		  throw err;
      }
	  console.log('pad:home'+level);
	});
	*/
	var sql = "BEGIN TRANSACTION;\n";
	var sql2 ='';
	var request = new mssql.Request();
	var nUserId = 0;
	for(var i in bulk)
	{
		if(bulk[i].type == "set")
		{
			var tmpData = new Array();
			tmpData[0] = bulk[i].key;
			tmpData[1] = bulk[i].value;
			var chkU =  checkRecods(tmpData,function ( resp) {
				if(resp.rowsAffected==0){
					//console.log('Inseryt ');					
					//console.log("Inseryt Value = "+resp.newvalue+"key = "+resp.newkey+"\n\n");
					if(resp.newkey.indexOf('pad:') != -1){						
						var h = resp.newkey.replace("pad:", "");
						h = h.split('_');
						console.log('++'+resp.newkey + '---'+h[0]);
						if(h[1]){
							nUserId =  parseInt(h[0]) || 0;
						}
					}
					var insertQuery = " Insert into [dbo].[etherpad_store] ([key],[value],[userId]) Values ("+escape(resp.newkey)+", "+escape(resp.newvalue)+", '"+nUserId+"')";
					request.query(insertQuery, function (err, results) {
						if(err){
							throw err;
						}
					},callback);	
				}
				else
				{
					//console.log('Update ');
					//console.log("Update Value = "+resp.newvalue+"key = "+resp.newkey+"\n\n");
					var updateQuery = " Update [dbo].[etherpad_store] set [value] = "+escape(resp.newvalue)+" Where [key]= "+escape(resp.newkey)+" ;";
					request.query(updateQuery, function (err, results) {
						if(err){
							throw err;
						}
					},callback);
				}
			});
			//console.log(chkU);			
		}
		else if(bulk[i].type == "remove")
		{
			var deleteQuery = "DELETE FROM [dbo].[etherpad_store] WHERE key = " + escape(resp.newkey) + ";";
		  	request.query(deleteQuery, function (err, recordsets) {
				if(err){
					throw err;
				}
				else
				{
						//callback(err);
				}
			});
		}
		//callback();
	}
	callback();	
}
function checkRecods(req,callback)
{
	//console.log(req[0]+'---'+req[1]);
	var checkRecordExists = "SELECT * FROM [etherpad_store] WHERE [key] = '"+req[0]+"'";
	var request = new mssql.Request();	 
	request.query(checkRecordExists, function (err, rows) {		
		if(err){
			throw err;
		}
		rows.newkey = req[0];
		rows.newvalue = req[1];
		//console.log(rows);		
		callback(rows);
	});
}
function escape (val) 
{
  return "'"+val.replace(/'/g, "''")+"'";
};