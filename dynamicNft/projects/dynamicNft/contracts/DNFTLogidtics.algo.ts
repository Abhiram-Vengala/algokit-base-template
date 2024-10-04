import { Contract } from '@algorandfoundation/tealscript';

type token = {owner:Address ; tokenUri : string ; image : string ; control :Address};
type parcelStatus = {currentLocation:string ; status:string ; lastUpdated :uint64};
export class DNFTLogidtics extends Contract {
  counter = GlobalStateKey<uint64>();
  name = GlobalStateKey<string>();
  symbol = GlobalStateKey<string>();
  tokens = BoxMap<uint64,token>();
  ownerBox = BoxMap<Address , uint64[]>();
  approvalAll = BoxMap<StaticArray<Address,2>,bytes>();
  parcelDeatils = BoxMap<uint64,parcelStatus>({allowPotentialCollisions:true});
  registeredCompany = BoxMap<Address,boolean>({allowPotentialCollisions:true});
  createApplication(_name:string , _symbol:string): void {
    this.name.value = _name;
    this.symbol.value = _symbol;
  }

  private updateTransfer(_from:Address, _to:Address,_tokenId:uint64){
    let index:uint64 = 0;
    let i:uint64 =0;
    const len = this.ownerBox(_from).value.length;

    for(i;i<len;i=i+1){
      if(this.ownerBox(_from).value[i]===_tokenId){
        index =1;
      }
    }
    this.ownerBox(_from).value.splice(index,1);
    if(this.ownerBox(_to).exists){
      this.ownerBox(_to).value.push(_tokenId);
    }else{
      this.ownerBox(_to).value = [_tokenId];
    }
  }

  private transferTo(_to:Address,_tokenId:uint64){
    assert(this.tokens(_tokenId).exists);
    this.tokens(_tokenId).value.owner = _to;
    this.tokens(_tokenId).value.control = globals.zeroAddress;
  }

  nft_ownerOf(_tokenId:uint64):Address{
    assert(this.tokens(_tokenId).exists);
    return this.tokens(_tokenId).value.owner;
  }

  nft_uri(_tokenId:uint64):string{
    assert(this.tokens(_tokenId).exists);
    return this.tokens(_tokenId).value.tokenUri;
  }

  nft_Image(_tokenId:uint64):string{
    assert(this.tokens(_tokenId).exists);
    return this.tokens(_tokenId).value.image;  
  }

  nft_totalSupply():uint64{
    return this.counter.value;
  }

  nft_getApproved(_tokenId:uint64):Address{
    return this.tokens(_tokenId).value.control;
  }

  nft_isApprovedForAll(_owner:Address,_operator:Address):boolean{
    const control : StaticArray<Address,2> = [_owner,_operator];
    if(this.approvalAll(control).exists) return true;
    return false;
  }

  nft_balaceOf(_owner:Address):uint64{
    assert(this.ownerBox(_owner).exists);
    return this.ownerBox(_owner).value.length;
  }

  nft_getAllTokenNftIds(_owner:Address):uint64[]{
    assert(this.ownerBox(_owner).exists);
    return this.ownerBox(_owner).value;
  }

  nft_getTokenDetails(_tokenId:uint64):token{
    assert(this.tokens(_tokenId).exists);
    return this.tokens(_tokenId).value;
  }

  nft_approve(_approved:Address,_tokenId:uint64):void{
    assert(this.tokens(_tokenId).exists);
    assert(this.txn.sender===this.tokens(_tokenId).value.owner);

    this.tokens(_tokenId).value.control = _approved;
  }

  nft_setApprovalForAll(_operator:Address,_approved:boolean):void{
    const control:StaticArray<Address,2> = [this.txn.sender,_operator];

    if(_approved) this.approvalAll(control).value ="";
    else this.approvalAll(control).delete();
  }

  nft_upgradeUri(_tokenUri:string,_tokenId:uint64):void{
    assert(this.tokens(_tokenId).exists);
    this.tokens(_tokenId).value.tokenUri=_tokenUri;
  }

  nft_trasferFrom(_from:Address , _to:Address,_tokenId:uint64):void{
    const ownerNft = this.tokens(_tokenId).value.owner;
    const control:StaticArray<Address,2> = [ownerNft,this.txn.sender];

    if(this.txn.sender===this.tokens(_tokenId).value.owner || this.tokens(_tokenId).value.control===this.txn.sender || this.approvalAll(control).exists){
      this.transferTo(_to,_tokenId);
      this.updateTransfer(_from,_to,_tokenId);
    }
    else{
      throw Error("Not authorized");
    }
  }

  mint(_image :string,_tokenUri:string,_to:Address):void{
    assert(this.counter.value<1000);
    assert(this.txn.sender===this.app.creator);

    // verifyTxn(this.txnGroup[0],{typeEnum: TransactionType.Payment});
    // verifyTxn(this.txnGroup[0],{amount:{greaterThanEqualTo:1_000_000}});
    // verifyTxn(this.txnGroup[0],{receiver:this.app.creator});

    // verifyTxn(this.txnGroup[1],{typeEnum:TransactionType.Payment});
    // verifyTxn(this.txnGroup[1],{receiver:this.app.creator});
    // verifyTxn(this.txnGroup[1],{amount:{greaterThanEqualTo:1_000_000}});

    const Token :token ={
      owner:_to,
      tokenUri:_tokenUri,
      image:_image,
      control:globals.zeroAddress
    };

    this.tokens(this.counter.value).value = Token;
    if(this.ownerBox(_to).exists){
      this.ownerBox(_to).value.push(this.counter.value);
    }else{
      this.ownerBox(_to).value = [this.counter.value];
    }
    this.counter.value = this.counter.value + 1;
  }

  registerCompany(_companyAddress:Address):void{
    assert(this.txn.sender==this.app.creator);
    this.registeredCompany(_companyAddress).value = true;
  }

  createParcel(_image :string,_tokenUri:string, _initialLocation:string , _status:string , _lastUpdated:uint64 ):void{
    assert(this.registeredCompany(this.txn.sender).value===true);
    let parcel : parcelStatus = {currentLocation: _initialLocation,status:_status,lastUpdated:_lastUpdated};
    this.parcelDeatils(this.counter.value).value = parcel;
    this.mint(_image,_tokenUri,this.txn.sender);
  }

  updateParcel(_tokenId:uint64,_currentLocation:string , _status:string , _lastUpdated:uint64 ) : void{
    assert(this.registeredCompany(this.txn.sender).exists);
    assert(this.parcelDeatils(_tokenId).exists);
    this.parcelDeatils(_tokenId).value.currentLocation=_currentLocation;
    this.parcelDeatils(_tokenId).value.status=_status;
    this.parcelDeatils(_tokenId).value.lastUpdated=_lastUpdated;
  }

  getParcelDetails(_tokenId:uint64):parcelStatus{
    assert(this.parcelDeatils(_tokenId).exists);
    return this.parcelDeatils(_tokenId).value;
  }

  getAppCreatorAddress():Address{
    return this.app.creator;
  }

}
