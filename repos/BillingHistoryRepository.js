const mongoose = require('mongoose');
const BillingHistory = mongoose.model('BillingHistory');
const moment = require('moment');

class BillingHistoryRepository {
    async getExpiryHistory(user_id) {
        let result = await BillingHistory.aggregate([{             
            $match:{ 
                "user_id": user_id,
                $or:[
                    {"billing_status" : "expired"}, 
                    {"billing_status" : "unsubscribe-request-recieved"}, 
                    {"billing_status" : "unsubscribe-request-received-and-expired"}
                ]
            }
        }]);
        console.log("expired history", result);
        return result;
    }

    setDateWithTimezone(date){
        return new Date(date.toLocaleString("en-US", {timeZone: "Asia/Karachi"}));
    }

    async getRevenueInDateRange (from, to)  {
        try{
            let result = await BillingHistory.aggregate([ { $match: { 
                "billing_status": "Success",
                $and:[
                    {"billing_dtm":{$gt: new Date(from)}}, 
                    {"billing_dtm":{$lte: new Date(to)}}
                ]            
                } },
                { $project: { _id: 0, "price": "$price" } },{ $group: {          _id: null,          total: {              $sum: "$price"          }      }  } ]);
                console.log("=> ", result);
             return result;
        }catch(err){
            console.log("=>", err);
        }
    }

    async getRequests(from, to)  {
        try{
            let result = await BillingHistory.aggregate([
            {
                $match:{
                $or:[
                    {billing_status: "Success"}, 
                    {billing_status: "graced"}
                ],
                $and:[
                    {billing_dtm:{$gt: new Date(from)}}, 
                    {billing_dtm:{$lte: new Date(to)}}
                ]
                }
            },{
                $count: "sum"
            }
            ]);

            console.log("=> ", result);
             return result;
        }catch(err){
            console.log("=>", err);
        }
    }

    async getRevenueStatsDateWise(from, to){

        console.log('from, to : ',from, to);
        let dataArr = [];
        //Get day and month for date
        let todayDay = moment(from).format('DD');
        let todayMonth = moment(from).format('MMM');

        //Push Date
        dataArr.push({'date': todayDay+ ' ' +todayMonth});
        console.log('date: ', JSON.stringify(dataArr))

        /*
        * Compute Revenue
        * */
        let revenue =  await this.getRevenueInDateRange(from, to);
        if (revenue.length > 0){
            revenue = revenue[0];
            dataArr.push({"revenue": revenue.total})
        }
        else{
            dataArr.push({"revenue": 0})
        }

        console.log('revenue: ', JSON.stringify(dataArr))

        /*
        * Get Total Count
        * */
        let requestCount =  await this.getBillingRequestCountInDateRange(from, to);
        if (requestCount.length > 0){
            requestCount = requestCount[0];
            dataArr.push({"total_requests": requestCount.total})
        }
        else{
            dataArr.push({"total_requests": 0})
        }
        console.log('requestCount: ', JSON.stringify(dataArr))

        /*
        * Get success and expire - subscription status
        * */
        let statusWise =  await this.getBillingStatsStatusWiseInDateRange(from, to);
        let successful = {'successful_charged': 0}, unsubscribed = {'unsubscribe_requests': 0};
        for (let i = 0; i< statusWise.length; i++){
            if (statusWise[i]._id === 'Success')
                successful.successful_charged = statusWise[i].total;
            else if (statusWise[i]._id === 'expired')
                unsubscribed.unsubscribe_requests = statusWise[i].total;
        }
        dataArr.push(successful);
        dataArr.push(unsubscribed);
        console.log('statusWise: ', JSON.stringify(dataArr))

        /*
        * Get Insufficient Balance
        * */
        let insufficientBalance =  await this.getBillingInsufficientBalanceInDateRange(from, to);
        if (insufficientBalance.length > 0){
            insufficientBalance = insufficientBalance[0];
            dataArr.push({"insufficient_balance": insufficientBalance.total})
        }
        else{
            dataArr.push({"insufficient_balance": 0})
        }
        console.log('insufficientBalance: ', JSON.stringify(dataArr))

        return dataArr;
    }

    async getBillingRequestCountInDateRange (from, to)  {
        try{
            let result = await BillingHistory.aggregate([
                { $match: {
                        $or:[
                            {billing_status: "Success"},
                            {billing_status: "graced"}
                        ],
                        $and:[
                            {"billing_dtm":{$gt: new Date(from)}},
                            {"billing_dtm":{$lte: new Date(to)}}
                        ]
                    }},
                { $group: {
                        _id: null, total: { $sum: 1 }
                    }}
            ]);
            return result;
        }catch(err){
            console.log("getBillingRequestCountInDateRange - err =>", err);
        }
    }

    async getBillingStatsStatusWiseInDateRange (from, to)  {
        try{
            let result = await BillingHistory.aggregate([
                { $match: {
                        $and:[
                            {"billing_dtm":{$gt: new Date(from)}},
                            {"billing_dtm":{$lte: new Date(to)}}
                        ]
                    }},
                { $group: {
                        _id: "$billing_status", total: { $sum: 1 }
                    }}
            ]);
            return result;
        }catch(err){
            console.log("getBillingStatsStatusWiseInDateRange - err =>", err);
        }
    }

    async getBillingInsufficientBalanceInDateRange (from, to)  {
        try{
            let result = await BillingHistory.aggregate([
                { $match: {
                        "operator_response.errorMessage": "The account balance is insufficient.",
                        $and:[
                            {"billing_dtm":{$gt: new Date(from)}},
                            {"billing_dtm":{$lte: new Date(to)}}
                        ]
                    }},
                { $group: {
                        _id: null, total: { $sum: 1 }
                    }}
            ]);
            return result;
        }catch(err){
            console.log("getBillingInsufficientBalanceInDateRange - err =>", err);
        }
    }
}

module.exports = BillingHistoryRepository;