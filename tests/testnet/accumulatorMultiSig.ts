import { AccumulatorMultiSig } from '../../src/contracts/accumulatorMultiSig'
import {
    getTestnetSigner,
    inputIndex,
    inputSatoshis,
    outputIndex,
    randomPrivateKey,
} from './util/txHelper'
import { myPrivateKey } from './util/privateKey'
import { bsv, PubKey, Ripemd160, Sig, toHex, utxoFromOutput,toByteString} from 'scrypt-ts'

async function main() {
    const [privateKey1, publicKeyHash1, address1] = randomPrivateKey()
    // const [privateKey2, , publicKeyHash2, address2] = randomPrivateKey()
    // const [privateKey3, , publicKeyHash3, address3] = randomPrivateKey()
    const Token_Name="ShubhamToken"

    const Protocol_Name="TimesChain-protocol"

    const Token_Symbol='Shubh'

    const Token_supply=15

    const decimal=100

    const Locked_Satoshi_In_contract=Token_supply*decimal;

    const Data_On_chain=" Token_Name:"+Token_Name+" Protocol_Name:"+Protocol_Name+" Token_Symbol:"+Token_Symbol+" Token_Supply:"+Token_supply+" Decimal:"+decimal


    await AccumulatorMultiSig.compile()
    const accumulatorMultiSig = new AccumulatorMultiSig(1n, toByteString(Data_On_chain,true),[
        Ripemd160(toHex(publicKeyHash1))
    ])

    const signer = await getTestnetSigner([
        myPrivateKey,
        privateKey1
    ])
   

 
    // connect to a signer
    await accumulatorMultiSig.connect(signer)

    // deploy
    const deployTx = await accumulatorMultiSig.deploy(Locked_Satoshi_In_contract)
    console.log('AccumulatorMultiSig contract deployed: ', deployTx.id)

    // call
   
    const changeAddress = await signer.getDefaultAddress()
    const unsignedCallTx: bsv.Transaction = await new bsv.Transaction()
        .addInputFromPrevTx(deployTx)
        .change(changeAddress)
        .setInputScriptAsync({ inputIndex }, (tx: bsv.Transaction) => {
            // bind contract & tx unlocking relation
            accumulatorMultiSig.to = { tx, inputIndex }
            // use the cloned version because this callback may be executed multiple times during tx building process,
            // and calling contract method may have side effects on its properties.
            return accumulatorMultiSig.getUnlockingScript(async (cloned) => {
                const spendingUtxo = utxoFromOutput(deployTx, outputIndex)

                const sigResponses = await signer.getSignatures(tx.toString(), [
                    {
                        inputIndex,
                        satoshis: spendingUtxo.satoshis,
                        scriptHex: spendingUtxo.script,
                        address: [address1],
                    },
                ])

                const sigs = sigResponses.map((sigResp) => sigResp.sig)
                const pubKeys = sigResponses.map((sigResp) => sigResp.publicKey)

                cloned.main(
                    [
                        PubKey(pubKeys[0]),
                      
                    ],
                    [Sig(sigs[0])],
                    [true]
                )
            })
        })
    const callTx = await signer.signAndsendTransaction(unsignedCallTx)
    console.log('AccumulatorMultiSig contract called: ', callTx.id)
}

describe('Test SmartContract `AccumulatorMultiSig` on testnet', () => {
    it('should succeed', async () => {
        await main()
    })
})
