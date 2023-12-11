import React from "react";
import * as socketIO from "socket.io-client";

import ListUsers from "./features/ListUsers";
import UsernameForm from "./features/UsernameForm";
import Chat from "./features/Chat";

import generateKey from "./utils/keygen";
import { decrypt_with_signature, encrypt_with_signature } from "./utils/utils";
import DES from "./utils/des";

export const socket = socketIO.connect('http://localhost:3000');

function App() {

  const [users, setUsers] = React.useState([])
  const [key, setKey] = React.useState({
    public_key: null,
    private_key: null,
    n: null
  })

  const [currentChat, setCurrentChat] = React.useState(null)
  const [chats, setChats] = React.useState([])

  React.useEffect(() => {
    socket.once('connect', () => {
      const key = generateKey()
      const {public_key, private_key, n} = key

      setKey({
        public_key,
        private_key,
        n
      })

      socket.emit('store public key', [public_key, n])
    })

    socket.on('list users', listUsers => {
      setUsers(listUsers)
    })

    socket.on('new user', newUser => {
      setUsers(users => ([...users, newUser]))
    })

    socket.on('new public key', (id, key) => {
      setUsers(users => users.map(user => {
        return user.id === id
        ? {
          ...user,
          public_key: key
        }
        : user
      }))
    }) 

    socket.on('change username', (id, newUsername) => {
      setUsers(users => users.map(user => {
        return user.id === id 
        ? {
          ...user,
          username: newUsername
        }
        : user
      }))
    })

    socket.on('user leave', (id) => {
      setUsers(users => users.filter(user => user.id !== id))
    })
  }, [])


  React.useEffect(() => {
    const listener1 = (id, message) => {
      const friend = users.find(user => user.id === id)
      const friend_public_key = friend.public_key[0]
      const friend_n = friend.public_key[1]

      const private_key = key.private_key
      const n = key.n

      const decrypted = decrypt_with_signature(message, friend_public_key, friend_n, private_key, n)
    
      if (decrypted !== '') {
        const [N1, idCheck] = decrypted.split(' ')
        localStorage.setItem('N1', N1)

        if (idCheck === id) {
          const N2 = Date.now()

          localStorage.setItem('N2', N2)
  
          const message = N1 + ' ' + N2
          const encrypted_message = encrypt_with_signature(message, friend_public_key, friend_n, private_key, n)
  
          socket.emit('2', id, encrypted_message)
        }
      }
    }
    socket.on('1', listener1)

    const listener2 = (id, message) => {
      const friend = users.find(user => user.id === id)
      const friend_public_key = friend.public_key[0]
      const friend_n = friend.public_key[1]

      const private_key = key.private_key
      const n = key.n

      const decrypted = decrypt_with_signature(message, friend_public_key, friend_n, private_key, n)

      if (decrypted !== '') {
        const N1check = localStorage.getItem('N1')
        const [N1, N2] = decrypted.split(' ')
        if (N1 === N1check) {
          const message = N2
          const encrypted_message = encrypt_with_signature(message, friend_public_key, friend_n, private_key, n)
  
          socket.emit('3', id, encrypted_message)
        }
      }
    }
    socket.on('2', listener2)

    const listener3 = (id, message) => {
      const friend = users.find(user => user.id === id)
      const friend_public_key = friend.public_key[0]
      const friend_n = friend.public_key[1]

      const private_key = key.private_key
      const n = key.n

      const decrypted = decrypt_with_signature(message, friend_public_key, friend_n, private_key, n)

      if (decrypted !== '') {
        const N2 = decrypted
        const N2check = localStorage.getItem('N2')
        if (N2 === N2check) {
          const N1 = localStorage.getItem('N1')
          const session_key = Date.now().toString(36)

          setUsers(users => users.map(user => {
            const new_user = {
              ...user,
              session_key,
              isFriend: true,
              des: new DES(session_key)
            }

            return user.id === id
            ? new_user
            : user
          }))

          const message = N1 + ' ' + session_key
          const encrypted_message = encrypt_with_signature(message, friend_public_key, friend_n, private_key, n)
          socket.emit('4', id, encrypted_message)
        }
      }
    }
    socket.on('3', listener3)

    const listener4 = (id, message) => {
      const friend = users.find(user => user.id === id)
      const friend_public_key = friend.public_key[0]
      const friend_n = friend.public_key[1]

      const private_key = key.private_key
      const n = key.n

      const decrypted = decrypt_with_signature(message, friend_public_key, friend_n, private_key, n)

      if (decrypted !== '') {

        const [N1, session_key] = decrypted.split(' ')
        const N1check = localStorage.getItem('N1')
        if (N1 === N1check) {
          setUsers(users => users.map(user => {
            const new_user = {
              ...user,
              session_key,
              isFriend: true,
              des: new DES(session_key)
            }

            return user.id === id
            ? new_user
            : user
          }))

          socket.emit('confirm add friend', id)
        }
      }
    }
    socket.on('4', listener4)

    const listener5 = id => {
      const username = users.find(user => user.id === id).username
      const message = 'you have been added by ' + username
      alert(message)
    }
    socket.on('confirm add friend', listener5)

    return () => {
      socket.off('1', listener1)
      socket.off('2', listener2)
      socket.off('3', listener3)
      socket.off('4', listener4)
      socket.off('confirm add friend', listener5)
    }

  }, [users, key.n, key.private_key])

  React.useEffect(() => {
    const listener_chat = (id, message) => {
      const user = users.find(user => user.id === id)
      const des = user.des
      if (currentChat === id) {
        setChats(chats => [...chats, {
          ...message,
          content: des.decrypt(message.content)
        }])
      }
    }
    socket.on('new chat', listener_chat)

    const listener_pull_chat = (id, messages) => {
      const user = users.find(user => user.id === id)
      const des = user.des

      const decryptedMessages = messages.map(message => ({
        ...message,
        content: des.decrypt(message.content)
      }))
      setChats(decryptedMessages)
    }
    socket.on('pull chats', listener_pull_chat)

    return () => {
      socket.off('new chat', listener_chat)
      socket.off('pull chats', listener_pull_chat)
    }
  }, [users, currentChat])


  return (
    <div className="App" style={{display: 'flex', gap: '20px'}}>
      <div style={{padding: '20px'}}>
        <UsernameForm/>
        <ListUsers users={users} myKey={key} currentChat={currentChat} setCurrentChat={setCurrentChat}/>
      </div>
      <Chat users={users} currentChat={currentChat} chats={chats}/>
    </div>
  );
}

export default App;
