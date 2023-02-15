import { expect } from 'chai'
import { PubKey, PubKeyHash, Sig, bsv, signTx, toHex } from 'scrypt-ts'
import { P2PKH } from '../../src/contracts/p2pkh'
import { newTx, inputIndex, inputSatoshis, dummyUTXO } from './util/txHelper'

const privateKey = bsv.PrivateKey.fromRandom('testnet')
const publicKey = privateKey.publicKey
const pkh = bsv.crypto.Hash.sha256ripemd160(publicKey.toBuffer())

const privateKey2 = bsv.PrivateKey.fromRandom('testnet')

describe('Test SmartContract `P2PKH`', () => {
    before(async () => {
        await P2PKH.compile()
    })

    it('should pass if use right privateKey', async () => {
        const tx = newTx()
        const demo = new P2PKH(PubKeyHash(toHex(pkh)))
        demo.to = { tx, inputIndex }

        const result = demo.verify(() => {
            const sig = signTx(
                tx,
                privateKey,
                demo.lockingScript,
                inputSatoshis
            )
            demo.unlock(Sig(toHex(sig)), PubKey(toHex(publicKey)))
        })

        expect(result.success).to.be.true
    })

    it('should pass if use right privateKey', async () => {
        const inputIndex = 0
        const p2pkh = new P2PKH(PubKeyHash(toHex(pkh)))
        const deployTx = p2pkh.getDeployTx([dummyUTXO], inputSatoshis)
        const callTx = p2pkh.getCallTx(publicKey, privateKey, deployTx).seal()

        const result = callTx.verifyInputScript(inputIndex)
        expect(result.success, result.error).to.eq(true)
    })

    it('should fail if use wrong privateKey', async () => {
        const tx = newTx()
        const demo = new P2PKH(PubKeyHash(toHex(pkh)))
        demo.to = { tx, inputIndex }

        expect(() => {
            demo.verify(() => {
                const sig = signTx(
                    tx,
                    privateKey2,
                    demo.lockingScript,
                    inputSatoshis
                )
                demo.unlock(Sig(toHex(sig)), PubKey(toHex(publicKey)))
            })
        }).to.throw(/Execution failed/)
    })
})
