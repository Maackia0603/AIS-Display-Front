import React from "react";
import { useRoutes } from "react-router-dom";
import { routes } from './routes.jsx';
import Header from "./components/Header.jsx";

function App(){
    
    return (
        <div>
            <Header />
            {useRoutes(routes)}
        </div>
    )
}

export default App;