import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CreateRoom from "./components/CreateRoom";
import Room from "./components/Room";

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={CreateRoom} />
        <Route path="/room/:roomId" component={Room} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
