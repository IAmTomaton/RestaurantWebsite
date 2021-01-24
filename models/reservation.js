var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ReservationSchema = new Schema(
    {
        customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
        table: { type: Schema.Types.ObjectId, ref: 'Table', required: true },
        date: { type: Date, required: true },
        start_time: { type: 'String', required: true },
        end_time: { type: 'String', required: true }
    }
);

module.exports = mongoose.model('Reservation', ReservationSchema)
