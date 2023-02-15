import { exit } from 'process'
import { bsv } from 'scrypt-ts'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

const dotenvConfigPath = '.env'
dotenv.config({ path: dotenvConfigPath })

// fill in private key on testnet in WIF here
const privKey: string = process.env.PRIVATE_KEY || ''
if (!privKey) {
    genPrivKey()
} else {
    console.log(`Private key already generated. 
You can fund its address '${bsv.PrivateKey.fromWIF(
        privKey
    ).toAddress()}' from the sCrypt faucet https://scrypt.io/#faucet`)
}

export function genPrivKey() {
    const newPrivKey = bsv.PrivateKey.fromRandom('testnet')
    console.log(`Missing private key, generating a new one ...
Private key generated: '${newPrivKey.toWIF()}'
You can fund its address '${newPrivKey.toAddress()}' from sCrypt faucet https://scrypt.io/#faucet`)
    // auto generate .env file with new generated key
    fs.writeFileSync(
        dotenvConfigPath,
        `# You can fund its address '${newPrivKey.toAddress()}' from the sCrypt faucet https://scrypt.io/#faucet
PRIVATE_KEY="${newPrivKey}"`
    )
    exit(-1)
}

export const myPrivateKey = bsv.PrivateKey.fromWIF(privKey)
export const myPublicKey = bsv.PublicKey.fromPrivateKey(myPrivateKey)
export const myPublicKeyHash = bsv.crypto.Hash.sha256ripemd160(
    myPublicKey.toBuffer()
)
export const myAddress = myPublicKey.toAddress()
