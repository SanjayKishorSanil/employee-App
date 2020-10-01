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
                res.redirect('employee/list');
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
        if (!err) { res.redirect('employee/list'); }
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
            res.render("employee/assignTask",{
                managerId:m_id,
                employeeId:e_id,
                message:'Sucessfully Assigned'
            })
            
          
        }
        else{
           console.log(err)
        }
    })

})


router.get('/viewTasks/:id',async(req,res)=>{
    const m_id=req.params.id
    Task.find(async(err,docs)=>{
        if(!err){
            const doc=docs.filter(emp=> emp.managerId != m_id)
            console.log(doc)
        }
    })
})
router.get('/addReportee/:mId&:eId',async(req,res)=>{
    
    const m_id=req.params.mId
    const e_id=req.params.eId
    console.log(m_id,e_id)
    const reporteeList=[]
    const manager=new Manager()
    Manager.find(async(err,docs)=>{
        console.log('DOCS VALUE',docs)
        if(!err){

            Manager.findOne({managerId:m_id}).then(async (doc)=>{
                console.log('value of finding mangere id',doc)
                if(doc==null){
                    manager.managerId=m_id
                    manager.reportees=manager.reportees.concat({reportee:e_id})
                    await manager.save()
                }else{
                        doc.reportees=doc.reportees.concat({reportee:e_id})
                        await doc.save()
                    
                }

            }).then((result)=>{
                Manager.findOne({managerId:req.params.mId}).then(async(managerList)=>{
                    console.log('mamanager list',managerList)
                    for(const mng of managerList.reportees){
                        console.log(mng)
                        let a= await Employee.findOne({_id:mng.reportee})
                        console.log(a)
                        reporteeList.push(a)
                    }
                }).catch((err)=>{
                    console.log(err)
                })
                
            })


            // const doc = docs.filter(async mng=> mng.managerId === req.params.mId)
            // console.log('DOC value',doc)
            // for( const mng of doc){
            //     console.log(mng)
            //     for( const doc of mng.reportees){
            //         let a= await Employee.findOne({_id:doc.reportee})
            //         reporteeList.push(a)
            //     }
            // }
            console.log('reporteeList',reporteeList)
            res.render("employee/reporteeList", {
                managerId:m_id,
                list: reporteeList
            })

        }
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