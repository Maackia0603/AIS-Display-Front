import Home from "./views/Home.jsx";
import Display from "./views/Display.jsx";
import Agent from "./views/Agent.jsx";
import GeoJsonDisplay from "./views/GeoJsonDisplay.jsx";

// 编写路由表 
export const routes = [
    {
        path: "/",
        element: <Home/>,
    },
    {
        path: "/home",
        element: <Home/>,
    },    
    {
        path: "/display",
        element: <Display />,
    },
    {
        path: "/agent",
        element: <Agent />,
    },
    {
        path: "/geojsondisplay",
        element: <GeoJsonDisplay />,
    },
];