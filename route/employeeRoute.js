const express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const Employee = mongoose.model('Employee');
const employee=require('../models/employeeModel')
const Manager=require('../models/managerModel')
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
router.get('/addReportee/:mId&:eId',async(req,res)=>{
    
    const m_id=req.params.mId
    const e_id=req.params.eId
    console.log(m_id,e_id)
    const reporteeList=[]
    const manager=new Manager()
    Manager.find((err,docs)=>{
        if(!err){
            const doc = docs.filter(mng=> mng._id != m_id)
            console.log( 'doc value',doc.length)
            if(doc.length===0){
                console.log('Added sucessfully')
                manager.managerId=m_id
                manager.reportees=manager.reportees.concat({reportee:e_id})
                manager.save()

            }else{
                doc.forEach(async mng=>{
                    mng.reportees=mng.reportees.concat({reportee:e_id})
                    await mng.save()
                })
            }
            doc.forEach(mng=>{
               mng.reportees.forEach( async doc=>{
                   console.log(doc)
                   console.log('doc_id', doc.reportee)
                   //a= await Employee.findById(doc.reportee)
                // let a= await Employee.findOne({_id:doc.reportee})
                // reporteeList.push(a)
                  const a=  await Employee.findOne({_id:doc.reportee})
                  console.log('a',a)
                  a.then((result)=>{
                        console.log(result)
                        reporteeList.push(a)
                    }).catch((error)=>{
                        console.log(error)
                    })

                 //console.log('a',a)
                })
            })
            console.log('reporteeList',reporteeList)
        }
    })


})

// router.get('/addReportee/:mId&:eId',(req,res)=>{
    
//     const m_id=req.params.mId
//     const e_id=req.params.eId
//     console.log(m_id,e_id)
//     var reporteeList=[]
//     const manager=new Manager()
//     manager.managerId=m_id
//     manager.reportees=manager.reportees.concat({e_id})
//     manager.save((err,doc)=>{
//         if(!err){
//             console.log('Added sucessfully')
//             Manager.find((err,docs)=>{
                       
//                         if(!err){
//                             const doc = docs.filter(mng=> mng._id != m_id)
//                             console.log(doc)
//                             //var i=0
//                            //declared arrary
//                             doc.forEach(emp =>{
                                
//                                 console.log(emp.reportee)
//                                let a= Employee.findById(emp.reportee, (err,doc)=>{
//                                    reporteeList.push(doc)
//                                 })
//                             })
//                             console.log( 'reportee list',a) // here its displaying undefined why??
                        


//                            //res.setHeader('Authorization','Bearer '+token)
//                         //    res.render("employee/reporteeList", {
//                         //     list: doc
                    
//                         //      });
        
//                         }else{
//                             res.send('ERROR OCCURED IN FUNCTION')
//                         }
    
//                    })
//             console.log('Added reportee sucessfully')
//         }else{
//             console.log(err)
//         }
//     })

// })
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