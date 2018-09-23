import React, { Component } from 'react';
import Eos from 'eosjs'; // https://github.com/EOSIO/eosjs
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

// material-ui dependencies
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';

import paillier from 'jspaillier';
import jsbn from 'jsbn';

// NEVER store private keys in any source code in your real life development
// This is for demo purposes only!
const accounts = [
  {"name":"useraaaaaaaa", "privateKey":"5K7mtrinTFrVTduSxizUc5hjXJEtTjVTsqSHeBHes1Viep86FP5", "publicKey":"EOS6kYgMTCh1iqpq9XGNQbEi8Q6k5GujefN9DSs55dcjVyFAq7B6b"},
  {"name":"useraaaaaaab", "privateKey":"5KLqT1UFxVnKRWkjvhFur4sECrPhciuUqsYRihc1p9rxhXQMZBg", "publicKey":"EOS78RuuHNgtmDv9jwAzhxZ9LmC6F295snyQ9eUDQ5YtVHJ1udE6p"},
  {"name":"useraaaaaaac", "privateKey":"5K2jun7wohStgiCDSDYjk3eteRH1KaxUQsZTEmTGPH4GS9vVFb7", "publicKey":"EOS5yd9aufDv7MqMquGcQdD6Bfmv6umqSuh9ru3kheDBqbi6vtJ58"},
  {"name":"useraaaaaaad", "privateKey":"5KNm1BgaopP9n5NqJDo9rbr49zJFWJTMJheLoLM5b7gjdhqAwCx", "publicKey":"EOS8LoJJUU3dhiFyJ5HmsMiAuNLGc6HMkxF4Etx6pxLRG7FU89x6X"},
  {"name":"useraaaaaaae", "privateKey":"5KE2UNPCZX5QepKcLpLXVCLdAw7dBfJFJnuCHhXUf61hPRMtUZg", "publicKey":"EOS7XPiPuL3jbgpfS3FFmjtXK62Th9n2WZdvJb6XLygAghfx1W7Nb"},
  {"name":"useraaaaaaaf", "privateKey":"5KaqYiQzKsXXXxVvrG8Q3ECZdQAj2hNcvCgGEubRvvq7CU3LySK", "publicKey":"EOS5btzHW33f9zbhkwjJTYsoyRzXUNstx1Da9X2nTzk8BQztxoP3H"},
  {"name":"useraaaaaaag", "privateKey":"5KFyaxQW8L6uXFB6wSgC44EsAbzC7ideyhhQ68tiYfdKQp69xKo", "publicKey":"EOS8Du668rSVDE3KkmhwKkmAyxdBd73B51FKE7SjkKe5YERBULMrw"}
];

const keys = paillier.generateKeys(32);  //1024
const publicKey = keys.pub;
const privateKey = keys.sec;

let mockProducts = [
    {"product": "productacc", "owners": {"shareholder1acc": 30, "shareholder2acc": 70}}
];

let mockShareholders = [
    {"shareholder": "shareholder1acc", "shares": {"productacc": 30}},
    {"shareholder": "shareholder2acc", "shares": {"productacc": 70}},
    {"shareholder": "buyeracc", "shares": {}}
];

let mockTransactions = [
    {
        "product": "productacc",
        "buyer": "buyeracc",
        "amount": 10,
        "votes": publicKey.encrypt(new jsbn.BigInteger('0'))
    }
];


// set up styling classes using material-ui "withStyles"
const styles = theme => ({
  card: {
    margin: 20,
  },
  paper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
  },
  formButton: {
    marginTop: theme.spacing.unit,
    width: "100%",
  },
  pre: {
    background: "#ccc",
    padding: 10,
    marginBottom: 0.
  },
});

// Index component
class Index extends Component {

  constructor(props) {
    super(props);
    this.state = {
      noteTable: [], // to store the table rows from smart contract
      productTable: mockProducts
    };
    this.handleFormEvent = this.handleFormEvent.bind(this);
  }

