const SyncCollectionRepository = require('../../repos/SyncCollectionRepository');
const syncRepo = new SyncCollectionRepository();

class SyncCollectionConsumer{
    async consume(message){
        let dataObject = JSON.parse(message.content);

        let {collection, method, data} = dataObject;
        let result = undefined;

        if(method == 'create'){
            result = await syncRepo.create(collection, data);
        }
        else if(method == 'update'){
            result = await syncRepo.update(collection, data);
        }
        else if(method == 'remove'){
            result = await syncRepo.remove(collection, data);
        }
    }
}

module.exports = SyncCollectionConsumer;