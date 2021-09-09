const mongoose = require('mongoose');
const BillingHistory = mongoose.model('BillingHistory');
const User = mongoose.model('User');
const Viewlog = mongoose.model('ViewLog');
const moment = require('moment');
const path = require('path');
const readline = require('readline');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
// const csvParser = require('csv-parser');
const report = createCsvWriter({
    path: './viewlogreport.csv',
    header: [
        {id: 'msisdn', title: 'Msisdn'},
        // {id: 'price', title: 'Price'},
        {id: 'viewsCount', title: 'Views Count'},
        {id: 'views', title: 'Last Access Date'},
    ]
});
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

    readFileSync = async (jsonPath) => {
        return new Promise((resolve, reject) => {
            try{
                const readInterface = readline.createInterface({
                    input: fs.createReadStream(jsonPath)
                });
                let inputData = [];
                let counter = 0;
                readInterface.on('line', function(line) {
                    console.log(line)
                    if(line.startsWith("92")){
                        line = line.replace('92', '0');
                    }else if(line.startsWith("3")){
                        line = "0" + line;
                    }
    
                    inputData.push(line);
                    counter += 1;
                    console.log("### read", counter);
                });
        
                readInterface.on('close', function(line) {
                    resolve(inputData);
                });
            }catch(e){
                reject(e);
            }
        });
    }

    async report(){
    console.log("=> generateReportForAcquisitionSourceAndNoOfTimeUserBilled");
    let finalResult = [];

    try{
        var jsonPath = path.join(__dirname, '..', 'msisdn.txt');
        let inputData = await this.readFileSync(jsonPath);    
        console.log("### Input Data Length: ", inputData.length);

        for(let i = 0; i < inputData.length; i++){
            if(inputData[i] && inputData[i].length === 11){
                let singObject = {
                    msisdn: inputData[i]
                }
                console.log(inputData[i]);

                let user = await this.getUser(inputData[i]);
                console.log(user);

                if(user){
                    // let price = await BillingHistory.aggregate([
                    //     {$match: {user_id: user._id, billing_status: "Success"}},
                    //     {$group: {_id: "rev", revenue: {$sum: "$price"}}}
                    // ]);
                    // console.log("warning", "price", price);

                    let viewlogCount = await Viewlog.aggregate([
                        {$match: {user_id: user._id}},
                        {$group: {_id: "views", views: {$sum: 1}}}
                    ])
                    let viewlog = await Viewlog.find({user_id: user._id}).sort({added_dtm: -1}).limit(1)

                    // singObject.price = price.length > 0 ? price[0].revenue : 0;
                    
                    singObject.viewsCount = viewlogCount[0].length > 0 ? viewlogCount[0].views : 0;
                    singObject.views = viewlog.length > 0 ? viewlog[0].added_dtm : 0;
                    console.log(singObject)
                }


                // if(user){
                //     let dou = await viewLogsRepo.getDaysOfUseInDateRange(user._id, "2021-01-01T00:00:00.000Z", "2021-04-26T00:00:00.000Z");
                //     if(dou && dou.length > 0){
                //         singObject.dou = dou[0].count;
                //     }else{
                //         singObject.dou = 0;
                //     }

                //     let subscriber = await subscriberRepo.getSubscriberByUserId(user._id);
                //     if(subscriber){
                //         let subscriptions = await subscriptionRepo.getAllSubscriptions(subscriber._id);
                //         if(subscriptions && subscriptions.length > 0){
                //             let addedDtm = subscriptions[0].added_dtm;
                //             let subsCount = subscriptions.length;

                //             // let totalSuccessTransactions = 0;
                            
                //             // for(let sub = 0; sub < subscriptions.length; sub++){
                //             //     totalSuccessTransactions += subscriptions[sub].total_successive_bill_counts;
                //             // }

                //             // let totalSuccessTransactionsInDec = await billinghistoryRepo.numberOfTransactionsOfSpecificSubscriber(subscriber._id, inputData[i][1] + "T00:00:00.000Z", inputData[i][1] + "T23:59:59.000Z");
                //             let totalSuccessTransactionsInDec = await billinghistoryRepo.numberOfTransactionsOfSpecificSubscriber(subscriber._id, "2021-01-01T00:00:00.000Z", "2021-04-26T00:00:00.000Z");
                //             let totalSuccessTransactions = totalSuccessTransactionsInDec.length > 0 ? totalSuccessTransactionsInDec[0].count : 0;

                //             singObject.subs_count = subsCount;
                //             singObject.acquisition_date = addedDtm;
                //             singObject.act_date = inputData[i][1];
                //             singObject.number_of_success_charging = totalSuccessTransactions;

                //             if(subscriptions[0].affiliate_mid){
                //                 singObject.acquisition_source = subscriptions[0].affiliate_mid;
                //                 singObject.affiliate_unique_transaction_id = subscriptions[0].affiliate_unique_transaction_id;
                //             }else{
                //                 singObject.acquisition_source = subscriptions[0].source;
                //                 singObject.affiliate_unique_transaction_id = subscriptions[0].affiliate_unique_transaction_id;
                //             }

                //             let otp = await otpRepo.getOtp(inputData[i]);
                //             if(otp && otp.verified === true){
                //                 singObject.source = "otp";
                //             }else{
                //                 singObject.source = "he";
                //             }

                            finalResult.push(singObject);
                            console.log("### Done ", i);

                //         }else{
                //             console.log("### No subscriptions found for", inputData[i][0]);
                //         }
                //     }else{
                //         console.log("### No subscriber found for", inputData[i][0]);    
                //     }
                // }else{
                //     console.log("### No user found for", inputData[i][0]);
                // }
            }else{
                console.log("### Invalid number or number length");
            }
        }
    
        // console.log("### Sending email");
        let rep = await report.writeRecords(finalResult);

        // let info = await transporter.sendMail({
        //     from: 'taha@dmdmax.com',
        //     to:  ["muhammad.azam@dmdmax.com"],
        //     // to:  ["farhan.ali@dmdmax.com"],
        //     subject: `Complaint Data`, // Subject line
        //     text: `This report contains the details of msisdns being sent us over email from Zara`,
        //     attachments:[
        //         {
        //             filename: randomReport,
        //             path: randomReportFilePath
        //         }
        //     ]
        // });
    
        // console.log("###  [randomReport][emailSent]",info);
        // fs.unlink(randomReportFilePath,function(err,data) {
        //     if (err) {
        //         console.log("###  File not deleted[randomReport]");
        //     }
        //     console.log("###  File deleted [randomReport]");
        // });
    }catch(e){
        console.log("### error - ", e);
    }
    }

    async getUser(msisdn){
        let user = await User.findOne({msisdn: msisdn});
        return user;
    }
}

module.exports = BillingHistoryRepository;