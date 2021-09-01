const mongoose = require('mongoose');
const {Schema} = mongoose;
const ShortId = require('mongoose-shortid-nodeps');

const billingHistorySchema = new Schema({
    msisdn: { type: String, index: true },
    user_id: { type:ShortId, required: true, index: true },
    subscription_id: { type:ShortId,  index: true },
    paywall_id: { type:ShortId, required: true, index: true },
    package_id: { type: String, index: true },
    price: { type: Number, default: 0 },
    transaction_id: {type: String, index: true},
    operator_response: { type: {} },
    billing_status: String,

    //source of the user(android/ios/web/other)
    source: String,
    micro_charge: { type: Boolean, default: false, index: true },
    operator: String,

    // response time taken by api - TP or EP
    response_time: {type: Number, default: 0},
    billing_dtm: { type: Date, default: Date.now, index: true }
}, { strict: true })

module.exports = mongoose.model('BillingHistory', billingHistorySchema);
