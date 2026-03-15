const r=require('express').Router(); const c=require('../controllers/scene.controller'); r.get('/',c.list); r.get('/:sceneKey',c.detail); module.exports=r;
