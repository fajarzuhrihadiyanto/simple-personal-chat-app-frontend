import React from "react";
import * as socketIO from "socket.io-client";

import ListUsers from "./features/ListUsers";
import UsernameForm from "./features/UsernameForm";
import Chat from "./features/Chat";

import generateKey, { powMod } from "./utils/keygen";
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
      console.log(socket)

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
      console.log('LIST USERS : ', listUsers)
      setUsers(listUsers)
    })

    socket.on('new user', newUser => {
      console.log('NEW USER : ', newUser)
      setUsers(users => ([...users, newUser]))
    })

    socket.on('new public key', (id, key) => {
      console.log('NEW PUBLIC KEY : ', id, key)
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
      console.log(id, ' CHANGE USERNAME TO :', newUsername)
      setUsers(users => users.map(user => {
        console.log(user)
        return user.id === id 
        ? {
          ...user,
          username: newUsername
        }
        : user
      }))
    })

    socket.on('user leave', (id) => {
      console.log('USER LEAVE : ', id)
      setUsers(users => users.filter(user => user.id !== id))
    })
  }, [])


  React.useEffect(() => {

    console.log('use effect sharing key')
    console.log(users)

    const listener1 = (id, message) => {
      console.log('====================|RECEIVE 1|====================')
      console.log(users)
      const friend = users.find(user => user.id === id)
      console.log('friend ', friend)
      const friend_public_key = friend.public_key[0]
      const friend_n = friend.public_key[1]

      const private_key = key.private_key
      const n = key.n

      console.log('key ', private_key, n)
      console.log(message)

      const decrypted = decrypt_with_signature(message, friend_public_key, friend_n, private_key, n)
      console.log('decrypted ', decrypted)
    
      if (decrypted !== '') {
        const [N1, idCheck] = decrypted.split(' ')
        console.log('N1 ID IDCHeck', N1, id, idCheck)
        localStorage.setItem('N1', N1)

        if (idCheck === id) {
          const N2 = Date.now()
          console.log('N2 ', N2)

          localStorage.setItem('N2', N2)
  
          const message = N1 + ' ' + N2
          const encrypted_message = encrypt_with_signature(message, friend_public_key, friend_n, private_key, n)

          console.log('encrypted message ', encrypted_message)
  
          socket.emit('2', id, encrypted_message)
          console.log('====================|SEND 2|====================')
        }
      }
    }
    socket.on('1', listener1)

    const listener2 = (id, message) => {
      console.log('====================|RECEIVE 2|====================')
      const friend = users.find(user => user.id === id)
      console.log('friend ', friend)
      const friend_public_key = friend.public_key[0]
      const friend_n = friend.public_key[1]

      const private_key = key.private_key
      const n = key.n
      console.log('key ', private_key, n)

      const decrypted = decrypt_with_signature(message, friend_public_key, friend_n, private_key, n)
      console.log('decrypted ', decrypted)

      if (decrypted !== '') {
        const N1check = localStorage.getItem('N1')
        const [N1, N2] = decrypted.split(' ')
        console.log('N1 N1Check N2', N1, N1check, N2)
        if (N1 === N1check) {
          const message = N2
          const encrypted_message = encrypt_with_signature(message, friend_public_key, friend_n, private_key, n)
          console.log('encrypted message ', encrypted_message)
  
          socket.emit('3', id, encrypted_message)
          console.log('====================|SEND 3|====================')
        }
      }
    }
    socket.on('2', listener2)

    const listener3 = (id, message) => {
      console.log('====================|RECEIVE 3|====================')
      const friend = users.find(user => user.id === id)
      const friend_public_key = friend.public_key[0]
      const friend_n = friend.public_key[1]
      console.log('friend ', friend)

      const private_key = key.private_key
      const n = key.n
      console.log('key ', private_key, n)

      const decrypted = decrypt_with_signature(message, friend_public_key, friend_n, private_key, n)
      console.log('decrypted ', decrypted)

      if (decrypted !== '') {
        const N2 = decrypted
        const N2check = localStorage.getItem('N2')
        console.log('N2 N2check', N2, N2check)
        if (N2 === N2check) {
          const N1 = localStorage.getItem('N1')
          const session_key = Date.now().toString(36)
          console.log('session key', session_key)

          setUsers(users => users.map(user => {
            const new_user = {
              ...user,
              session_key,
              isFriend: true,
              des: new DES(session_key)
            }

            console.log('new user', new_user)

            return user.id === id
            ? new_user
            : user
          }))

          const message = N1 + ' ' + session_key
          const encrypted_message = encrypt_with_signature(message, friend_public_key, friend_n, private_key, n)
          console.log('encrypted message ', encrypted_message)
          socket.emit('4', id, encrypted_message)
          console.log('====================|SEND 4|====================')
        }
      }
    }
    socket.on('3', listener3)

    const listener4 = (id, message) => {
      console.log('====================|RECEIVE 4|====================')
      const friend = users.find(user => user.id === id)
      const friend_public_key = friend.public_key[0]
      const friend_n = friend.public_key[1]
      console.log('friend ', friend)

      const private_key = key.private_key
      const n = key.n
      console.log('key ', private_key, n)

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

            console.log('new user', new_user)

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
      alert('you have been added by ', users.find(user => user.id === id))
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
      console.log('users now', users)
      const user = users.find(user => user.id === id)
      console.log('user', user)
      const des = new DES(user.session_key)
      console.log('ya ? ', currentChat, id)
      if (currentChat === id) {
        setChats(chats => [...chats, {
          ...message,
          content: des.decrypt(message.content)
        }])
      }
    }
    socket.on('new chat', listener_chat)

    const listener_pull_chat = (id, messages) => {
      console.log(id)
      const user = users.find(user => user.id === id)
      console.log(user)
      const des = new DES(user.session_key)
      console.log('current user', user, user.session_key)
      console.log('pulled messages', messages)

      messages.forEach(message => {
        console.log('raw', message.content)
        console.log('plain', des.decrypt(message.content))
      });

      const decryptedMessages = messages.map(message => ({
        ...message,
        content: des.decrypt(message.content)
      }))

      console.log(decryptedMessages)
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
