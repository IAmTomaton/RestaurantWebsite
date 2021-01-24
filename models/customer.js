var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CustomerSchema = new Schema(
    {
        first_name: { type: String, required: true, maxlength: 100 },
        family_name: { type: String, required: true, maxlength: 100 }
    }
);

CustomerSchema
    .virtual('name')
    .get(function () {
        return this.family_name + ' ' + this.first_name;
    });

module.exports = mongoose.model('Customer', CustomerSchema)
