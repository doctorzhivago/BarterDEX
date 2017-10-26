import { observable, action } from 'mobx';
import { ipcRenderer } from 'electron';
import LoaderStore from './LoaderStore';
import NotifierStore from './NotifierStore';
import PortfolioStore from './PortfolioStore'
import OrderbookStore from './OrderbookStore'
import MarketStore from './MarketStore'

const shepherdIPC = (data) => { ipcRenderer.send('shepherd-command', data) }

export default class AppStore {

  @observable userpass = false;
  @observable coins = false;
  @observable mypubkey = false;

    constructor() {
        const self = this;
        this.notifier = new NotifierStore();
        this.loader = new LoaderStore();
        this.orderbook = new OrderbookStore();
        this.market = new MarketStore();

        this.portfolio = new PortfolioStore({
            defaultFiat: { type: 'usd', symbol: '$' },
            defaultCrypto: 'KMD',
            orderbookStore: this.orderbook,
            marketStore: this.market
        });

        /* set userpass */
        ipcRenderer.on('updateUserInfo', (e, { userpass, coins, mypubkey }) => {
            self.coins = coins;
            self.userpass = userpass;
            self.mypubkey = mypubkey;
            // start autorefresh of portfolio
            self.portfolio.autorefresh = setInterval(() => self.portfolio.refresh(), 6000)
        });

        ipcRenderer.on('resetUserInfo', () => {
            self.coins = '';
            self.userpass = '';
            self.mypubkey = '';
        })

        ipcRenderer.on('willClose', () => {
            this.logout();
            ipcRenderer.send('readyToQuit');
        })

        //  this.logout();
    }

  @action login = (passphrase) => {
      // send login passphrase
      shepherdIPC({ command: 'login', passphrase });
  }

  @action logout = () => {
      // send login passphrase
      this.portfolio.leave();
      shepherdIPC({ command: 'logout' });
  }

}
