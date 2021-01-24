const { body, validationResult } = require("express-validator");
var Reservation = require('../models/reservation');
var Customer = require('../models/customer');
var Table = require('../models/table');
var async = require('async');
const { DateTime } = require("luxon");

var start_time_reservation = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']
var end_time_reservaion = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

exports.reservations_get = function (req, res) {
    Reservation.find()
        .populate('customer')
        .populate('table')
        .exec(function (err, reservations) {
            if (err) { return next(err); }
            res.render('reservations', { title: 'Reservations', reservations: reservations });
        });
};

exports.select_day_get = function (req, res) {
    res.render('select_day', { title: 'Select day'});
};

exports.select_day_post = function (req, res) {
    res.redirect('/reservation/create?date=' + req.body.date);
};

function render_reservation_create(req, res, errors) {
    var max = DateTime.fromISO(req.query.date).plus({ day: 1 });
    var min = DateTime.fromISO(req.query.date);
    async.parallel({
        tables: function (callback) { Table.find().exec(callback) },
        reservations: function (callback) {
            Reservation.find({
                "date": {
                    $gte: min,
                    $lte: max
                }
            })
                .populate('table')
                .exec(callback);
        }
    },
        function (err, results) {
            reservation_table = []
            results.tables.forEach(table => {
                reservation_table[table.number] = []
                start_time_reservation.forEach(time => reservation_table[table.number][time] = false);
            });
            results.reservations.forEach(reservation => {
                var index_start = start_time_reservation.indexOf(reservation.start_time);
                var index_end = end_time_reservaion.indexOf(reservation.end_time);
                for (var i = 0; i < start_time_reservation.length; i++) {
                    if (i >= index_start && i <= index_end) {
                        reservation_table[reservation.table.number][start_time_reservation[i]] = true
                    }
                }
            });
            customer = {
                first_name: req.body.first_name,
                family_name: req.body.family_name
            };
            if (err) { return next(err); }
            res.render('reservation_create_form', {
                title: 'Reservation',
                customer: customer,
                date: req.query.date,
                tables: results.tables,
                selected_table: req.body.table,
                start_times: start_time_reservation,
                end_times: end_time_reservaion,
                reservation_table: reservation_table,
                errors: errors
            });
        }
    )
}

exports.reservation_create_get = function (req, res) {
    render_reservation_create(req, res, []);
};

//Save reservation
function reservation_post(req, res) {
    async.waterfall([
        //Find customer
        function (callback) {
            Customer.findOne({
                first_name: req.body.first_name,
                family_name: req.body.family_name
            }).exec(callback)
        },
        //Save new customer
        function (result, callback) {
            if (result != null) {
                callback(null, result);
            } else {
                var customer = new Customer({
                    first_name: req.body.first_name,
                    family_name: req.body.family_name
                });
                customer.save(function (err) {
                    if (err) callback(err, null);
                    callback(null, customer);
                })
            }
        }
    ],
        //Save new reservation
        function (err, customer) {
            if (err) { return next(err); }
            var reservation = new Reservation({
                customer: customer._id,
                table: req.body.table,
                date: req.body.date,
                start_time: start_time_reservation[req.body.start],
                end_time: end_time_reservaion[req.body.end]
            });
            reservation.save(function (err) {
                if (err) { return next(err); }
                res.redirect('/');
            })
        }
    );
}

exports.reservation_create_post = [
    body('first_name').trim().isLength({ min: 1 }).escape().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').trim().isLength({ min: 1 }).escape().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            render_reservation_create(req, res, errors.array());
            return;
        }
        //Check start and end time
        if (req.body.start > req.body.end) {
            render_reservation_create(req, res, [{ msg: 'Booking start time must be less than end time' }]);
            return;
        }
        var max = DateTime.fromISO(req.query.date).plus({ day: 1 });
        var min = DateTime.fromISO(req.query.date);
        //Check crossing with other reservation
        Reservation.find({
            "date": {
                $gte: min,
                $lte: max
            }
        },
            function (err, reservations) {
                if (err) { return next(err); }
                var index_start_current = start_time_reservation.indexOf(req.body.start_time);
                var index_end_current = start_time_reservation.indexOf(req.body.start_time);
                var crossing = reservations
                    .filter(reservation => reservation.table == req.body.table)
                    .some(reservation => {
                        var index_start = start_time_reservation.indexOf(reservation.start_time);
                        var index_end = start_time_reservation.indexOf(reservation.start_time);
                        return index_start_current <= index_start <= index_end_current || index_start <= index_start_current <= index_end;
                    });
                if (crossing) {
                    render_reservation_create(req, res, [{ msg: 'Your time overlaps with the time of another client' }]);
                    return;
                }
                reservation_post(req, res);
        });
    }
]

exports.select_customer_get = function (req, res) {
    res.render('select_customer', { title: 'Select customer', customer: undefined });
};

exports.select_customer_post = function (req, res) {
    Customer.findOne({
        first_name: req.body.first_name,
        family_name: req.body.family_name
    }).exec(function (err, result) {
        var customer = {
            first_name: req.body.first_name,
            family_name: req.body.family_name
        };
        if (err) {
            res.render('select_customer', { title: 'Select customer', customer: customer, errors: [err] });
            return;
        }
        if (result == null) {
            res.render('select_customer', { title: 'Select customer', customer: customer, errors: [{ msg: 'Customer not found' }] });
            return;
        }
        res.redirect('/reservation/delete?first_name=' + req.body.first_name + '&family_name=' + req.body.family_name);
    })
};

exports.reservation_delete_get = function (req, res) {
    async.waterfall([
        function (callback) {
            Customer.findOne({
                first_name: req.query.first_name,
                family_name: req.query.family_name
            }).exec(callback)
        },
        function (customer, callback) {
            if (customer == null) {
                callback({ msg: 'Customer not found' }, null);
                return;
            }
            Reservation.find({
                customer: customer._id
            })
                .populate('table')
                .exec(callback);
        }
    ],
        function (err, result) {
            var customer = {
                first_name: req.query.first_name,
                family_name: req.query.family_name
            };
            if (err) {
                res.render('select_customer', { title: 'Select customer', customer: customer, errors: [err] });
                return;
            }

            res_list = result instanceof Array ? result : new Array(result);
            reservations = res_list.map(res => {
                return {
                    date: DateTime.fromJSDate(res.date).toISODate(),
                    start_time: res.start_time,
                    end_time: res.end_time,
                    table: res.table.number,
                    _id: res._id
                };
            });
            res.render('reservation_delete_form', { title: 'Delete reservation', customer: customer, reservations: reservations });
        }
    );
};

exports.reservation_delete_post = function (req, res) {
    Reservation.deleteMany({
        _id: req.body.res
    },
        function (err, result) {
            res.redirect('/');
        });
};
