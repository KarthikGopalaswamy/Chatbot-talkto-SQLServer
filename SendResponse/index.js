var AWS = require("aws-sdk");
var request = require('request');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;

const mastertable = process.env.server || 'connectiondetails_table'
const Logtable = process.env.server || 'logstaging_table'
const SPname = process.env.server || 'MSSQL_SPName'

// replace xx-xxxx-x with your AWS region code
AWS.config.update({
    region: "xx-xxxx-x",
});

var docClient = new AWS.DynamoDB.DocumentClient();

//Declare variables

// Start Lambda
exports.ChatBotSync = function ChatBotSync(event, context, callback) {
    var datafixid;
    var response;
    var DataBase;
    var DBServer;
    var SQLScript;
    var ServerIP;
    var Username;
    var Password;
    var reviewer;

    datafixid = event.Datafixid;
    response = event.Response;
    reviewer = event.Reviewer;
    console.log();
    var params = {
        TableName: Logtable,
        Key: {
            "Datafix_id": datafixid,
        }
    };



    docClient.get(params, function (err, data1) {
        if (err) {
            console.log(err);
        }
        else {

            console.log(event.Response);
            if (event.Response == 2)
                context.done(null, data1.Item);
            else {

                let canApprove = data1.Item.ApprovedBy.filter(approver => approver.user.name === reviewer);

                if (canApprove.length > 0 && event.Response == 1) {
                    console.log("response is 1");

                    SyncData(data1);

                }

                else if (canApprove.length > 0 && event.Response == 0) {

                    console.log("This is rejected");
                    var params3 = {
                        TableName: Logtable,
                        Key: {
                            "Datafix_id": datafixid,
                        },
                        UpdateExpression: "SET  isRejected = :Rej, Reviewer = :R , IsExecuted = :Is  ",
                        ExpressionAttributeValues: {
                            ":Rej": 1,
                            ":R": reviewer,
                            ":Is": "0"
                        },
                        ReturnValues: "UPDATED_NEW"
                    };

                    console.log("the request has been rejected and updated back in table");
                    // docClient.update(params3, callback)
                    docClient.update(params3, function (err, data4) {
                        if (err) {
                            console.error("Unable to update item. Error JSON:");
                        }
                        else {
                            console.log("UpdateItem succeeded:");
                        }
                        context.done(null, data1.Item);
                    });


                }
                else
                    context.done(null, "Nice Try! You are not Authorized to do this operation");
            }
        }

    }

    );

    function SyncData(data) {
        DataBase = data.Item.DataBase;
        DBServer = data.Item.DBServer;
        SQLScript = data.Item.SQLScript;

        console.log("getting connection details");
        // console.log(data.Item.IsExecuted)
        if (data.Item.IsExecuted == "0" && response == "1" && data.Item.Rejected == 0) {
            var params1 = {
                TableName: mastertable,
                Key: {
                    "ProjectName": DBServer
                }
            };


            docClient.get(params1, function (err, data1) {
                if (err) { console.log(err) }
                else {

                    ServerIP = data1.Item.ServerIP;
                    Username = data1.Item.UserName,
                        Password = data1.Item.Password;

                    console.log(Password);
                    console.log(ServerIP);
                    console.log(Username);
                    console.log(DataBase);
                    console.log("approvers list");

                    GetchatBotconnectionDetails(ServerIP, Username, Password, DataBase, data);

                }
            });

        }
        else {
            context.done(null, "Either this is a rejected request or is already executed");



        }
    }

    console.log("connecting to server");

    function GetchatBotconnectionDetails(ServerIP, Username, Password, DataBase, data) {
        // DB connection starts here 
        const config = {
            "server": ServerIP,
            "userName": Username,
            "password": Password,
            "debug": true,
            "options": {
                "database": DataBase
            },
        };




        var connection = new Connection(config);

        connection.on('connect', function (err) {
            if (err) {
                console.log(err);
                callback(true);
            }
            else {
                console.log('connection successful!');
                FetchDetails(connection, data);
                console.log('SQL script to be executed : ');
                console.log(SQLScript);
                var SQLScript_Format = SQLScript.replace(/'/g, "''");
                console.log(SQLScript_Format);
            }
        });


    }
    console.log("connection for Dynamic SP starts here");

    function FetchDetails(connection, data) {
        console.log("New request function");
        var req = new Request(SPname,
            function (err) {
                if (err) {
                    console.log("some error in the procedure");
                    console.log(err);
                }
                console.log("closing connection");
                connection.close();
            });
        console.log("SQL executed here");
        req.addParameter('SQL', TYPES.VarChar, SQLScript);
        connection.callProcedure(req);
        req.on('row', function (columns) {

            columns.forEach(function (column) {

                console.log('results starts here ');
                console.log(datafixid);
                console.log(column.value);
                console.log('results end here 4');
                console.log(reviewer);

                var params2 = {
                    TableName: Logtable,
                    Key: {
                        "Datafix_id": datafixid,
                    },
                    UpdateExpression: "SET ExecutedResult = :E , Reviewer = :R , IsExecuted = :Is  ",
                    ExpressionAttributeValues: {
                        ":E": column.value,
                        ":R": reviewer,
                        ":Is": "1"
                    },
                    ReturnValues: "UPDATED_NEW"
                };
                console.log("result = 1 ");

                data.Item.ExecutedResult = column.value;

                console.log("going to Update ");
                docClient.update(params2, function (err, data2) {
                    if (err) {
                        console.error("Unable to update item. Error JSON:");
                    }
                    else {
                        console.log("UpdateItem succeeded:");


                    }
                    context.done(null, data.Item);

                });





            });

        });
    }

};
