const express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const Employee = mongoose.model('Employee');
const employee=require('../models/employeeModel')
const Manager=require('../models/managerModel')
const Task=require('../models/taskModel')
const offDays= require('../models/offDaysModel')
const bcrypt=require('bcryptjs')
const auth=require('../middleware/auth')
const jwt=require('jsonwebtoken')

router.get('/login',(req,res)=>{
    res.render('employee/login',{
        message:'LOGIN PAGE'
    })
    
})
router.get('/logout', auth,async(req,res)=>{
    try{
        console.log('Entered logout')
        req.employee.tokens=req.employee.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.employee.save()
        res.render('employee/login',{
            message:'LOGIN PAGE'
        })
    }catch(e){
        res.status(500).send(e)

    }
})
router.post('/login',async(req,res) =>{
    try{
       
       const emp= await Employee.findOne({email:req.body.email})
        if(!emp){
           
          return res.send('Invalid credentials')
        }
        const token= await emp.generateAuthToken()
        const isMatch = await bcrypt.compare(req.body.password,emp.password)
        

        if(!isMatch){
           return res.send('Invalid credentials')
        }
        if(emp.jobRole === 'Manager'){
           // res.setHeader('Authorization','Bearer '+token)
           res.cookie("jwt", token, { httpOnly: true})
            res.render("layouts/dashboardManager", {
                message:'Sucessfully Logged In',
                emp,
                token
            });   

        }else{
           // res.setHeader('Authorization','Bearer '+token)
           res.cookie("jwt", token, { httpOnly: true})
            res.render("layouts/dashboard", {
                message:'Sucessfully Logged In',
                emp,
                token
            });
        }

    }catch(e){
        res.status(400).send(e)
    }
})


