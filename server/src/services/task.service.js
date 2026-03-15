const { ImageTask, ImageResult } = require('../models'); module.exports={ createTask:(payload)=>ImageTask.create(payload), getTask:async(id)=>ImageTask.findByPk(id,{include:[{model:ImageResult}]}) };
