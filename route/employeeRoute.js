const express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const Employee = mongoose.model('Employee');
const employee=require('../models/employeeModel')
const Manager=require('../models/managerModel')
const bcrypt=require('bcryptjs')

router.get('/login',(req,res)=>{
    res.render('employee/login',{
        message:'LOGIN PAGE'
    })
    
})

router.post('/login',async(req,res) =>{
    try{
       
       const emp= await Employee.findOne({email:req.body.email})
       
        if(!emp){
           
          return res.send('Invalid credentials')
        }

        const isMatch = await bcrypt.compare(req.body.password,emp.password)
        

        if(!isMatch){
           return res.send('Invalid credentials')
        }
        
        //res.send({emp})
        if(emp.jobRole === 'Manager'){
            res.render("layouts/dashboardManager", {
                message:'Sucessfully Logged In',
                emp
            });   

        }else{
            res.render("layouts/dashboard", {
                message:'Sucessfully Logged In',
                emp
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

function insertRecord(req, res) {

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
                        res.render("employee/listForManager", {
                            list: doc,
                            managerId: m_id
                        });
    
                    }else{
                        res.send('ERROR OCCURED IN FUNCTION')
                    }

               })

})

router.get('/addReportee/:valueId',(req,res)=>{
    const Ids=req.params.valueId
    console.log(Ids)
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