import React from "react"
import { socket } from "../App"
import DES from "../utils/des"


const boxColor = ['#bababa', '#449bf2']
const align = ['end', 'start']

const Chat = ({users, currentChat, chats}) => {

    const [message, setMessage] = React.useState('')

    const onMessageChange = e => {
        setMessage(e.target.value)
    }

    const username = currentChat === null ? '' : users.find(user => user.id === currentChat)['username']

    const user = users.find(user => user.id === currentChat)
    const des = user && new DES(user.session_key)

    const onSend = () => {
        console.log(currentChat)
        console.log(user.session_key)
        const encrypted_message = des.encrypt(message)

        socket.emit('new chat', currentChat, encrypted_message)
    }
    return (
        <div style={{padding: '20px', flex: 1}}>
            <h1>{username}</h1>
            <div style={{display: 'flex', flexDirection: 'column', maxHeight: '600px', overflow: 'auto'}}>
                {chats.map((val, index) => (
                    <div key={index} style={
                        {
                            alignSelf: align[val.sender === currentChat],
                            background: boxColor[val.sender === currentChat],
                            padding: '8px',
                            borderRadius: '8px',
                            boxSizing: 'border-box',
                            maxWidth: '250px'
                        }}
                    >
                        {val.content}
                    </div> 
                ))}
            </div>
            <div style={{marginTop: '16px'}}>
                {currentChat !== null &&
                <form style={{display: 'flex', gap: '8px'}}>
                    <input type="text" name="message" id="message" style={{flex: 1}} value={message} onChange={onMessageChange}/>
                    <button type="button" onClick={onSend}>send</button>
                </form>
                }
                
            </div>
        </div>
    )
}

export default Chat