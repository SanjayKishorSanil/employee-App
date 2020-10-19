const express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const Employee = mongoose.model('Employee');
const employee = require('../models/employeeModel');
const Manager = require('../models/managerModel');
const Task = require('../models/taskModel');
const offDays = require('../models/offDaysModel');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
 
router.get('/login',(req,res)=>{
    res.render('employee/login',{
        message :'LOGIN PAGE'
    });
    
})

router.get('/logout', auth, async(req,res)=>{
    try{
        req.employee.tokens = req.employee.tokens.filter((token)=>{
            return token.token !== req.token;
        });
        await req.employee.save();
        res.render('employee/login',{
            message : 'LOGIN PAGE'
        });
    }catch(e){
        res.render('employee/404Page',{
            message : 'Enable to Logout',
            url : '/employee/login'
        });

    }
})

router.post('/login',async(req,res) =>{
    try{
       
       const emp = await Employee.findOne({email:req.body.email});
        if(!emp){
           
          return res.send('Invalid credentials');
        }
        const token = await emp.generateAuthToken();
        const isMatch = await bcrypt.compare(req.body.password,emp.password);
        

        if(!isMatch){
           return res.render('employee/404Page',{
            message : 'Invalid Credentials',
            url : '/employee/login'
        });
        }
        if(emp.jobRole === 'Manager'){
           res.cookie("jwt", token, { httpOnly: true});
            res.render("layouts/dashboardManager", {
                message : 'Sucessfully Logged In',
                emp,
                token
            });   

        }else{
           res.cookie("jwt", token, { httpOnly: true});
            res.render("layouts/dashboard", {
                message : 'Sucessfully Logged In',
                emp,
                token
            });
        }

    }catch(e){
        res.render('employee/404Page',{
            message : 'Error in login route',
            url : '/employee/login'
        });
    }
})

router.get('/', (req, res) => {
    
    res.render('employee/login',{
        message :'LOGIN PAGE'
    });
});

router.get('/createUser',async(req,res)=>{
    res.render("employee/addOrEdit", {
        viewTitle : "Insert Employee"
    });
});

router.post('/', (req, res) => {
    if (req.body._id == '')
        insertRecord(req, res);
        else
        updateRecord(req, res);
});

 insertRecord = async(req, res) =>{

    if(req.body.jobRole != 'Manager'){
        
        var employee = new Employee();
        employee.fullName = req.body.fullName;
        employee.email = req.body.email;
        employee.mobile = req.body.mobile;
        employee.city = req.body.city;
        employee.jobRole = req.body.jobRole;
        employee.salary = req.body.salary;
        employee.password = req.body.password;
        employee.save(async(err, doc) => {
            if (!err)
                res.redirect('employee/login');
            else {
                if (err.name == 'ValidationError') {
                    handleValidationError(err, req.body);
                    res.render("employee/addOrEdit", {
                        viewTitle : "Insert Employee",
                        employee : req.body
                    });
                }
                else{
                    res.render('employee/404Page',{
                        message : 'Error in insertion record',
                        url : '/employee/login'
                    });
                }
            }
        });
       
    }else{
        var employee = new Employee();
        employee.fullName = req.body.fullName;
        employee.email = req.body.email;
        employee.mobile = req.body.mobile;
        employee.city = req.body.city;
        employee.jobRole = req.body.jobRole;
        employee.salary = req.body.salary;
        employee.password = req.body.password;
        employee.save(async(err, doc) => {
            if (!err){
               res.redirect('employee/login');

            }else {
                if (err.name == 'ValidationError') {
                    handleValidationError(err, req.body);
                    res.render("employee/addOrEdit", {
                        viewTitle : "Insert Employee",
                        employee : req.body
                    });
                }
                else{
                    res.render('employee/404Page',{
                        message : 'Enable to insert record',
                        url : '/employee/login'
                    });
                }
            }
        });
    }
  
}


function updateRecord(req, res) {
    Employee.findOneAndUpdate({ _id: req.body._id }, req.body, { new: true }, (err, doc) => {
        if (!err) { 
          if(req.body.jobRole==='Manager'){
            res.render("layouts/dashboardManager", {
                message : 'Sucessfully updated',
                emp : req.body
            }); 
          }else{
            res.render("layouts/dashboard", {
                message : 'Sucessfully updated',
                emp : req.body
            }); 

          }
 
         }else {
            if (err.name == 'ValidationError') {
                handleValidationError(err, req.body);
                res.render("employee/addOrEdit", {
                    viewTitle : 'Update Employee',
                    employee : req.body
                });
            }
            else{
                res.render('employee/404Page',{
                    message : 'Error in Updating Record',
                    url : '/employee/login'
                });
            }
        }
    });
}

