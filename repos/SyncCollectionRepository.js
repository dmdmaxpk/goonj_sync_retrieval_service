const mongoose = require('mongoose');
const Subscription = mongoose.model('Subscription');
const User = mongoose.model('User');
const Viewlog = mongoose.model('ViewLog');

class SyncCollectionRepository {
    async create(collectionName, data){
        let Collection;
        if(collectionName == 'subscriptions'){
            Collection = Subscription;
        }
        else if(collectionName == 'users'){
            Collection = User;
        }
        else if(collectionName == 'viewlogs'){
            Collection = Viewlog;
        }
        let saveData = new Collection(data);
        let result = await saveData.save();
        console.log("warning", 'collection', Collection, "result", result)
        return result;
    }

    async update(collectionName, data){
        let query = {_id: data._id};
        let Collection;
        if(collectionName == 'subscriptions'){
            Collection = Subscription;
        }
        else if(collectionName == 'users'){
            Collection = User;
        }
        else if(collectionName == 'viewlogs'){
            Collection = Viewlog;
        }

        const result = await Collection.updateOne(query, data, { upsert: true });
        console.log("warning", 'collection', Collection, "result", result)
        if (result.nModified === 0) {
            return undefined;
        }else{
            return result;
        }
    }

    async remove(collectionName, data){
        let query = {_id: data._id};
        let Collection;
        if(collectionName == 'subscriptions'){
            Collection = Subscription;
        }
        else if(collectionName == 'users'){
            Collection = User;
        }
        else if(collectionName == 'viewlogs'){
            Collection = Viewlog;
        }

        const result = await Collection.remove(query);
        return result;
    }
}

module.exports = SyncCollectionRepository;