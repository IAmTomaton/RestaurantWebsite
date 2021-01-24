var express = require('express');
var router = express.Router();

var reservation_controller = require('../controllers/reservationController');

router.get('/list', reservation_controller.reservations_get);

router.get('/select_day', reservation_controller.select_day_get);

router.post('/select_day', reservation_controller.select_day_post);

router.get('/create', reservation_controller.reservation_create_get);

router.post('/create', reservation_controller.reservation_create_post);

router.get('/select_customer', reservation_controller.select_customer_get);

router.post('/select_customer', reservation_controller.select_customer_post);

router.get('/delete', reservation_controller.reservation_delete_get);

router.post('/delete', reservation_controller.reservation_delete_post);

module.exports = router;
