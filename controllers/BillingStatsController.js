const BillingHistoryRepository = require('../repos/BillingHistoryRepository');
const historyRepo = new BillingHistoryRepository();
const helper = require('../helper/helper');
const  _ = require('lodash');

exports.getExpiryHistory = async(req, res) => {
    let result = await historyRepo.getExpiryHistory(req.query.user_id)
    res.send(result);
}

exports.rev_report = async (req,res) =>  {
    let data = [];
    let serverDate = new Date();
    let localDate = helper.setDateWithTimezone(serverDate);

    let todayStart = _.clone(localDate);
    todayStart.setHours(00);
    todayStart.setMinutes(00);
    todayStart.setSeconds(00);
    let todayEnd = _.clone(localDate);

    let yesterdayStart = _.clone(localDate);
    yesterdayStart.setDate(localDate.getDate() - 1);
    yesterdayStart.setHours(00);
    yesterdayStart.setMinutes(00);
    yesterdayStart.setSeconds(00);

    let yesterdayEnd = _.clone(localDate);
    yesterdayEnd.setDate(localDate.getDate() - 1);

    let dayBeforeYesterdayStart = _.clone(localDate);
    dayBeforeYesterdayStart.setDate(serverDate.getDate() - 2);
    dayBeforeYesterdayStart.setHours(00);
    dayBeforeYesterdayStart.setMinutes(00);
    dayBeforeYesterdayStart.setSeconds(00);


    let dayBeforeYesterdayEnd = _.clone(localDate);
    dayBeforeYesterdayEnd.setDate(serverDate.getDate() - 2);


    let revenue = await historyRepo.getRevenueInDateRange(todayStart, todayEnd);
    await console.log("today revenue", revenue)
    data.push({'Todays revenue till the time': revenue[0].total});

    revenue = await historyRepo.getRevenueInDateRange(yesterdayStart, yesterdayEnd);
    data.push({'Yesterdays revenue till the time': revenue[0].total});

    revenue = await historyRepo.getRevenueInDateRange(dayBeforeYesterdayStart, dayBeforeYesterdayEnd);
    data.push({'Day before yesterday revenue till the time': revenue[0].total});

    console.log("=> ", revenue);
    res.send(data);
}

exports.req_count = async (req,res) =>  {
    let data = [];
    let serverDate = new Date();
    let localDate = helper.setDateWithTimezone(serverDate);

    let todayStart = _.clone(localDate);
    todayStart.setHours(00);
    todayStart.setMinutes(00);
    todayStart.setSeconds(00);
    let todayEnd = _.clone(localDate);

    let yesterdayStart = _.clone(localDate);
    yesterdayStart.setDate(localDate.getDate() - 1);
    yesterdayStart.setHours(00);
    yesterdayStart.setMinutes(00);
    yesterdayStart.setSeconds(00);

    let yesterdayEnd = _.clone(localDate);
    yesterdayEnd.setDate(localDate.getDate() - 1);

    let dayBeforeYesterdayStart = _.clone(localDate);
    dayBeforeYesterdayStart.setDate(serverDate.getDate() - 2);
    dayBeforeYesterdayStart.setHours(00);
    dayBeforeYesterdayStart.setMinutes(00);
    dayBeforeYesterdayStart.setSeconds(00);


    let dayBeforeYesterdayEnd = _.clone(localDate);
    dayBeforeYesterdayEnd.setDate(serverDate.getDate() - 2);

    let requests = await historyRepo.getRequests(todayStart, todayEnd);
    data.push({'Todays requests till the time': requests[0].sum});

    requests = await historyRepo.getRequests(yesterdayStart, yesterdayEnd);
    data.push({'Yesterdays requests till the time': requests[0].sum});

    requests = await historyRepo.getRequests(dayBeforeYesterdayStart, dayBeforeYesterdayEnd);
    data.push({'Day before yesterdays requests till the time': requests[0].sum});

    console.log("=> ", data);
    res.send(data);
}

exports.revenue_stats = async (req,res) =>  {
    let revenueStats = [];
    let serverDate = new Date();
    let localDate = helper.setDateWithTimezone(serverDate);

    let today = _.clone(localDate);
    today.setHours(00);
    today.setMinutes(00);
    today.setSeconds(00);
    console.log('req.query.day: ', req.query.day);

    if (req.query.day === 'today'){
        let todayStart = _.clone(localDate);
        let todayEnd = _.clone(localDate);

        todayStart.setHours(00);
        todayStart.setMinutes(00);
        todayStart.setSeconds(00);
        revenueStats = await historyRepo.getRevenueStatsDateWise(todayStart, todayEnd);
        console.log('todayRevenueStats: ', revenueStats);

    }
    else if(req.query.day === 'yesterday'){
        let yesterdayStart = _.clone(localDate);
        let yesterdayEnd = _.clone(localDate);

        yesterdayStart.setDate(localDate.getDate() - 1);
        yesterdayStart.setHours(00);
        yesterdayStart.setMinutes(00);
        yesterdayStart.setSeconds(00);
        yesterdayEnd.setDate(localDate.getDate() - 1);
        revenueStats = await historyRepo.getRevenueStatsDateWise(yesterdayStart, yesterdayEnd);
        console.log('yesterdayRevenueStats: ', revenueStats);
    }
    else if(req.query.day === 'datBeforeYesterday'){
        let dayBeforeYesterdayStart = _.clone(localDate);
        let dayBeforeYesterdayEnd = _.clone(localDate);

        dayBeforeYesterdayStart.setDate(serverDate.getDate() - 2);
        dayBeforeYesterdayStart.setHours(00);
        dayBeforeYesterdayStart.setMinutes(00);
        dayBeforeYesterdayStart.setSeconds(00);
        dayBeforeYesterdayEnd.setDate(serverDate.getDate() - 2);
        revenueStats = await historyRepo.getRevenueStatsDateWise(dayBeforeYesterdayStart, dayBeforeYesterdayEnd);
        console.log('dayBeforeYesterdayRevenueStats - stringify: ', revenueStats);
    }

    console.log('revenueStats: ', revenueStats);
    res.send({code: 1, data: revenueStats});
};

