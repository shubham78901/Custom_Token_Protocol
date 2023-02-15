import { expect } from 'chai'
import { toByteString } from 'scrypt-ts'
import { HelloWorld } from '../../src/contracts/helloWorld'

describe('Test SmartContract `HelloWorld`', () => {
    before(async () => {
        await HelloWorld.compile()
    })

    it('should pass the public method unit test successfully.', async () => {
        const helloWorld = new HelloWorld()
        const result = helloWorld.verify(() =>
            helloWorld.unlock(toByteString('hello world', true))
        )
        expect(result.success, result.error).to.eq(true)
    })
})