  // generic function to handle form events (e.g. "submit" / "reset")
  // push transactions to the blockchain by using eosjs
  async handleFormEvent(event) {
    // stop default behaviour
    event.preventDefault();

    // collect form data
    let account = event.target.account.value;
    let privateKey = event.target.privateKey.value;
    let note = event.target.note.value;

    // prepare variables for the switch below to send transactions
    let actionName = "";
    let actionData = {};

    // define actionName and action according to event type
    switch (event.type) {
      case "submit":
        actionName = "update";
        actionData = {
          _user: account,
          _note: note,
        };
        break;
      default:
        return;
    }

    // eosjs function call: connect to the blockchain
    const eos = Eos({keyProvider: privateKey});
    const result = await eos.transaction({
      actions: [{
        account: "notechainacc",
        name: actionName,
        authorization: [{
          actor: account,
          permission: 'active',
        }],
        data: actionData,
      }],
    });

    console.log(result);
    this.getTable();
  }

  // gets table data from the blockchain
  // and saves it into the component state: "noteTable"
  getTable() {
    const eos = Eos();
    eos.getTableRows({
      "json": true,
      "code": "notechainacc",   // contract who owns the table
      "scope": "notechainacc",  // scope of the table
      "table": "notestruct",    // name of the table as specified by the contract abi
      "limit": 100,
    }).then(result => this.setState({ noteTable: result.rows }));
  }

    getProducts() {
      const eos = Eos();
      eos.getTableRows({
          "json": true,
          "code": "productacc",   // contract who owns the table
          "scope": "productacc",  // scope of the table
          "table": "products",    // name of the table as specified by the contract abi
          "limit": 100,
      }).then(result => this.setState({ productTable: result.rows }));
  }

  componentDidMount() {
    this.getTable();
    this.getProducts();
  }

  render() {
      return <Router>
          <div>
              <Link to="/">Home</Link>&nbsp;&nbsp;
              <Link to="/productacc">Product</Link>&nbsp;&nbsp;
              <Link to="/buyeracc">Buyer</Link>&nbsp;&nbsp;
              <Link to="/shareholder1acc">Shareholder 1</Link>&nbsp;&nbsp;
              <Link to="/shareholder2acc">Shareholder 2</Link>

              <hr />

              <Route exact path="/" component={Home} />
              <Route path="/productacc" component={Product} />
              <Route path="/buyeracc" component={Buyer} />
              <Route path="/shareholder1acc" component={Shareholder1} />
              <Route path="/shareholder2acc" component={Shareholder2} />
          </div>
      </Router>
  }

}

class Home extends Component {
    render() {
        return <div>
            <h2>Home</h2>
        </div>;
    }
}

class Product extends Component {

    constructor(props) {
        super(props);
        this.state = {
            productTable: mockProducts,
            transactionTable: mockTransactions
        };
        this.handleFormEvent = this.handleFormEvent.bind(this);
    }

    async handleFormEvent(event) {
        // stop default behaviour
        event.preventDefault();

        // collect form data
        let account = event.target.account.value;
        let privateKey = event.target.privateKey.value;

        // prepare variables for the switch below to send transactions
        let actionName = "";
        let actionData = {};

        // define actionName and action according to event type
        switch (event.type) {
            case "submit":
                actionName = "finalize_transaction";
                actionData = {
                    _product: "productacc",
                    _buyer: "buyeracc",
                    _to_sell: true
                };
                break;
            default:
                return;
        }

        // eosjs function call: connect to the blockchain
        const eos = Eos({keyProvider: privateKey});
        const result = await eos.transaction({
            actions: [{
                account: "productacc",
                name: actionName,
                authorization: [{
                    actor: account,
                    permission: 'active',
                }],
                data: actionData,
            }],
        });

        console.log(result);
        this.getTransactionTable();
    }

