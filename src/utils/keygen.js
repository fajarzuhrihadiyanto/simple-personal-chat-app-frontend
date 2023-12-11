const randintBetween = (min, max) => {
    return Math.floor(Math.random() * (max - min) + min)
}

export const powMod = (b, e, m) => {
    if (m === 1) return 0
    let c = 1
    for(let e_prime = 0; e_prime < e; e_prime++) {
        c = (c * b) % m
    }

    return c
}

const gcd = (a, b) => {
    if (b) return gcd(b, a % b)
    return Math.abs(a)
}

const isPrime = number => {
    if (number < 2) return false

    for (let i = 2; i < number / 2 + 1; i++) {
        if (number % i === 0) return false
    }

    return true
}

const generatePrime = (min, max) => {
    let res = randintBetween(min, max)
    while (!isPrime(res)) {
        res = randintBetween(min, max)
    }

    return res
}

const modInverse = (e, phi) => {
    for(let d = 3; d <= phi; d++) {
        if ((d*e) % phi === 1) return d
    }
    return 0
}

const generateKey = () => {
    const p = generatePrime(2, 100)
    let q = generatePrime(2, 100)

    while (p === q) {
        q = generatePrime(2, 100)
    }

    const n = p * q
    const phi_n = (p-1) * (q-1)

    let e = randintBetween(3, phi_n-1)
    while (gcd(e, phi_n) !== 1) {
        e = randintBetween(3, phi_n-1)
    }

    const d = modInverse(e, phi_n)

    return {
        public_key: e,
        private_key: d,
        n
    }
}

// const key = generateKey()
// const pub = key.public_key
// const priv = key.private_key
// const n = key.n

// const message = 'lorem ipsum'
// let message_encoded = message.split('').map(char => char.charCodeAt(0))

// console.log('MESSAGE : ', message)
// console.log('MESSAGE ENCODED : ', message_encoded)

// const encrypted_message = message_encoded.map(char => powMod(char, pub, n))
// console.log('ENCRYPTED MESSAGE : ', encrypted_message)

// message_encoded = encrypted_message.map(crypt => powMod(crypt, priv, n))
// console.log('PLAIN MESSAGE AFTER DECRYPT : ', message_encoded)
// const plain_text = message_encoded.map(char => String.fromCharCode(char)).join('')
// console.log('PLAIN TEXT : ', plain_text)

export default generateKey
