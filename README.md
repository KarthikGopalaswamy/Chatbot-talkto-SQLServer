# Chatbot-talkto-SQLServer
Create an Chatbot to talk to SQL server using AWS lambda service for DDL and DML operations 

This is a chatbot in azure framework for Microsoft teams communicator talks to your local sql server using AWS lambda service and send any DDL and DML script directly. 

so this is how it works in detail : 
> as a set up: create items in master table with connection details and add who can access this Bot (apart from you who else can access) and add the authorizer (as an Approver as a final authority) 
>add this chat bot to your teams profile. 
> start talking to chat bot the usual way and it will ask you which database , environment to connect to. (this is configured in master table)
>it will ask for SQL script and a final confirmation to send this request to an approver. 
>this will be sent to approver and authentication and he\she can either approve or reject it. 
>once arrpoved, the script from the bot will be sent to SQL server , executed through Dynamic SP and later return back with the result to both Approver('s) , requestor . 
> AWS lambda will act as an agent between the bot framework and sql server . 