router.get('/listForManager/:id',auth,(req,res)=>{
        Employee.find((err,docs)=>{
            const mId = req.params.id;
                    if(!err){
                        const doc = docs.filter(emp=> emp.jobRole != 'Manager')
                        res.render("employee/listForManager", {
                            list : doc,
                            managerId : mId
                        });
    
                    }else{
                        res.render('employee/404Page',{
                            message :'Error in Listing Reportee for Manager',
                            url :'/employee/login'
                        });
                    }
               });
});

router.get('/updateRemark/:tid&:mid',auth, async(req,res)=>{
    const tId = req.params.tid;
    const mId = req.params.mid;
    res.render('employee/updateRemark',{
        m_id : mId,
        t_id : tId
    });


})

router.post('/setRemark',auth, async(req,res)=>{
    const t_id = req.body.taskId;
    const m_id = req.body.managerId;
    Employee.find(async(err,docs)=>{
        
         docs.forEach(async doc=>{
            
            doc.tasks.forEach(async t=>{

               if(t._id.toString() === t_id && t.managerID.toString() === m_id) {
                   t.remark = req.body.remark;
                   await doc.save();

               }
            });
             
         });
         res.render("employee/sucessRemark",{
            mid : m_id
        });
     });


})

router.get('/listStatus/:id',auth,async (req,res)=>{
    const employeeList = [];
    const taskList = [];
    const m_id = req.params.id;
    let m = await Task.find({managerId:m_id});
    for(const mng of m){
        let a = await Employee.findOne({_id:mng.employeeId});
        employeeList.push(a);
    }
    employeeList.forEach( doc=>{
        doc.tasks.forEach(t=>{
            if(t.managerID.toString() === m_id){
                taskList.push(t);
            }
        });
    });

    res.render('employee/taskStatusDisplay',{
        list : taskList

    });
})

router.get('/addTask/:mId&:eId',auth,async(req,res)=>{
    const m_id = req.params.mId;
    const e_id = req.params.eId;

    res.render("employee/assignTask",{
        managerId : m_id,
        employeeId : e_id
    });
})

router.post('/assignTask',auth, async(req,res)=>{

    const m_id = req.body.managerId;
    const e_id = req.body.employeeId;
    var task = new Task();
    task.managerId = req.body.managerId;
    task.employeeId = req.body.employeeId;
    task.task = req.body.task;
    Employee.findById(e_id,async(err,employee)=>{
        employee.tasks=employee.tasks.concat({ managerID : req.body.managerId, taskGiven:req.body.task});
        await employee.save();
    });
    
    await task.save((err,doc) => {
        if(!err){
            console.log('Sucessfully added')
            res.render('employee/assignTaskSucessPage',{
                mid : m_id
            });           
        }else{
            res.render('employee/404Page',{
                message : 'Error occured while assigning task',
                url : '/employee/login'
            });
        }
    });

})

router.get('/addReportee/:mId&:eId',auth,async(req,res)=>{
    
    const m_id = req.params.mId;
    const e_id = req.params.eId;
    const reporteeList = [];
    const manager = new Manager();
    let m = await Manager.findOne({managerId:m_id});
    if(m === null){
        manager.managerId = m_id;
        manager.reportees = manager.reportees.concat({reportee:e_id});
        await manager.save();
    }else{
        m.reportees = m.reportees.concat({reportee:e_id});
        await m.save();
    }
    res.render('employee/addReporteeSucessPage',{
        mid : m_id
    });

})

router.get('/viewReportees/:id',auth,async (req,res)=>{
    const m_id = req.params.id;
    const reporteeList = [];
    let m = await Manager.findOne({managerId:m_id});
    for(const mng of m.reportees){
        let a = await Employee.findOne({_id:mng.reportee});
        reporteeList.push(a);
    }
    res.render("employee/reporteeList", {
        managerId : m_id,
            list : reporteeList
    });


})

router.get('/employeeViewTask/:id',auth,async (req,res)=>{
    const e_id = req.params.id;
    Employee.findById(e_id,async(err,doc)=>{
        if(!err){
            const t = doc.tasks
            res.render('employee/viewTask',{
                list : t,
                eid : e_id
            });
        }else{
            res.render('employee/404Page',{
                message:'Error in Task Viewing',
                url:'/employee/login'
            });
        }
        
    });
})

router.get('/applyLeave/:id', auth,async (req,res)=>{
    const e_id = req.params.id;
    res.render('employee/applyLeave',{
        eid : e_id
    });
})

