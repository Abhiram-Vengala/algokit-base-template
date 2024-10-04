import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture, getTestAccount } from '@algorandfoundation/algokit-utils/testing';
import * as algokit from '@algorandfoundation/algokit-utils';
import { DnftLogidticsClient } from '../contracts/clients/DNFTLogidticsClient';
import { Address, decodeAddress } from 'algosdk';


const fixture = algorandFixture();
algokit.Config.configure({ populateAppCallResources: true });

let appClient: DnftLogidticsClient;

describe('HelloWorld', () => {
  beforeEach(fixture.beforeEach);

  beforeAll(async () => {
    await fixture.beforeEach();
    const { testAccount  } = fixture.context;
    const { algorand } = fixture;

    appClient = new DnftLogidticsClient(
      {
        sender: testAccount,
        resolveBy: 'id',
        id: 0,
      },
      algorand.client.algod
    );

    await appClient.create.createApplication({_name:"DynamicNft",_symbol:"DNFT"});
  });

  test('Minting_DNFT', async () => {
    await appClient.appClient.fundAppAccount(algokit.microAlgos(200000));
    const _mint = await appClient.mint({ _image:"Image Url", _tokenUri:"TokenURL which contains Token details", _to: 'SJXDVO6ABYAXS6S3QJPYN7PWMSW52FFUQQSYGZ4ABUD6RZU4R4FMVRW67Y' });
    const _owner = await  appClient.nftOwnerOf({_tokenId:0});
    expect(_owner.return?.valueOf()).toBe('SJXDVO6ABYAXS6S3QJPYN7PWMSW52FFUQQSYGZ4ABUD6RZU4R4FMVRW67Y');
    const _uri = await appClient.nftUri({_tokenId:0});
    expect(_uri.return?.valueOf()).toBe("TokenURL which contains Token details");
    const _image = await appClient.nftImage({_tokenId:0});
    expect(_image.return?.valueOf()).toBe("Image Url");
    const _totalSupply = await appClient.nftTotalSupply({});
    expect (_totalSupply.return?.valueOf()).toBe(BigInt(1));
  });

  test('Updating Token URI', async () => {

    const _newUri  = await appClient.nftUpgradeUri({_tokenUri:"New Token URI",_tokenId:0})
    const _getnewUri = await appClient.nftUri({_tokenId:0});
    expect(_getnewUri.return?.valueOf()).toBe("New Token URI");
  });
});