    getTransactionTable() {
        const eos = Eos();
        eos.getTableRows({
            "json": true,
            "code": "productacc",   // contract who owns the table
            "scope": "productacc",  // scope of the table
            "table": "transactions",    // name of the table as specified by the contract abi
            "limit": 100,
        }).then(result => this.setState({ transactionTable: result.rows }));
    }

    onFinalize() {
        let transaction = mockTransactions[0];
        mockShareholders[0].shares = {"productacc": 30 - 3};
        mockShareholders[1].shares = {"productacc": 70 - 7};
        mockShareholders[2].shares = {"productacc": 10};

        mockProducts[0].owners = {"shareholder1acc": 27, "shareholder2acc": 63, "buyeracc": 10};

        this.setState({
            productTable: mockProducts,
            transactionTable: mockTransactions
        });
    }

    render() {
        const { transactionTable } = this.state;
        console.log('##########');
        let v = publicKey.encrypt(new jsbn.BigInteger('1'));
        v = publicKey.add(v,
            publicKey.encrypt(new jsbn.BigInteger('100')));
        let result = privateKey.decrypt(v).toString(10);
        console.log('++++++', result, v, new jsbn.BigInteger(v));

        const generateCard = (product, buyer, amount, votes) => {
            return (
                <Card key={product}>
                    <CardContent>
                        <Typography variant="headline" component="h3">
                            {product} - {buyer} - {amount}
                        </Typography>
                        <Typography>
                            Votes: {privateKey.decrypt(votes).toString(10)}
                        </Typography>
                        <Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                type="submit"
                                onClick={() => this.onFinalize()}>
                                Finalize
                            </Button>&nbsp;&nbsp;
                        </Typography>
                    </CardContent>
                </Card>
            );
        };

        let transactionCards = mockTransactions.map(item =>
            generateCard(item.product, item.buyer, item.amount, item.votes));

        let productShares = [];
        for(var key in mockProducts[0].owners) {
            productShares.push(key + " - " + mockProducts[0].owners[key]);
        }

        return <div>
            <h2>Product shares</h2>
            {productShares.join(' | ')}
            <h4>Product transaction state</h4>
            {transactionCards}
        </div>;
    }
}

class Buyer extends Component {

    constructor(props) {
        super(props);
        this.state = {
            productTable: mockProducts
        };
        this.handleFormEvent = this.handleFormEvent.bind(this);
    }

    async handleFormEvent(event) {
        // stop default behaviour
        event.preventDefault();

        // collect form data
        let account = event.target.account.value;
        let privateKey = event.target.privateKey.value;

        // prepare variables for the switch below to send transactions
        let actionName = "";
        let actionData = {};

        // define actionName and action according to event type
        switch (event.type) {
            case "submit":
                actionName = "finalize_transaction";
                actionData = {
                    _product: "productacc",
                    _buyer: "buyeracc",
                    _to_sell: true
                };
                break;
            default:
                return;
        }

        // eosjs function call: connect to the blockchain
        const eos = Eos({keyProvider: privateKey});
        const result = await eos.transaction({
            actions: [{
                account: "productacc",
                name: actionName,
                authorization: [{
                    actor: account,
                    permission: 'active',
                }],
                data: actionData,
            }],
        });

        console.log(result);
        this.getTransactionTable();
    }

    getTransactionTable() {
        const eos = Eos();
        eos.getTableRows({
            "json": true,
            "code": "productacc",   // contract who owns the table
            "scope": "productacc",  // scope of the table
            "table": "transactions",    // name of the table as specified by the contract abi
            "limit": 100,
        }).then(result => this.setState({ transactionTable: result.rows }));
    }