router.post('/postLeave',auth, async(req,res)=>{
    var leave= new offDays();
    leave.employeeId = req.body.employeeId;
    leave.fromDate = req.body.fromdate;
    leave.toDate = req.body.todate;
    leave.reason = req.body.reason;
    leave.noOfDays = req.body.noofdays;
    await leave.save();
    Employee.findOne({_id:req.body.employeeId}, async(err,doc)=>{
        if(!err){
            res.render("layouts/dashboard", {
                message:'Sucessfully Applied Leave',
                emp:doc
            }); 
        }else{
               res.render('employee/404Page',{
                message:'Cannot Apply for Leave',
                url:'/employee/login'
            });
        }

    });

})

router.get('/checkLeaveStatus/:id',auth, async(req,res)=>{
    const e_id = req.params.id;
    leaveList = [];
    let e = await offDays.find({employeeId:e_id});
    for(const emp of e){
        leaveList.push(emp);
    }
    res.render('employee/listLeaveStatus',{
        list : leaveList,
        eid : e_id
    });
})

router.get('/updateLeaveStatus/:mid&:eid',auth,async(req,res)=>{
    const m_id = req.params.mid;
    const e_id = req.params.eid;
    var leaveList = [];
    let e = await offDays.find({employeeId:e_id});
    for(const emp of e){
        leaveList.push(emp);
    }
    res.render('employee/setLeaveStatus',{
        mid : m_id,
        eid : e_id,
        list : leaveList
    });
})

router.post('/setLeaveStatus',auth, async(req,res)=>{
    let e = await offDays.find({employeeId:req.body.employeeId});
    for(const emp of e){
        emp.status = req.body.Status;
        emp.managerId = req.body.managerId;
        await emp.save();
        res.render('employee/sucessLeaveStatus',{
            mid : req.body.managerId
        });
    }
})

router.get('/updateStatus/:eid&:mid',auth,async (req,res)=>{
    const eid = req.params.eid;
    const mid = req.params.mid;
    res.render('employee/updateTaskStatus',{
        e_id : eid,
        m_id : mid

    });
    
})

router.post('/setStatus',auth, async (req,res)=>{
    var task = new Task();
    const m_id = req.body.managerId;
    const e_id = req.body.employeeId;
    Task.findOne({managerId:m_id,employeeId:e_id},async(err,doc)=>{
        doc.status = req.body.status;
        await doc.save();
    });
    Employee.findOne({_id:e_id}, async(err,doc)=>{
        for(m of doc.tasks){
            m.status = req.body.status;
            await doc.save();
        }
    });

    res.render('employee/sucessPage',{
        eid : e_id
    });
})

router.get('/list', (req, res) => {
    Employee.find((err, docs) => {
        if (!err) {
            res.render("employee/list", {
                list : docs
            });
        }
        else {
            res.render('employee/404Page',{
                message : 'Error in retriving employee list !',
                url : '/employee/login'
            });
        }
    });
});

function handleValidationError(err, body) {
    for (field in err.errors) {
        switch (err.errors[field].path) {
            case 'fullName':
                body['fullNameError'] = err.errors[field].message;
                break;
            case 'email':
                body['emailError'] = err.errors[field].message;
                break;
            case 'mobile':
                body['mobileError'] = err.errors[field].message;
                break;
            default:
                break;
        }
    }
}

router.get('/:id',auth, (req, res) => {
    Employee.findById(req.params.id, (err, doc) => {
        if (!err) {
            res.render("employee/addOrEdit", {
                viewTitle : "Update Employee",
                employee : doc
            });
        }else{
            res.render('employee/404Page',{
                message : 'Error in fetching user id',
                url : '/employee/login'
            })
        }
    });
});

router.get('/delete/:id',auth, (req, res) => {
    Employee.findByIdAndRemove(req.params.id, (err, doc) => {
        if (!err) {
            res.redirect('/employee/list');
        }
        else { 
            res.render('employee/404Page',{
                message : 'Cannot delete employee ERROR!!!',
                url : '/employee/login'
            });
         }
    });
});

router.get('/deleteLeave/:id',auth, async(req,res)=>{
    offDays.findByIdAndRemove(req.params.id,async(err,doc)=>{
        if(!err){
    const e_id = req.params.id;
    leaveList = [];
    let e = await offDays.find({employeeId:e_id});
    for(const emp of e){
        leaveList.push(emp);
    }
    res.render('employee/listLeaveStatus',{
        list : leaveList,
        eid : e_id
    });
        }else{
            res.render('employee/404Page',{
                message : 'Error in Deleting Leave',
                url : '/employee/login'
            });
        }
    });
})

module.exports = router;