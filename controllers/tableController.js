const { body, validationResult } = require("express-validator");
var Table = require('../models/table');

exports.tables_get = function (req, res) {
    Table.find()
        .exec(function (err, tables) {
            if (err) { return next(err); }
            res.render('tables', { title: 'Tables', tables: tables });
        });
};

exports.table_create_get = function (req, res, next) {
    res.render('table_form', { title: 'Create Table' });
};

exports.table_create_post = [

    body('number', 'The table number must be greater than zero.').isInt({ min: 1 }).escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        var table = new Table({
            number: req.body.number
        });

        if (!errors.isEmpty()) {
            res.render('table_form', { title: 'Create Table', table: table, errors: errors.array() });
            return;
        }
        Table.findOne({ 'number': req.body.number })
            .exec(function (err, found_table) {
                if (err) { return next(err); }

                if (found_table) {
                    res.render('table_form', { title: 'Create Table', table: table, errors: [{ msg: 'A table with this number already exists.' }] });
                    return;
                }
                table.save(function (err) {
                    if (err) { return next(err); }
                    res.redirect('/table/list');
                });
            });
    }
];

exports.table_delete_get = function (req, res, next) {
    res.render('table_form', { title: 'Delete Table' });
};

exports.table_delete_post = function (req, res, next) {
    const errors = validationResult(req);

    var table = new Table(
        { number: req.body.number }
    );

    if (!errors.isEmpty()) {
        res.render('table_form', { title: 'Create Table', table: table, errors: errors.array() });
        return;
    }
    else {
        Table.findOneAndRemove({ 'number': req.body.number }, function deleteTable(err) {
            if (err) { return next(err); }
            res.redirect('/table/list')
        });
    }
};