    render() {
        const { productTable } = this.state;

        const generateCard = (product_id, owners) => {
            let ownersData = [];
            for(var key in owners) {
                ownersData.push(key + " - " + owners[key]);
            }
            return (
                <Card key={product_id}>
                    <CardContent>
                        <Typography variant="headline" component="h3">
                            {product_id}
                        </Typography>
                        <Typography>
                            Owners: <br />{ownersData.join(' | ')}
                        </Typography>
                        <Typography>
                            <p>Buy amount:</p>
                            <TextField
                                name="amount"
                                autoComplete="off"
                                label="Amount"
                                margin="normal"
                                multiline
                                rows="1"
                                fullWidth
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                type="submit">
                                Send request
                            </Button>
                        </Typography>
                    </CardContent>
                </Card>
            );
        };
        let productCards = productTable.map(item =>
            generateCard(item.product, item.owners));

        return (
            <div>
                <h2>Available products</h2>
                {productCards}
            </div>
        );
    }
}

class Shareholder1 extends Component {

    constructor(props) {
        super(props);
        this.state = {
            productTable: mockProducts,
            transactionTable: mockTransactions,
            shareholder: mockShareholders[0]
        };
        //this.handleFormEvent = this.handleFormEvent.bind(this);
    }

    onAccept() {
        const { transactionTable } = this.state;
        const transaction = transactionTable[0];
        console.log('---------', mockTransactions[0].votes);
        mockTransactions[0].votes = publicKey.add(
            mockTransactions[0].votes,
            publicKey.encrypt(new jsbn.BigInteger(this.state.shareholder.shares[this.state.productTable[0].product].toString())));
        console.log('---------', mockTransactions[0].votes);
        this.setState({transactionTable: [transaction]})
    }

    render() {
        const { transactionTable } = this.state;

        const generateCard = (product, buyer, amount, votes) => {
            return (
                <Card key={product}>
                    <CardContent>
                        <Typography variant="headline" component="h3">
                            {product} - {buyer} - {amount}
                        </Typography>
                        <Typography>
                            Votes (encrypted): {votes.toString()}
                        </Typography>
                        <Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                type="submit"
                                onClick={() => this.onAccept()}>
                                Accept
                            </Button>&nbsp;&nbsp;
                            <Button
                                variant="contained"
                                color="primary"
                                type="submit">
                                Reject
                            </Button>
                        </Typography>
                    </CardContent>
                </Card>
            );
        };

        let transactionCards = transactionTable.map(item =>
            generateCard(item.product, item.buyer, item.amount, item.votes));

        return <div>
            <h2>Shareholder1: Transactions to vote</h2>
            {transactionCards}
        </div>
    }
}

class Shareholder2 extends Component {

    constructor(props) {
        super(props);
        this.state = {
            productTable: mockProducts,
            transactionTable: mockTransactions,
            shareholder: mockShareholders[1]
        };
        //this.handleFormEvent = this.handleFormEvent.bind(this);
    }

    onAccept() {
        const { transactionTable } = this.state;
        const transaction = transactionTable[0];
        console.log('---------', mockTransactions[0].votes);
        mockTransactions[0].votes = publicKey.add(
            mockTransactions[0].votes,
            publicKey.encrypt(new jsbn.BigInteger(this.state.shareholder.shares[this.state.productTable[0].product].toString())));
        console.log('---------', mockTransactions[0].votes);
        this.setState({transactionTable: [transaction]})
    }

    render() {
        const { transactionTable } = this.state;

        const generateCard = (product, buyer, amount, votes) => {
            return (
                <Card key={product}>
                    <CardContent>
                        <Typography variant="headline" component="h3">
                            {product} - {buyer} - {amount}
                        </Typography>
                        <Typography>
                            Votes (encrypted): {votes.toString()}
                        </Typography>
                        <Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                type="submit"
                                onClick={() => this.onAccept()}>
                                Accept
                            </Button>&nbsp;&nbsp;
                            <Button
                                variant="contained"
                                color="primary"
                                type="submit">
                                Reject
                            </Button>
                        </Typography>
                    </CardContent>
                </Card>
            );
        };

        let transactionCards = transactionTable.map(item =>
            generateCard(item.product, item.buyer, item.amount, item.votes));

        return <div>
            <h2>Shareholder2: Transactions to vote</h2>
            {transactionCards}
        </div>
    }
}

export default withStyles(styles)(Index);
