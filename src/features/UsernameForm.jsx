import React from "react"
import { socket } from "../App"

const UsernameForm = ({defaultUsername}) => {

    const [username, setUsername] = React.useState(defaultUsername)

    const onUsernameChange = e => {
        setUsername(e.target.value)
    }

    const onUsernameChangeSubmit = () => {
        socket.emit('change username', socket.id, username)
    }
    return (
        <div>
            <h1>Set Username</h1>
            <form>
                <input type="text" name="username" id="username" value={username} onChange={onUsernameChange}/>
                <button type="button" onClick={onUsernameChangeSubmit}>Change username</button>
            </form>
        </div>
    )
}

export default UsernameForm