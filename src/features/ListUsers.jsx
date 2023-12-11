import { socket } from "../App"
import DES from "../utils/des"

import { powMod } from "../utils/keygen"
import { encrypt_with_signature } from "../utils/utils"

const ListUsers = ({users, myKey, currentChat, setCurrentChat}) => {

    const onAddFriend = id => {
        const N1 = Date.now()
        localStorage.setItem('N1', N1)
        const friend = users.find(user => user.id === id)
        
        const friend_public_key = friend.public_key[0]
        const friend_n = friend.public_key[1]

        const message = N1 + ' ' + socket.id

        const encrypted_message = encrypt_with_signature(message, friend_public_key, friend_n, myKey.private_key, myKey.n)

        socket.emit('1', id, encrypted_message)
    }

    const onCurrentChatChange = id => {
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