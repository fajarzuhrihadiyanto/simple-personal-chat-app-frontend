import { socket } from "../App"
import DES from "../utils/des"

import { powMod } from "../utils/keygen"
import { encrypt_with_signature } from "../utils/utils"

const ListUsers = ({users, myKey, currentChat, setCurrentChat}) => {

    const onAddFriend = id => {
        console.log(users)
        console.log(id)
        console.log('====================|SEND 1|====================')
        const N1 = Date.now()
        localStorage.setItem('N1', N1)
        console.log('N1 ', N1)
        const my_id = socket.id
        const friend = users.find(user => user.id === id)
        
        console.log('friend ', friend)
        const friend_public_key = friend.public_key[0]
        const friend_n = friend.public_key[1]

        const message = N1 + ' ' + my_id
        console.log('message ', message)
        // const message_encoded = message.split('').map(char => char.charCodeAt(0))
        // console.log('message encoded ', message_encoded)
        // const encrypted_message = message_encoded.map(char => powMod(char, friend_public_key, friend_n))
        // console.log('encrypted message ', encrypted_message)
        // const signature = message_encoded.map(char => powMod(char, myKey.private_key, myKey.n))
        // console.log('signature ', signature)

        const encrypted_message = encrypt_with_signature(message, friend_public_key, friend_n, myKey.private_key, myKey.n)

        socket.emit('1', id, encrypted_message)
    }

    const onCurrentChatChange = id => {
        console.log('ganti ke ', id)
        setCurrentChat(id)
        socket.emit('pull chats', id)
    }

    return (
        <div>
            <h1>List User</h1>
            <ul>
                {users.map(user => (
                    <li key={user.id} data-id={user.id}>
                        {user.username} 
                        {(user.id !== socket.id) && (<>
                            {
                            user.isFriend
                            ? (user.id !== currentChat && <button type="button" onClick={() => {onCurrentChatChange(user.id)}}>chat</button>)
                            : <button type="button" onClick={() => {onAddFriend(user.id)}} data-id={user.id}>add friend</button>
                            } 
                        </>)}
                        
                    </li>
                    
                ))}
            </ul>
        </div>
    )
}

export default ListUsers