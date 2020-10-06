1.npm install
2. run mongodb 
3. nodemon server.js
4. -> To run intial route http://localhost:3000/employee/login
    Press create new Button to create an account : conditions{
    if employee account mention any job role name in job role field 
    else if account is manager type 'Manager' in the job role field
  -> In Manager Dashboard options:
        -> View Employee for viewing all the employee and add them as reportee as wells assign task
                  -> Inside View Employee Deletion of employee record ,editing employee profile and add reportee functions
        ->Check Task Status for checking status of task assigned by logged in manager
        ->Edit Profile to edit profile of currently logged in Manager
  ->In Employee Dashboard options:
        -> View Task is used to see task to given by various manager to logged in employee 
        ->Edit Profile to edit profile of currently logged in Employee