router.get('/', (req, res) => {
    res.render("employee/addOrEdit", {
        viewTitle: "Insert Employee"
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
        employee.jobRole=req.body.jobRole;
        employee.salary=req.body.salary;
        employee.password=req.body.password;
        employee.save(async(err, doc) => {
            if (!err)
                res.redirect('employee/login');
            else {
                if (err.name == 'ValidationError') {
                    handleValidationError(err, req.body);
                    res.render("employee/addOrEdit", {
                        viewTitle: "Insert Employee",
                        employee: req.body
                    });
                }
                else
                    console.log('Error during record insertion : ' + err);
            }
        });
       
    }else{
        var employee = new Employee();
        employee.fullName = req.body.fullName;
        employee.email = req.body.email;
        employee.mobile = req.body.mobile;
        employee.city = req.body.city;
        employee.jobRole=req.body.jobRole;
        employee.salary=req.body.salary;
        employee.password=req.body.password;
        employee.save(async(err, doc) => {
            if (!err){
               res.redirect('employee/login')
            }
            else {
                if (err.name == 'ValidationError') {
                    handleValidationError(err, req.body);
                    res.render("employee/addOrEdit", {
                        viewTitle: "Insert Employee",
                        employee: req.body
                    });
                }
                else
                    console.log('Error during record insertion : ' + err);
            }
        });
    }
  
}


function updateRecord(req, res) {
    Employee.findOneAndUpdate({ _id: req.body._id }, req.body, { new: true }, (err, doc) => {
        if (!err) { 
          //  res.redirect('employee/list');
          if(req.body.jobRole==='Manager'){
            res.render("layouts/dashboardManager", {
                message:'Sucessfully updated',
                emp:req.body
            }); 
          }else{
            res.render("layouts/dashboard", {
                message:'Sucessfully updated',
                emp:req.body
            }); 

          }
 
         }
        else {
            if (err.name == 'ValidationError') {
                handleValidationError(err, req.body);
                res.render("employee/addOrEdit", {
                    viewTitle: 'Update Employee',
                    employee: req.body
                });
            }
            else
                console.log('Error during record update : ' + err);
        }
    });
}


router.get('/listForManager/:id',auth,(req,res)=>{
        Employee.find((err,docs)=>{
            const m_id=req.params.id

                    if(!err){
                        const doc = docs.filter(emp=> emp.jobRole != 'Manager')
                       // console.log(doc)
                       //res.setHeader('Authorization','Bearer '+token)
                        res.render("employee/listForManager", {
                            list: doc,
                            managerId: m_id
                        });
    
                    }else{
                        res.send('ERROR OCCURED IN FUNCTION')
                    }

               })

})
router.get('/updateRemark/:tid&:mid',auth, async(req,res)=>{
    const tid=req.params.tid
    const mid=req.params.mid
    res.render('employee/updateRemark',{
        m_id:mid,
        t_id:tid
    })


})
router.post('/setRemark',auth, async(req,res)=>{
    const t_id=req.body.taskId
    const m_id=req.body.managerId
    //console.log(t_id,m_id)

    Employee.find(async(err,docs)=>{
        // console.log('docds',docs)
         docs.forEach(async doc=>{
            // console.log('docds',doc)
            //console.log('Task',doc.tasks)
            doc.tasks.forEach(async t=>{
              //  console.log('t',typeof t.managerID)
               if(t._id.toString()===t_id && t.managerID.toString()===m_id){
                   t.remark=req.body.remark
                   await doc.save()

               }
            })
             
         })
         res.render("employee/sucessRemark",{
            mid:m_id
        })
     })


})
router.get('/listStatus/:id',auth,async (req,res)=>{
    const employeeList=[]
    const taskList=[]
    const m_id=req.params.id
    var count=0
    //console.log(m_id)
    let m= await Task.find({managerId:m_id})
    for(const mng of m){
        let a= await Employee.findOne({_id:mng.employeeId})
        employeeList.push(a)
    }
    //console.log('employeeList',employeeList)
    employeeList.forEach( doc=>{
       //console.log('count doc')
        doc.tasks.forEach(t=>{
            if(t.managerID.toString() ===m_id){
                taskList.push(t)
            }
        })
    })

    console.log('tasklist',taskList)
    res.render('employee/taskStatusDisplay',{
        list:taskList

    })
})
router.get('/addTask/:mId&:eId',auth,async(req,res)=>{
    const m_id=req.params.mId
    const e_id=req.params.eId

    res.render("employee/assignTask",{
        managerId:m_id,
        employeeId:e_id
    })
})

router.post('/assignTask',auth, async(req,res)=>{
    console.log(req.body)
    const m_id=req.body.managerId
    const e_id=req.body.employeeId
    var task = new Task()
    task.managerId=req.body.managerId
    task.employeeId=req.body.employeeId
    task.task=req.body.task
    Employee.findById(e_id,async(err,employee)=>{
        employee.tasks=employee.tasks.concat({ managerID : req.body.managerId, taskGiven:req.body.task})
        await employee.save()
    })
    
    await task.save((err,doc)=>{
        if(!err){
            console.log('Sucessfully added')
            res.render('employee/assignTaskSucessPage',{
                mid:m_id
            })

            
          
        }
        else{
           console.log(err)
        }
    })

})

router.get('/addReportee/:mId&:eId',auth,async(req,res)=>{
    
    const m_id=req.params.mId
    const e_id=req.params.eId
    console.log(m_id,e_id)
    const reporteeList=[]
    const manager=new Manager()
    let m= await Manager.findOne({managerId:m_id})
    if(m===null){
        manager.managerId=m_id
        manager.reportees=manager.reportees.concat({reportee:e_id})
        await manager.save()
        console.log('Sucessfuly added')

    }else{
        m.reportees=m.reportees.concat({reportee:e_id})
        await m.save()
        console.log('sucessfully added reportee')
    }

    // for(const mng of m.reportees){
    //     let a =await Employee.findOne({_id:mng.reportee})
    //     reporteeList.push(a)
    // }
    res.render('employee/addReporteeSucessPage',{
        mid:m_id
    })
    


        


})
router.get('/viewReportees/:id',auth,async (req,res)=>{
    const m_id= req.params.id
    const reporteeList=[]
    let m= await Manager.findOne({managerId:m_id})
    for(const mng of m.reportees){
        let a =await Employee.findOne({_id:mng.reportee})
        reporteeList.push(a)
    }
    res.render("employee/reporteeList", {
        managerId:m_id,
            list: reporteeList
    })


})
router.get('/employeeViewTask/:id',auth,async (req,res)=>{
    const e_id = req.params.id
    Employee.findById(e_id,async(err,doc)=>{
        if(!err){
            const t=doc.tasks
            res.render('employee/viewTask',{
                list:t,
                eid:e_id
            })
        }
        
    })
})

router.get('/applyLeave/:id', auth,async (req,res)=>{
    const e_id= req.params.id
    res.render('employee/applyLeave',{
        eid:e_id
    })
})

router.post('/postLeave',auth, async(req,res)=>{
    var leave= new offDays()
    leave.employeeId = req.body.employeeId
    leave.fromDate = req.body.fromdate
    leave.toDate = req.body.todate
    leave.reason = req.body.reason
    leave.noOfDays = req.body.noofdays
    await leave.save()
    Employee.findOne({_id:req.body.employeeId}, async(err,doc)=>{
        console.log('sucessfully applied')
        res.render("layouts/dashboard", {
            message:'Sucessfully Applied Leave',
            emp:doc
        }); 
    })

})

router.get('/checkLeaveStatus/:id',auth, async(req,res)=>{
    const e_id= req.params.id
    leaveList=[]
    let e = await offDays.find({employeeId:e_id})
    for(const emp of e){
        leaveList.push(emp)
    }
    res.render('employee/listLeaveStatus',{
        list:leaveList,
        eid:e_id
    })
})
router.get('/updateLeaveStatus/:mid&:eid',auth,async(req,res)=>{
    const m_id= req.params.mid
    const e_id = req.params.eid
    var leaveList=[]
    let e = await offDays.find({employeeId:e_id})
    for(const emp of e){
        leaveList.push(emp)
    }

    res.render('employee/setLeaveStatus',{
        mid:m_id,
        eid:e_id,
        list:leaveList
    })


})
router.post('/setLeaveStatus',auth, async(req,res)=>{
    let e = await offDays.find({employeeId:req.body.employeeId})
    for(const emp of e){
        emp.status=req.body.status
        emp.managerId=req.body.managerId
        await emp.save()
        res.render('employee/sucessLeaveStatus',{
            mid:req.body.managerId
        })
    }
})
router.get('/updateStatus/:eid&:mid',auth,async (req,res)=>{
    const eid=req.params.eid
    const mid=req.params.mid
    console.log(eid,mid)
    res.render('employee/updateTaskStatus',{
        e_id:eid,
        m_id:mid

    })
    
})

router.post('/setStatus',auth, async (req,res)=>{
    var task = new Task()
    const m_id=req.body.managerId
    const e_id=req.body.employeeId
    Task.findOne({managerId:m_id,employeeId:e_id},async(err,doc)=>{
        doc.status=req.body.status
        await doc.save()
    })
    Employee.findOne({_id:e_id}, async(err,doc)=>{
        for(m of doc.tasks){
            m.status=req.body.status
            await doc.save()
        }
    })

    res.render('employee/sucessPage',{
        eid:e_id
    })
})
router.get('/list',auth, (req, res) => {
    Employee.find((err, docs) => {
        // console.log(docs)
        // docs.forEach((doc)=>{
        //     console.log(doc.jobRole)
        // })
        if (!err) {
            res.render("employee/list", {
                list: docs
            });
        }
        else {
            console.log('Error in retrieving employee list :' + err);
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
            default:
                break;
        }
    }
}

router.get('/:id',auth, (req, res) => {
    Employee.findById(req.params.id, (err, doc) => {
        if (!err) {
            res.render("employee/addOrEdit", {
                viewTitle: "Update Employee",
                employee: doc
            });
        }
    });
});

router.get('/delete/:id',auth, (req, res) => {
    Employee.findByIdAndRemove(req.params.id, (err, doc) => {
        if (!err) {
            res.redirect('/employee/list');
        }
        else { console.log('Error in employee delete :' + err); }
    });
});

router.get('/deleteLeave/:id',auth, async(req,res)=>{
    offDays.findByIdAndRemove(req.params.id,async(err,doc)=>{
        if(!err){
    const e_id= req.params.id
    leaveList=[]
    let e = await offDays.find({employeeId:e_id})
    for(const emp of e){
        leaveList.push(emp)
    }
    res.render('employee/listLeaveStatus',{
        list:leaveList,
        eid:e_id
    })
        }
    })
})

module.exports = router;