const express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const Employee = mongoose.model('Employee');
const employee=require('../models/employeeModel')
const Manager=require('../models/managerModel')
const Task=require('../models/taskModel')
const bcrypt=require('bcryptjs')
const auth=require('../middleware/auth')

router.get('/login',(req,res)=>{
    res.render('employee/login',{
        message:'LOGIN PAGE'
    })
    
})

router.post('/login',async(req,res) =>{
    try{
       
       const emp= await Employee.findOne({email:req.body.email})
       const token= await emp.generateAuthToken()
        if(!emp){
           
          return res.send('Invalid credentials')
        }

        const isMatch = await bcrypt.compare(req.body.password,emp.password)
        

        if(!isMatch){
           return res.send('Invalid credentials')
        }
        
        //res.send({emp})
        //console.log(emp)
        //console.log(token)
        if(emp.jobRole === 'Manager'){
            res.setHeader('Authorization','Bearer '+token)
            res.render("layouts/dashboardManager", {
                message:'Sucessfully Logged In',
                emp,
                token
            });   

        }else{
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
        employee.save((err, doc) => {
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
       const token = await employee.generateAuthToken()
    }else{
        var employee = new Employee();
        employee.fullName = req.body.fullName;
        employee.email = req.body.email;
        employee.mobile = req.body.mobile;
        employee.city = req.body.city;
        employee.jobRole=req.body.jobRole;
        employee.salary=req.body.salary;
        employee.password=req.body.password;
        employee.save((err, doc) => {
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
        const token = await employee.generateAuthToken()
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


router.get('/listForManager/:id',(req,res)=>{
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
router.get('/updateRemark/:tid&:mid', async(req,res)=>{
    const tid=req.params.tid
    const mid=req.params.mid
    res.render('employee/updateRemark',{
        m_id:mid,
        t_id:tid
    })


})
router.post('/setRemark', async(req,res)=>{
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
router.get('/listStatus/:id',async (req,res)=>{
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
router.get('/addTask/:mId&:eId',async(req,res)=>{
    const m_id=req.params.mId
    const e_id=req.params.eId

    res.render("employee/assignTask",{
        managerId:m_id,
        employeeId:e_id
    })
})

router.post('/assignTask', async(req,res)=>{
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

router.get('/addReportee/:mId&:eId',async(req,res)=>{
    
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
router.get('/viewReportees/:id',async (req,res)=>{
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
router.get('/employeeViewTask/:id',async (req,res)=>{
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

router.get('/updateStatus/:eid&:mid',async (req,res)=>{
    const eid=req.params.eid
    const mid=req.params.mid
    console.log(eid,mid)
    res.render('employee/updateTaskStatus',{
        e_id:eid,
        m_id:mid

    })
    
})

router.post('/setStatus', async (req,res)=>{
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
router.get('/list', (req, res) => {
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

router.get('/:id', (req, res) => {
    Employee.findById(req.params.id, (err, doc) => {
        if (!err) {
            res.render("employee/addOrEdit", {
                viewTitle: "Update Employee",
                employee: doc
            });
        }
    });
});

router.get('/delete/:id', (req, res) => {
    Employee.findByIdAndRemove(req.params.id, (err, doc) => {
        if (!err) {
            res.redirect('/employee/list');
        }
        else { console.log('Error in employee delete :' + err); }
    });
});

module.exports = router;