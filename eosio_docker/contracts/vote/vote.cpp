#include <eosiolib/eosio.hpp>
#include <eosiolib/print.hpp>


class vote : public eosio::contract {
   public:
      using contract::contract;

      /// @abi action
      void create_shareholder ( account_name owner, std::string& note ) {
         require_auth( owner );

         eosio_assert( _shareholders.find( owner ) == _shareholders.end(), "This shareholder already exists in the db" );

         _shareholders.emplace( owner, [&]( auto& sharehldr ) {
            sharehldr.owner    = owner;
            sharehldr.shares   = {};
            sharehldr.note     = note;
         });
      }

      /// @abi action
      void create_product ( account_name product, std::map<account_name, double> owners, uint64_t publickey, std::string& note ) {
         // also update shareholders shares table 
         require_auth( product );

         eosio_assert( _products.find( product ) == _products.end(), "This product already exists in the db" );

         for (auto const& x : owners) {
            account_name owner = x.first;
            double amount = x.second;
            eosio_assert( _shareholders.find( owner ) != _shareholders.end(), "No shareholder found in the db" );
            eosio_assert( amount <= 0.0, "Amount should be positive" );

            auto itr = _shareholders.find( owner );
            _shareholders.modify( itr, owner, [&]( auto& sharehldr ) {
                  sharehldr.shares.insert(product, amount);
            });
         }

         _products.emplace( product, [&]( auto& prdct ) {
            prdct.product      = product;
            prdct.owners       = owners;
            prdct.note         = note;
            prdct.publickey    = publickey;
         });
      }

      /// @abi action
      void start_transaction ( account_name buyer, account_name product, double amount ) {
         // require_auth( product );

         eosio_assert( _shareholders.find( buyer ) != _shareholders.end(), "No shareholder found in the db" );
         eosio_assert( _products.find( amount ) != _products.end(), "No product found in the db" );
         eosio_assert( amount <= 0.0, "Amount should be positive" );

         // check there is no transaction pair for buyer, product

         //std::pair<account_name,account_name> pr (buyer, product);
         auto itr = _transactions.find( product );
         // create transaction with the input
         _transactions.emplace( itr, product, [&]( auto& trnsctn ) {
            trnsctn.product      = product;
            trnsctn.buyer        = buyer;
            trnsctn.amount       = amount;
         });

      }

      /// @abi action
      void vote_transaction ( account_name owner, account_name buyer, account_name product, uint64_t votes ) {
         // get transaction, modify votes
         //std::pair<account_name,account_name> pr (buyer, product);
         auto itr = _transactions.find( product );

         _transactions.modify( itr, product, [&]( auto& trnsctn ) {
            trnsctn.votes = votes;
         });
         
      }

      /// @abi action
      void finalize_transaction ( account_name product, account_name buyer, bool to_sell ) {
         // get transaction, make decision to sell, update shares
         // require_auth( product );
         auto itr_transaction = _transactions.find( product );
         auto itr_product = _products.find( product );
         if ( to_sell ) {
            double sell_amount = itr_transaction.amount;
            for (auto const& x : itr_product->owners) {
               account_name owner = x.first;
               double amount = x.second;

               auto itr_shareholder = _shareholders.find( owner );

               if (amount <= sell_amount) {
                  sell_amount = sell_amount - amount;
                  _products.modify( itr_product, product, [&]( auto& prdtc ) {
                     prdtc.owners.erase(owner);
                  });
                  _shareholders.modify ( itr_shareholder, owner, [&]( auto& sharehldr ) {
                     sharehldr.shares.erase(product);
                  });
               } else {
                  _products.modify( itr_product, product, [&]( auto& prdtc ) {
                     prdtc.owners[owner] = prdtc.owners[owner] - sell_amount;
                  });
                  _shareholders.modify ( itr_shareholder, owner, [&]( auto& sharehldr ) {
                     sharehldr.shares[product] = sharehldr.shares[product] - sell_amount;
                  });
                  sell_amount = 0;
                  break;
               }
            }
         }
         //std::pair<account_name,account_name> pr (buyer, product);
         auto itr = _transactions.find( product );

         _transactions.modify( itr_transaction, [&]( auto& trnsctn ) {
            trnsctn.to_sell = to_sell;
         });
         // make sell decision
         // calculate share updates
         // commit updates to products and shareholders
         // commit update to transaction
      }
       
   private: 
      /// @abi table shareholders                   
      struct shareholder {
         account_name                     owner; // primary key
         std::map<account_name, double> shares; // product_id, amount
         std::string                      note;

         account_name primary_key() const { return owner; }
      };

      typedef eosio::multi_index< N(shareholders), shareholder,
         eosio::indexed_by<N(primary_key), eosio::const_mem_fun<shareholder, account_name, &shareholder::primary_key> >
      > shareholder_table;
      shareholder_table _shareholders;

      /// @abi table products
      struct product {
         account_name                     product; // primary key
         std::map<account_name, double>   owners; // shareholder_id, amount
         std::string                      note;
         uint64_t                         publickey;

         account_name primary_key() const { return product; }
      };

      typedef eosio::multi_index< N(products), product,
         eosio::indexed_by<N(primary_key), eosio::const_mem_fun<product, account_name, &product::primary_key> >
      > product_table;
      product_table _products;

      /// @abi table transactions
      struct transaction {
         //std::pair<account_name,account_name> transaction;
         account_name                         transaction;
         account_name                         product;
         account_name                         buyer; //shareholder
         double                              amount;
         uint64_t                            votes;  // encrypted
         std::string                         status; // initialized, voting or completed
         bool                                to_sell;

         //std::pair<account_name,account_name> primary_key() const { return transaction; }
         account_name primary_key() const { return transaction; }
         account_name by_product() const { return product; }
         account_name by_buyer() const { return buyer; }
      };

      typedef eosio::multi_index< N(transactions), transaction,
         eosio::indexed_by<N(primary_key), eosio::const_mem_fun<transaction, account_name, &transaction::primary_key> >
         //eosio::indexed_by<N(primary_key), eosio::const_mem_fun<transaction, std::pair<account_name,account_name>, &transaction::primary_key> >
      > transaction_table;

      transaction_table _transactions;
};

EOSIO_ABI( vote, (create_shareholder)(create_product)(start_transaction)(vote_transaction)(finalize_transaction) )