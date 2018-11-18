var AWS = require("aws-sdk");

// replace xx-xxxx-x with your AWS region code
AWS.config.update({
    region: "xx-xxxx-x",
});

const mastertable = process.env.server || 'connectiondetails_table'
const Logtable = process.env.server || 'logstaging_table'
const SPname = process.env.server || 'MSSQL_SPName'


// Start Lambda
exports.handler = function index(event, context, callback) {
    var docClient = new AWS.DynamoDB.DocumentClient();

//Declare variables
var DBServer;
var Database;
var TeamMember;
var SQLScript;
var Approver;
var Address

// get time stamp in format
var d = Date.now();
let TimeStamp_1 = new Date();
let dd = TimeStamp_1.getDate();
let mm = TimeStamp_1.getMonth();
let yyyy = TimeStamp_1.getFullYear();
let hh = TimeStamp_1.getHours();
let mmm = TimeStamp_1.getMinutes();
let sec = TimeStamp_1.getSeconds();
let millisec = TimeStamp_1.getSeconds();

if (dd < 10) {
    dd = '0' + dd;
}

if (mm < 10) {
    mm = '0' + mm;
}

TimeStamp_1 = yyyy + mm + dd + hh + mmm + sec+ millisec;
console.log("Time stamp ")
console.log(TimeStamp_1)
console.log(yyyy + mm + dd + hh + mmm + sec+ millisec)
var TodayDate = yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + mmm + ':' + sec;


    // assign all the parameters into variables
    DBServer = event.DBServer;
    Database = event.Database;
    TeamMember = event.TeamMember;
    SQLScript = event.SQLScript;
    Address =event.Address;

    var Uniqueid = DBServer +  TeamMember.substring(0, 1) + TeamMember.substring(TeamMember.indexOf(' ') + 2, TeamMember.indexOf(' ') + 1) + TimeStamp_1
    // console.log(Uniqueid);

    // call Dynamo DB and fetch the Approver result 
    var params = {
        TableName: mastertable,
        Key: {
            "ProjectName": DBServer,
        }
    };


    // Getting the approver result
    docClient.get(params, function(err, data) {
        if (err) {
            console.log(err);
        }
        else {
          // check if a TeamMember is a part of the request group.    
            if (data.Item.Entity.TeamMember.indexOf(TeamMember) > -1) {
               
        // put all the request into an variable
                var input = {
                    "Datafix_id": Uniqueid,
                    "DBServer": DBServer,
                    "DataBase": Database,
                    "TeamMember": TeamMember,
                    "TeamMemberAddress": Address,
                    "ApprovedBy":  data.Item.Entity.Approver,
                    "SQLScript": SQLScript,
                    "InsertedDate": TodayDate,
                    "IsExecuted": "0",
                    "ExecutedResult" : "No Result yet",
                    "Reviewer": "No Reviewer",
                    "Rejected": 0
                };
        // initiate loogger table 
                var params1 = {
                    TableName: Logtable,
                    Item: input

                };
            // push all the information into logger
                docClient.put(params1, function(err, data) {
                    if (err) { console.log(err) }
                    else {
                        console.log("Data logged successfully")
                        context.done(null, input)
                    }

                });


            
        }
        // if team member not in request group
        else 
        {
            console.log(TodayDate);
            console.log(TimeStamp_1);
            console.log(d);
            context.done(null, "You are not Authorized to do this Operation")}
    }
        
    });



};
