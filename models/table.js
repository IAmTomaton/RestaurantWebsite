var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var TableSchema = new Schema(
    {
        number: { type: "number", required: true }
    }
);

module.exports = mongoose.model('Table', TableSchema)
