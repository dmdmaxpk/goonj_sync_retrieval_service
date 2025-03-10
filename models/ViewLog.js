const mongoose = require('mongoose');
const ShortId = require('mongoose-shortid-nodeps');
const {Schema} = mongoose;
const ObjectId = Schema.ObjectId;


const viewLogSchema = new Schema({
    //Generating shortid instead of uuid
    _id: { type: ShortId, len: 16, retries: 4 },
    user_id: { type: String, required: true},
    subscription_id: {type: ShortId},
    marketing_source: String,
    source: {type: String, default: 'app', index: true},
    operator: {type: String, default: 'telenor', index: true},
    added_dtm: {type: Date, default: new Date()}
}, { strict: true });

module.exports = mongoose.model('ViewLog', viewLogSchema);