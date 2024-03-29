const express = require('express');
const request = require('request');

const app = express();

const genesisNode = "localhost:8080"
var port = -1;
var isGenesis = true;

process.argv.forEach(function (val, index, array) {
    if (index == 2) {
        console.log('setting port to: ' + val);
        port = val;
    }
});

if (port == -1) {
    console.log('Port not set.  Exiting...');
    process.exit();
} else if (port != 8080) {
    isGenesis = false;
}

init();

function init() {
    console.log("running init()");
    if (isGenesis) {
        console.log(`getting blockchain from genesis node at: ${genesisNode}`);
        request(`http://${genesisNode}/blockchain`, function (error, response, body) {
            this.blockchain = body["blockchain"];
            this.pendingTransactions = body["transactions"];
            this.nodes = body["nodes"];
        });
    } else {
        this.blockchain = initBlockchain();
        this.pendingTransactions = [];
        this.nodes = [ genesisNode ];
    }
}


var homeFunc = function home(req, res) {
    console.log('running home');
    res.send('Mutech Blockchain running on port ' + port);
};

var blockchainFunc = function blockchain(req, res) {
    console.log('running blockchain');
    res.send(this.blockchain);
};

var registerFunc = function register(req, res) {
    console.log('running register');

    this.nodes.push(req["params"]["host"] + ":" + req["params"]["port"]);

    return res.send(this.blockchain);
};

var pingFunc = function ping(req, res) {
    console.log('running ping');
    res.send('OK');
};

var submitTransactionFunc = function submitTransaction(req, res) {
    console.log('running submitTransaction');

    this.pendingTransactions.push(req["transaction"]);

    var reqOptions = {
        'url': `http://${val}/submit`,
        'method': 'POST',
        'body': req
    }

    this.nodes.forEach(function (val, index, array) {
        reqOptions['url'] = val;
        request(reqOptions, function (err, res, body) {
            // ack
        });
    });
};

var publishBlockFunc = function publishBlock(req, res) {
    newTxsInChain = [];

    if (req["blockchain"].length <= this.blockchain.length) {
        return;
    }

    let block = {};
    for (block in req["blockchain"]) {
        let txId = block["transaction"]["id"];
        deleteTxFromPendingTransactions(txId);
    }

    this.blockchain = req["blockchain"];
};

var deleteTxFromPendingTransactions = function(id) {
    for (let i = 0; i < this.pendingTransactions.length; i += 1) {
        if (this.pendingTransactions[i]["id"] == id) {
            this.pendingTransactions = this.pendingTransactions.slice(0, i).concat(this.pendingTransactions.slice(i + 1));
            return;
        }
    }
}

var findProductIdHistoryFunc = function(productId) {
    let transactionHistory = [];
    while (true) {
        let tx = findTxFromProdIdInChain(productId);
        transactionHistory = [tx].concat(transactionHistory);
        if (tx["type"] == "CREATE") {
            return transactionHistory;
        } else {
            productId = tx["previousProductId"];
        }
    }
};

var findTxFromProdIdInChainFunc = function(prodId) {
    for (let i = 0; i < this.blockchain.length; i += 1) {
        if (this.blockchain[i]["transaction"]["productId"] == prodId) {
            return this.blockchain[i]["transaction"];
        }
    }
}

app.get('/', homeFunc);
app.get('/ping', pingFunc);
app.get('/register', registerFunc);
app.post('/submit_tx', submitTransactionFunc);
app.post('/publish_block', publishBlockFunc);
app.get('/product/{id}', findProductIdHistoryFunc);
app.get('/blockchain', blockchainFunc);

app.listen(port, () => console.log(`Blockchain app listening on port ${port}!`));

// put in a new thread/callback if necessary
let nonce = 1;
while (true) {
    nonce = findBlock();
}

function findBlock() {

    let newBlock = Blockchain.findBlock(nonce, this.pendingTransactions, this.blockchain);
    this.blockchain.push(newBlock);

    console.log('New block added to chain!');


    this.nodes.forEach(function (val, index, array) {
        var reqOptions = {
            'url': `http://${val}/publish_block`,
            'method': 'POST',
            'body': this.blockchain
        };
        reqOptions['url'] = val;
        console.log(`Notifying node: ${val} of new block.`);
        request(reqOptions, function (err, res, body) {
            // ack
        });
    });

    return newBlock["nonce"] + 1;
}









function initBlockchain() {
    return [
        {
            "blockId" : 123
        }
    ]
}