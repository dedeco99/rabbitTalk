import React from "react";
import { v4 as uuid } from "uuid";

const CreateRoom = (props) => {
  function createRoom() {
    const id = uuid();
    props.history.push(`/room/${id}`);
  }

  return <button onClick={createRoom}>Create Room</button>;
};

export default CreateRoom;
