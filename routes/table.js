var express = require('express');
var router = express.Router();

var table_controller = require('../controllers/tableController');

router.get('/list', table_controller.tables_get);

router.get('/create', table_controller.table_create_get);

router.post('/create', table_controller.table_create_post);

router.get('/delete', table_controller.table_delete_get);

router.post('/delete', table_controller.table_delete_post);

module.exports = router;
