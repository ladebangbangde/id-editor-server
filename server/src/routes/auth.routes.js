const r=require('express').Router(); const c=require('../controllers/auth.controller'); r.get('/me',c.me); r.post('/admin/login',c.adminLogin); module.exports=r;
