const r=require('express').Router(); const c=require('../controllers/task.controller'); r.get('/:taskId',c.detail); module.exports=r;
